import { prisma } from "./lib/prisma.js";
import { Sandbox } from "e2b";

async function main() {
    try {
        const schema = await prisma.sandbox.findFirst({ where: { project_id: 21 } });
        if (!schema) {
            console.log("No sandbox found");
            return;
        }
        console.log("Connecting to sandbox:", schema.sandbox_id);
        const sandbox = await Sandbox.connect(schema.sandbox_id);
        
        // Check running processes
        const ps = await sandbox.commands.run("ps aux");
        console.log("Processes:\n", ps.stdout);
        
        // Check ports
        const ports = await sandbox.commands.run("netstat -tuln");
        console.log("Ports:\n", ports.stdout);
        
        // Check content of page.tsx
        const content = await sandbox.files.read("/home/user/myapp/app/page.tsx");
        console.log("page.tsx length:", content.length);
        console.log("page.tsx snippet:", content.substring(0, 100));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
