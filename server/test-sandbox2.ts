import { prisma } from "./lib/prisma.js";

async function main() {
    try {
        const schema = await prisma.sandbox.findFirst({ orderBy: { created_at: 'desc' } });
        if (!schema) {
            console.log("No sandboxes found");
            return;
        }
        console.log("Most recent sandbox for project:", schema.project_id);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
