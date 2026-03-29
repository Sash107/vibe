import { Request,Response} from "express"
import bcrypt from "bcrypt"
import { prisma } from "../../lib/prisma.js"
import { Jwt } from "jsonwebtoken"
import { userLoginSchema } from "../utils/zodSchemas.js"
import jwt from "jsonwebtoken"

export const loginController=async(req:Request,res:Response)=>{
    try{
        const result=userLoginSchema.safeParse(req.body);
        if(!result.success){
            return res.status(400).json({
                error:result.error.issues.map(err => err.message)
            })
        }

        const {email,password}=result.data

        const user = await prisma.user.findFirst({where: {email}});
        
        if(!user){
            return res.status(400).json({
                message:"Email does not exists"
            })
        }
        if(!user.password){
            return res.status(400).json({
                message:"Invalid credentials"
            })
        }

        const isPassword=await bcrypt.compare(password,user.password)
        if(!isPassword){
            return res.status(400).json({
                message:"Invalid credentials"
            })
        }

        const secret=process.env.JWT_SECRET;
        if(!secret) throw new Error("JWT Secret is not defined")

        const token=jwt.sign({id:user.id,role:user.role,name:user.name},secret,{expiresIn:"1h"})
        res.cookie("token",token,{
            httpOnly: true,
            secure:false,
            sameSite:"lax",
            maxAge: 60*60*1000
        })

        return res.status(200).json({
            message:"Login Successful",
            user
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }

}