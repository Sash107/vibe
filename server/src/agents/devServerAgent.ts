import { Response } from "express";
import { isValidResponse } from "../utils/isValidResponse.js";
import { streamAndWriteFiles } from "./streamAndWriteFiles.js";
import { getSandboxContext } from "../utils/getSandboxContext.js";
import { connectSandbox } from "../utils/connectSandbox.js";
import { rollbackProject } from "../repositories/rollback.repository.js";
import { killSandbox } from "../utils/killSandbox.js";

export async function selfHealDevServer(
  res: Response,
  message: { role: string; content: string }[],
  sandboxID: string,
  project_id: number
) {
  const MAX_ITERATIONS = 10;
  let iteration = 0;
  let isValid = false;
  let systemErrorCount = 0;

  const sandbox = await connectSandbox(sandboxID);

  while (iteration < MAX_ITERATIONS && !isValid) {
    iteration++;
    console.log(`\n--- Curl check iteration ${iteration} ---`);

    // Kill old server
    console.log("-> Executing: Kill old server safely");

    await sandbox.commands.run(`
    # Kill tracked server process
    kill -9 $(cat /tmp/server.pid 2>/dev/null) 2>/dev/null || true

    # Kill ports
    fuser -k 3000/tcp 2>/dev/null || true
    fuser -k 3001/tcp 2>/dev/null || true
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true

    # Ensure no other next.js / node processes are holding file locks
    pkill -9 -f "next" 2>/dev/null || true
    pkill -9 -f "node" 2>/dev/null || true
    `, { timeoutMs: 5000 });

    console.log("<- Done: Kill old server");

    console.log("-> Waiting 1 second");
    await new Promise((r) => setTimeout(r, 1000));
    console.log("<- Done: Wait");

    // Clear logs
    console.log("-> Executing: Clear server.log");
    await sandbox.commands.run(`rm -f /tmp/server.log`);
    console.log("<- Done: Clear server.log");
    
    // 🛡️ Prevent permission issues BEFORE starting
    // 🛡️ Full system cleanup BEFORE starting (FIXED)
    console.log("-> Cleanup: killing ports");

    // safest: don't let this hang
    await sandbox.commands.run(
    `fuser -k 3000/tcp 2>/dev/null || true && lsof -ti:3000 | xargs kill -9 2>/dev/null || true`,
    { timeoutMs: 3000 }
    ).catch(() => {});

    await sandbox.commands.run(
    `fuser -k 3001/tcp 2>/dev/null || true && lsof -ti:3001 | xargs kill -9 2>/dev/null || true`,
    { timeoutMs: 3000 }
    ).catch(() => {});

    console.log("-> Cleanup: removing .next");

    // 🔥 FIX: take ownership BEFORE delete
    await sandbox.commands.run(`
      chown -R user:user /home/user/myapp/.next 2>/dev/null || true
      chown -R user:user /home/user/myapp/.next-dev 2>/dev/null || true
    `, { timeoutMs: 5000 }).catch(() => {});

    await sandbox.commands.run(`
      chmod -R 777 /home/user/myapp/.next 2>/dev/null || true
      chmod -R 777 /home/user/myapp/.next-dev 2>/dev/null || true
    `, { timeoutMs: 5000 }).catch(() => {});

    // now delete (this will actually work)
    await sandbox.commands.run(`
      rm -rf /home/user/myapp/.next
      rm -rf /home/user/myapp/.next-dev
      rm -rf /home/user/myapp/.next-custom
    `, { timeoutMs: 5000 }).catch(() => {});

    console.log("-> Cleanup: removing cache");

    // ⚠️ THIS is dangerous → limit it
    await sandbox.commands.run(
    `rm -rf /home/user/myapp/node_modules/.cache`,
    { timeoutMs: 5000 }
    ).catch(() => {
    console.log("⚠️ Cache removal skipped (too slow)");
    });

    console.log("-> Cleanup: recreate .next");

    await sandbox.commands.run(
    `mkdir -p /home/user/myapp/.next && chmod 777 /home/user/myapp/.next`,
    { timeoutMs: 3000 }
    ).catch(() => {});

    console.log("<- Done: Full system cleanup");

    // Start server
    console.log("-> Executing: Start Next.js server (nohup npm run dev)");
    await sandbox.commands.run(
      `cd /home/user/myapp && nohup npm run dev > /tmp/server.log 2>&1 & PID=$! && echo $PID > /tmp/server.pid`
    );
    console.log("<- Done: Start Next.js server");

    // 🔁 Poll instead of fixed delay
    let attempts = 0;
    let status = "000";

    while (attempts < 10) {
      const resCheck = await sandbox.commands.run(
        `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || true`
      );

      status = resCheck.stdout.trim();
      if (status !== "000") break;

      await new Promise((r) => setTimeout(r, 2000));
      attempts++;
    }

    if (isValidResponse(status)) {
      isValid = true;
      console.log("✓ App is running correctly");
      break;
    }

    if (iteration >= MAX_ITERATIONS) {
      console.log("Max iterations reached without success");
      await rollbackProject(project_id);
      await killSandbox(sandboxID);
      break;
    }

    // 🧾 Capture logs
    await sandbox.commands.run(
      `tail -n 2000 /tmp/server.log > /tmp/server_snapshot.log || true`
    );

    // 🔍 Extract meaningful errors (FIXED)
    const errorBlock = await sandbox.commands.run(
      `
      grep -i -E -A 40 -B 15 \
      "(typeerror|referenceerror|syntaxerror|rangeerror|cannot find module|module not found|err_module_not_found|unexpected token|enoent|eacces|eperm|eaddrinuse|econnrefused|econnreset|etimedout|epipe|err_socket|err_http_headers_sent|failed to compile|build failed|compilation error|module build failed|error:|unhandledrejection|unhandled promise rejection)" \
      /tmp/server.log \
      | grep -vi "warning" \
      | awk '!seen[$0]++' \
      || true
      `
    );
    if (!errorBlock.stdout.trim()) {
        console.log("⚠️ No meaningful error found, retrying...");
        continue;
    }
    const errorText = errorBlock.stdout.trim() || "No errors found in log";

    console.log("🔍 ERROR TEXT:\n", errorText);
    
    // 🎯 Better primary error detection
    const primaryErrorMatch = errorText.match(
      /(?:TypeError|ReferenceError|SyntaxError|Error): .+/i
    );

    const primaryError =
      primaryErrorMatch?.[0] ||
      errorText
        .split("\n")
        .find((line) =>
          /TypeError|ReferenceError|SyntaxError|Cannot find module/i.test(line)
        ) ||
      errorText.split("\n")[0];

    // 🧠 Error classification
    const isCodeError = /TypeError|ReferenceError|SyntaxError/i.test(errorText);
    const isDependencyError =
      /Cannot find module|Module not found|Can't resolve/i.test(errorText);
    const isSystemError =
      /\b(EACCES|EPERM|permission denied)\b/i.test(errorText);

    // 📦 Auto install dependency
    if (isDependencyError && !isCodeError) {
      const match = errorText.match(
        /(?:Cannot find module|Module not found|Can't resolve) '([^']+)'/i
      );

      if (match) {
        let rawPkg = match[1];
        const isLocalOrAlias =
          rawPkg.startsWith(".") ||
          rawPkg.startsWith("/") ||
          rawPkg.startsWith("@/");

        if (!isLocalOrAlias) {
          const parts = rawPkg.split("/");
          const pkg = rawPkg.startsWith("@")
            ? `${parts[0]}/${parts[1]}`
            : parts[0];

          console.log(`📦 Installing missing package: ${pkg}`);

          await sandbox.commands.run(
            `cd /home/user/myapp && npm install ${pkg} --save --prefer-offline --no-audit`
          );

          continue;
        }
      }
    }

    // 🚫 Handle system errors safely
    if (isSystemError) {
    systemErrorCount++;
    console.log("🚫 System-level error detected");

    if (systemErrorCount <= 2) {
        console.log("🔧 Fixing permissions + cleaning build...");

        await sandbox.commands.run(`
          # Aggressively kill Next.js and Node before doing system cleanup
          pkill -9 -f "next" 2>/dev/null || true
          pkill -9 -f "node" 2>/dev/null || true
          
          chown -R user:user /home/user/myapp/.next /home/user/myapp/.next-dev 2>/dev/null || true
          chmod -R 777 /home/user/myapp/.next /home/user/myapp/.next-dev 2>/dev/null || true
          rm -rf /home/user/myapp/.next /home/user/myapp/.next-dev /home/user/myapp/node_modules/.cache || true
        `, { timeoutMs: 8000 });

        continue;
    } else {
            console.log("⚠️ Escalating system error to LLM...");
        }
    }

    // 📂 Extract relevant files
    const fileMatches =
      errorText.match(/\b([A-Za-z0-9_/.-]+\.(ts|tsx|js|jsx))\b/g) || [];

    const uniqueFiles = [...new Set(fileMatches)]
      .filter(
        (f) =>
          (f.startsWith("app/") ||
            f.startsWith("components/") ||
            f.startsWith("lib/")) &&
          !f.includes("node_modules") &&
          !f.endsWith(".d.ts") &&
          !f.includes(".next")
      )
      .slice(0, 5);

    console.log("📂 Relevant files:", uniqueFiles);

    const fileContents: string[] = [];

    for (const file of uniqueFiles) {
      try {
        const cleanPath = file.replace(/^(\.\/|webpack:\/\/)/, "");

        const exists = await sandbox.commands.run(
          `[ -f /home/user/myapp/${cleanPath} ] && echo "YES" || echo "NO"`
        );

        if (!exists.stdout.includes("YES")) continue;

        const data = await sandbox.commands.run(
          `cat /home/user/myapp/${cleanPath}`
        );

        fileContents.push(`\n--- File: ${cleanPath} ---\n${data.stdout}`);
      } catch {
        console.log(`Failed to read file: ${file}`);
      }
    }

    // fallback
    if (fileContents.length === 0) {
      const fallback = await sandbox.commands.run(
        `find /home/user/myapp/app /home/user/myapp/components -name "*.tsx" | head -n 2`
      );

      const fallbackFiles = fallback.stdout.split("\n").filter(Boolean);

      for (const file of fallbackFiles) {
        const data = await sandbox.commands.run(`cat ${file}`);
        fileContents.push(`\n--- File: ${file} ---\n${data.stdout}`);
      }
    }

    const context = await getSandboxContext(sandbox);

    // 🤖 LLM prompt (improved)
    message.push({
      role: "user",
      content: `The app failed to start.

        === PRIMARY ERROR ===
        ${primaryError}

        === ERROR LOG ===
        ${errorText}

        === MOST RELEVANT FILES ===
        ${fileContents.join("\n") || "No files found"}

        === PROJECT CONTEXT ===
        ${context}

        Instructions:
        1. Identify ROOT cause (not symptoms)
        2. Fix ONLY the root cause
        3. Do NOT modify unrelated files
        4. Keep changes minimal
        5. Return FULL updated files only
        6. If error unclear, infer most likely cause
        7. Prefer fixing imports/config/runtime over rewriting logic
        8. Do not delete working code unnecessarily`,
    });

    res.write(`\n\n[Fix attempt ${iteration}]\n\n`);

    await streamAndWriteFiles(res, message, sandboxID, project_id);

    console.log("📦 Running npm install...");
    await sandbox.commands.run(
      `cd /home/user/myapp && npm install`,
      { timeoutMs: 120000 }
    );
  }
}