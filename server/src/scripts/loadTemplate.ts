import fs from "fs";
import path from "path";
import { prisma } from "../../lib/prisma.js"; // adjust path

const TEMPLATE_NAME = "nextjs14-base";
const BASE_PATH = "/home/suyash/Sash/test"; // 

const IGNORE = [
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".env",
];

const IGNORE_EXTS = [
  ".ico", ".png", ".jpg", ".jpeg", ".webp", ".avif",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".mp4", ".webm", ".ogg", ".mp3", ".wav",
  ".pdf", ".zip", ".tar", ".gz"
];

function getAllFiles(dir: string, baseDir: string, fileList: any[] = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    if (IGNORE.includes(file)) continue;

    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      getAllFiles(fullPath, baseDir, fileList);
    } else {
      const ext = path.extname(file).toLowerCase();
      if (IGNORE_EXTS.includes(ext)) {
        console.log(`Skipping binary file: ${file}`);
        continue;
      }

      const content = fs.readFileSync(fullPath, "utf-8");

      // Postgres strings CANNOT contain null bytes (\x00). Safe-guard:
      if (content.includes("\x00")) {
        console.log(`Skipping file with null byte: ${file}`);
        continue;
      }

      fileList.push({
        path: path.relative(baseDir, fullPath).replace(/\\/g, "/"),
        content,
      });
    }
  }

  return fileList;
}

async function main() {
  console.log("📦 Reading Next.js template...");

  const files = getAllFiles(BASE_PATH, BASE_PATH);

  console.log(`Found ${files.length} files`);

  // 1. Create template
  const template = await prisma.template.create({
    data: {
      name: TEMPLATE_NAME,
    },
  });

  // 2. Insert files
  await prisma.templateFile.createMany({
    data: files.map((file) => ({
      template_id: template.id,
      path: file.path,
      content: file.content,
    })),
  });

  console.log("✅ Template stored successfully!");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });