import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { sandboxRecord } from "../repositories/sandboxRecord.repository.js";
declare global {
    namespace Express {
        interface Request {
            sandboxId?: any;
        }
    }
}

declare global {
    namespace Express {
        interface Request {
            projectId?: any;
        }
    }
}

export const toolMiddleware= async (req:Request,res:Response,next:NextFunction)=>{
    const token=req.cookies.token
    if(!token){
        return res.status(401).json({
            message: "No user token found"
        });
    }
    try{
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const projectId = Number(req.headers["x-project-id"] as string);
        const sandboxId = await sandboxRecord(projectId);
        req.projectId=projectId;
        req.sandboxId=sandboxId;
        next();

    }catch(err){
        return res.status(403).json({
            error:err
        })
    }
}