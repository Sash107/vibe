import {Sandbox} from "e2b";
import { Request, Response } from "express";
import { writeInDB } from "../repositories/writeInDB.repository.js";

export const createFileController=async(req:Request,res:Response)=>{
    const {files}=req.body;
    const sandboxId=req.sandboxId;
    const project_id=req.projectId;

    if (!sandboxId) {
        return res.status(400).json({ success: false, error: "Sandbox not ready" });
    }

    try{
        const sandbox = await Sandbox.connect(sandboxId);

        for (const file of files){
            const path = file.path;
            const content = String(file.content ?? "");
            let normalizedPath = path;
            if (normalizedPath.startsWith("/home/user/myapp")) {
                normalizedPath = normalizedPath.slice("/home/user/myapp".length);
            }
            normalizedPath = normalizedPath.replace(/^\/+/, "");
            const fullPath = `/home/user/myapp/${normalizedPath}`;

            await sandbox.commands.run(`mkdir -p $(dirname "${fullPath}")`);
            await sandbox.files.write(fullPath, content);
            await writeInDB(normalizedPath, content, project_id);

            console.log(`✓ Written: ${normalizedPath}`);
        }
        res.json({
            success: true,
            output: `Created ${files}`
        });  
    }catch(err:any){
        console.error("[createFile] Error:", err);
        res.status(500).json({
            success: false,
            error: err?.message ?? String(err)
        });
    }
}