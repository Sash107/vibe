import { prisma } from "../../lib/prisma.js";

export async function sandboxRecord(project_id: number) {
    return await prisma.sandbox.findFirst({
        where: {
            project_id,
            expires_at: { gt: new Date() }
        }
    });
}