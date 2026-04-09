import {Sandbox} from "e2b";
import { Request, Response } from "express";

export const readFileController=async(req:Request,res:Response)=>{
    const {paths}=req.body;
    const sandboxId=req.sandboxId;
    const project_id=req.projectId;
    const sandbox=await Sandbox.connect(sandboxId);
    const contents=[];
    try{
        for (const path of paths){
            const fullPath=`/home/user/myapp/${path}`;
            console.log(`✓ Read: ${path}`);
            const content=await sandbox.files.read(fullPath);
            contents.push(content);
        }

        res.json({
        success: true,
        output: contents
        });
    }catch(err:any){
        console.error("Read error:", err);

        return res.status(500).json({
            success: false,
            error: err.message || "Failed to read file"
        });
    }
}