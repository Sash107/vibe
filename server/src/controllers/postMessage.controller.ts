import { Request, Response } from "express";

export const postMessage =async(req:Request,res:Response)=>{
    try {
        
    } catch (error) {
        return res.status(500).json({
            error
        })
    }
}