import fs from "fs";
import path from "path";
import { prisma } from "../../lib/prisma.js"; // adjust if needed

const OUTPUT_DIR = "/home/suyash/Sash/down_test"; // 🔥 change this
const TEMPLATE_ID = 3; // 🔥 change this

async function main() {
  console.log("📦 Fetching template files...");

  const files = await prisma.templateFile.findMany({
    where: { template_id: TEMPLATE_ID },
  });

  if (!files.length) {
    console.log("❌ No files found for this template");
    return;
  }

  console.log(`Found ${files.length} files`);

  for (const file of files) {
    const filePath = path.join(OUTPUT_DIR, file.path);

    // ensure directory exists
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });

    // write file
    fs.writeFileSync(filePath, file.content, "utf-8");
  }

  console.log("✅ Project created successfully at:", OUTPUT_DIR);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });