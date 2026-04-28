import { Request, Response } from "express";
import { getProjectSchema } from "../utils/zodSchemas.js";
import { startOneProject } from "../utils/startOneProject.js";

export const startSingleProject=async(req:Request,res:Response)=>{
    try{
        const result=getProjectSchema.safeParse(req.params);
        if(!result.success){
            return res.status(400).json({
                message:"Invalid project ID"
            })
        }
        const {project_id}=result.data;

        const user_id=req.user?.id
        if (!user_id) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }
        const Sandbox=await startOneProject(project_id);
        const sandbox_id=Sandbox.sandbox_id
        const sandboxURL=Sandbox.sandboxURL
        res.status(200).json({sandbox_id,sandboxURL})
    }catch(err){
        res.status(500).json({
            error:err
        })
    }
}