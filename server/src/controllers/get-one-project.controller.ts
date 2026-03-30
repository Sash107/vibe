import { Request, Response } from "express";
import { getProjectSchema } from "../utils/zodSchemas.js";
import { prisma } from "../../lib/prisma.js";

export const singleProject=async(req:Request,res:Response)=>{
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

        const project=await prisma.project.findFirst({where:{id:project_id,user_id}})

        if(!project){
            return res.status(404).json({
                message:"Project not found"
            })
        }

        return res.status(200).json({
            message:"Project found",
            project
        })
    }catch(err){
        return res.status(500).json({
            err
        })
    }

}