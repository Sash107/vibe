import { Response } from "express";
import { isValidResponse } from "../utils/isValidResponse.js";
import { streamAndWriteFiles } from "./streamAndWriteFiles.js";
import { getSandboxContext } from "../utils/getSandboxContext.js";
import { connectSandbox } from "../utils/connectSandbox.js";
import { rollbackProject } from "../repositories/rollback.repository.js";
import { killSandbox } from "../utils/killSandbox.js";

export async function selfHealDevServer(res:Response,message:{role:string,content:string}[],sandboxID:string,project_id:number){
    const MAX_ITERATIONS=10;
    let iteration=0;
    let isValid=false;
    const sandbox=await connectSandbox(sandboxID)
    while(iteration<MAX_ITERATIONS && !isValid){
        iteration++;
        console.log(`\n--- Curl check iteration ${iteration} ---`);

        await sandbox.commands.run(`kill -9 $(cat /tmp/server.pid 2>/dev/null) 2>/dev/null || true`, { timeoutMs: 5_000 });

        await new Promise((r) => setTimeout(r, 1000));

        await sandbox.commands.run(`rm -f /tmp/server.log`, { timeoutMs: 5_000 });

        await sandbox.commands.run(`cd /home/user/myapp && nohup npm run dev > /tmp/server.log 2>&1 & PID=$! && echo $PID > /tmp/server.pid`, { timeoutMs: 15_000 });

        await new Promise((r) => setTimeout(r, 12000));

        const serverResponse = await sandbox.commands.run(`curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://localhost:3000 || true`, { timeoutMs: 15_000 });

        if(isValidResponse(serverResponse.stdout)){
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
        console.log("taking snapshot");
        await sandbox.commands.run(`
            tail -n 500 /tmp/server.log > /tmp/server_snapshot.log || true
            `, { timeoutMs: 5_000 });
        console.log("running awk");

            const errorBlock = await sandbox.commands.run(`
            awk '
                BEGIN { IGNORECASE=1 }

                /error|exception|fatal|typeerror|referenceerror|syntaxerror|cannot find module|module not found|unexpected token|enoent|eacces|failed to compile|build error/ {
                if ($0 !~ /warn/ && !found) {
                    found=1; count=0;
                    print "\\n--- ERROR BLOCK ---"
                }
                }

                found {
                print;
                count++;
                if (count >= 20) found=0;
                }
            ' /tmp/server_snapshot.log | head -n 150 || true
            `, { timeoutMs: 10_000 });

            console.log("awk done");
        const errorText = errorBlock.stdout.trim() || "No errors found in log";

        const match = errorText.match(/Cannot find module '(.*?)'|Module not found.*?'(.*?)'/);
        
        if (match) {
            const pkg = match[1] || match[2];
            console.log(`📦 Auto-installing missing package: ${pkg}`);
            if (!pkg.startsWith(".") && !pkg.startsWith("/")){
                await sandbox.commands.run(`cd /home/user/myapp && npm install ${pkg}`, { timeoutMs: 120_000 });
            }
        }

        const context = await getSandboxContext(sandbox);
        message.push({
            role: "user",
            content: `The app failed to start.

            === MOST RELEVANT ERROR ===
            ${errorText}

            === PROJECT CONTEXT ===
            ${context}

            Instructions:
            1. Identify the root cause (be precise)
            2. Fix the issue
            3. Rewrite ONLY affected files
            4. If a dependency is missing, update package.json`
        });

        res.write(`\n\n[Fix attempt ${iteration}]\n\n`);

        await streamAndWriteFiles(res, message, sandboxID,project_id);
        console.log("Running npm install...");
        await sandbox.commands.run(`cd /home/user/myapp && npm install`, { timeoutMs: 120_000 });
    }
}