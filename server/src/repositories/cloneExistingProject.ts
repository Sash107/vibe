import { prisma } from "../../lib/prisma.js";
import { connectSandbox } from "../utils/connectSandbox.js";

export async function setExistingProjectInSandbox(project_id:number,sandbox_id:string){
     
    try{
        const files=await prisma.file.findMany({
            where:{
                project_id
            }
        })
        const sandbox=await connectSandbox(sandbox_id);

        for (const file of files){
        const fullPath=`/home/user/myapp/${file.path}`;
        await sandbox.commands.run(`mkdir -p $(dirname "${fullPath}")`)
        await sandbox.files.write(fullPath,file.content);
        }
    }catch(err){
        console.log("Error writing to sandbox: ",err);
    }

}