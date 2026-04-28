import { prisma } from "./lib/prisma.js";

async function main() {
    try {
        const files = await prisma.file.findMany({ where: { project_id: 20 }, orderBy: { updated_at: 'desc' }, take: 5 });
        console.log("Most recently updated files:");
        for (const f of files) {
            console.log(`- ${f.path} (created: ${f.created_at}, updated: ${f.updated_at})`);
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
