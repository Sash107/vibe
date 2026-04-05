import { prisma } from "../../lib/prisma.js";

export async function chat(message:string,project_id:number){
    await prisma.message.create({
        data:{
            role:"user",
            content:message,
            project_id
        }
    })
}