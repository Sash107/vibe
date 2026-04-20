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
    try{
        const projectId = Number(req.headers["x-project-id"] as string);
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({ error: "Missing or invalid x-project-id header" });
        }

        const sandboxRecord_ = await sandboxRecord(projectId);
        req.projectId = projectId;
        req.sandboxId = sandboxRecord_?.sandbox_id ?? null;
        next();

    }catch(err){
        return res.status(403).json({
            error:err
        })
    }
}