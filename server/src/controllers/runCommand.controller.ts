import {Sandbox} from "e2b";
import { Request, Response } from "express";

export const runCommandController=async (req:Request,res:Response)=>{
    const {path,command}=req.body
    const sandboxId=req.sandboxId
    try{
        const fullPath=`/home/user/myapp/${path||""}`;
        const sandbox=await Sandbox.connect(sandboxId);
        
        const cmdResult = await sandbox.commands.run(`cd ${fullPath} && ${command}`);

        console.log(`✓ Command Run Succesfully: ${command} at ${path}`);
        res.json({
        success: true,
        output: `Command Run Succesfully: ${command} at ${path}`
        });
    }catch(err){
        res.json({
        success: false,
        output: err
        });
    }
}