import { prisma } from "./lib/prisma.js";

async function main() {
    try {
        const files = await prisma.file.findMany({ where: { project_id: 20 } });
        console.log(`Project 20 has ${files.length} files.`);
        if (files.length > 0) {
            console.log("Paths:", files.map(f => f.path));
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
