import { Request, Response } from "express";
import { streamAndWriteFiles } from "../agents/streamAndWriteFiles.js";
import { connectSandbox } from "../utils/connectSandbox.js";
import { selfHealDevServer } from "../agents/devServerAgent.js";
import { cloneTemplateToProject } from "../repositories/cloneTemplateToProject.js";
import { chat } from "../repositories/chats.repository.js";
import { sandboxRecord } from "../repositories/sandboxRecord.repository.js";
import { inngest } from "../inngest/index.js";


export const postMessage =async(req:Request,res:Response)=>{
    try {
        const {my_message}=req.body
        const project_id = parseInt(String(req.params.project_id));
        const message:{role:string,content:string}[]=[
            {role:"user",content:my_message}
        ]
        if(!message){
            return res.status(400).json({
                message:"No data send"
            })
        }
        
        const sandboxSchema = await sandboxRecord(project_id);
        if (!sandboxSchema) {
            await inngest.send({ name: "app/getSandboxId", data: { project_id } });
            return res.status(202).json({ message: "Sandbox is being created. Please retry in a few seconds." });
        }
        const sandboxID = sandboxSchema.sandbox_id;
        const sandboxURL=sandboxSchema?.url;
        if (!sandboxID && !sandboxURL) return res.status(400).json({ message: "Sandbox not ready" });
        
        await chat(my_message,project_id);
        await cloneTemplateToProject(project_id,3);
        const fullcode = await streamAndWriteFiles(res,message,sandboxID,project_id);

        message.push({role:"assistant",content:fullcode});

        const sandbox = await connectSandbox(sandboxID);
        await sandbox.commands.run(`cd /home/user/myapp && npm install`,
            {timeoutMs:120_000})
        
        await selfHealDevServer(res,message,sandboxID,project_id);
        console.log("Done");
        res.end();

    } catch (error) {
        if (!res.headersSent) {
            return res.status(500).json({ error });
        }
    }
}