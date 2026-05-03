import { Request, Response } from "express";
import { getProjectSchema } from "../utils/zodSchemas.js";
import { prisma } from "../../lib/prisma.js";

export const getAllMessages =async(req:Request,res:Response)=>{
    try {
        const result = getProjectSchema.safeParse(req.params);
        const user_id=req.user?.id

        if(!user_id){
            return res.status(401).json({
                message:"Unauthorized"
            })
        }
        if(!result.success){
            return res.status(400).json({
                    error:result.error.issues.map(err => err.message)
                })
        }

        const {project_id}=result.data

        const project=await prisma.project.findFirst({where:{id:project_id,user_id}})
        if(!project){
            return res.status(404).json({
                message:"Project not found"
            })
        }

        const messages=await prisma.message.findMany({
            where:{
                project_id
            },
            orderBy:{
                created_at:"desc"
            },
            select:{
                id:true,
                content:true,
                created_at:true,
                role:true
            }
        })

        return res.status(200).json({
            messages
        })
    } catch (error) {
        return res.status(500).json({
            error
        })
    }
}