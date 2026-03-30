import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export const allProjects=async (req:Request,res:Response)=>{
    try{
        const user_id=req.user?.id

        if(!user_id){
            return res.status(401).json({
                message:"Unauthorized"
            })
        }

        const projects=await prisma.project.findMany(
            {where:{user_id},
            select:{id:true,name:true,description:true,created_at:true},
            orderBy:{created_at:"desc"}})

        return res.status(200).json({
            message:"fetched all projects of the user",
            projects
        })
    }catch(err){
        return res.status(400).json({
            err
        })
    }
    

}