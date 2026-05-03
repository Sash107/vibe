import {Sandbox} from "e2b";
import { Request, Response } from "express";
import { success } from "zod";

export const runCommandController=async (req:Request,res:Response)=>{
    const {path,command}=req.body
    const sandboxId=req.sandboxId
    try{
        let normalizedPath = path || "";
        if (normalizedPath.startsWith("/home/user/myapp")) {
            normalizedPath = normalizedPath.slice("/home/user/myapp".length);
        }
        normalizedPath = normalizedPath.replace(/^\/+/, "");
        const fullPath = `/home/user/myapp/${normalizedPath}`;
        const sandbox=await Sandbox.connect(sandboxId);
        
        const cmdResult = await sandbox.commands.run(`cd ${fullPath} && ${command}`);

        console.log(`✓ Command Run Succesfully: ${command} at ${path}`);
        res.json({
            output:cmdResult
        });
    }catch(err: any){
        res.json({
            success: false,
            error: err?.message || "Unknown error"
        });
    }
}