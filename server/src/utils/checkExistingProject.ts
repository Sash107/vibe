import { prisma } from "../../lib/prisma.js";

export async function checkExistingProject(project_id:number){
    const file = await prisma.file.findFirst({
        where:{
            project_id
        }
    })
    if (!file) return false
    return true
}