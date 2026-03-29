import { Request, Response } from "express";
import { projectSchema } from "../utils/zodSchemas.js";
import { prisma } from "../../lib/prisma.js";

export const newProject=async (req:Request,res:Response)=>{
    try{
        const result=projectSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                    error:result.error.issues.map(err => err.message)
                })
        }
        
        const {name,description}=result.data;

        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        const userId=req.user.id
        const project=await prisma.project.create({
            data:{
                name,
                description,
                user_id:userId
            }
        })

        return res.status(201).json({
            message:"Project created",
            project
        })
    }catch(err){
        return res.status(400).json({
            err
        })
    } 

}