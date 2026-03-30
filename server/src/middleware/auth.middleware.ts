import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface MyJwtPayload extends JwtPayload {
    id: number;
    name: string;
    role: string;
}

declare global{
    namespace Express{
        interface Request{
            user?:MyJwtPayload
        }
    }
}

export const authMiddleware=(req:Request,res:Response,next:NextFunction)=>{
    const token=req.cookies.token;
    if(!token){
        return res.status(401).json({
            message: "No token found"
        });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error("JWT SECRET is not defined");
        }
        
        const decoded=jwt.verify(token,secret)
        req.user=decoded as MyJwtPayload

        next();
    }catch(err){
        res.status(403).json({
            error: err
        });
    }
}