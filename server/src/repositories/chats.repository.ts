import { prisma } from "../../lib/prisma.js";

export async function chat(message:string,project_id:number,role:"user" | "assistant"){
    await prisma.message.create({
        data:{
            role: role as any,
            content:message,
            project_id
        }
    })
}