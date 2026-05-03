import { NextFunction, Request, Response } from "express";
import { inngest } from "../inngest/index.js";

export const getSandboxId=async(req:Request,res:Response,next:NextFunction)=>{
    const {project_id}=req.body
    const sandbox=await inngest.send({
        name:"app/getSandboxId",
        data:{
            project_id
        }
    }).catch(err => next(err));
    res.json(sandbox);
}