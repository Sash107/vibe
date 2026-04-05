import { prisma } from "../../lib/prisma.js";

export async function rollbackProject(project_id:number){
    await prisma.file.deleteMany({
        where:{project_id}
    })
}