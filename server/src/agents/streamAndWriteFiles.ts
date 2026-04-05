import { Response } from "express";
import { connectSandbox } from "../utils/connectSandbox.js";
import { writeInDB } from "../repositories/writeInDB.repository.js";

const OPEN_TAG_REGEX=/<vibe-write file_path="([^"]+)">/;
const CLOSE_TAG="</vibe-write>"


export async function streamAndWriteFiles(res:Response,message:{role:string,content:string}[],sandboxID:string,project_id:number){
    const python_response=await fetch("http://127.0.0.1:8000/ask_llm",{
        method:"POST",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({
            messages: message
        })
    })

    const reader=python_response.body?.getReader();
    const decoder=new TextDecoder();

    if(!reader){
        res.status(500).json({error:"No response body"})
        return ""
    }

    let mycode=""
    let fullcode=""

    while(true){
        const {done,value}=await reader.read();
        if(done)break;

        const chunk = decoder.decode(value,{stream:true});
        res.write(chunk);
        mycode+=chunk;
        fullcode+=chunk;

        while(mycode.includes(CLOSE_TAG)){

            const closeIndex=mycode.indexOf(CLOSE_TAG);
            const block=mycode.slice(0,closeIndex+CLOSE_TAG.length);
            mycode=mycode.slice(closeIndex+CLOSE_TAG.length);

            const openMatch=block.match(OPEN_TAG_REGEX);
            if(!openMatch)continue;

            const file_path=openMatch[1];
            if(!file_path)continue;
            const openTagEnd=block.indexOf(">",block.indexOf(openMatch[0]))+1;

            const content=block.slice(openTagEnd,closeIndex).trim();
            // console.log(file_path+"\n\n");
            // console.log(content);
            // console.log("------------------------------------------------------")

            try{
                const fullPath=`/home/user/myapp/${file_path}`;

                const sandbox=await connectSandbox(sandboxID)

                await sandbox.commands.run(`mkdir -p $(dirname "${fullPath}")`)
                await sandbox.files.write(fullPath,content);
                await writeInDB(file_path,content,project_id);
                console.log(`✓ Written: ${file_path}`);

            }catch(err){
                console.log("Error writing to sandbox: ",err);
            }
        }
    }
    return fullcode;
}