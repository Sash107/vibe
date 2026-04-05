import { prisma } from "../../lib/prisma.js";

export async function writeInDB(path:string,content:string,project_id:number){
    await prisma.file.upsert({
        where:{project_id_path:{
            project_id,path
        }},
        create:{
            project_id,path,content
        },
        update:{
            content
        }
    })
}