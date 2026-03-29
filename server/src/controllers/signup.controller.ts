import { Request,Response} from "express"
import bcrypt from "bcrypt"
import { prisma } from "../../lib/prisma.js"
import jwt from "jsonwebtoken"
import { userSignupSchema } from "../utils/zodSchemas.js"


export const signupController=async(req:Request,res:Response)=>{

    try{
        const result=userSignupSchema.safeParse(req.body)
        if(!result.success){
            return res.status(400).json({
                error:result.error.issues.map(err=>err.message)
            })
        }
        const {username,email,password}=result.data

        const existingUser = await prisma.user.findFirst({
            where:{
                OR:[
                    {username},
                    {email}
                ]
            }
        });

        if (existingUser) {
            if(existingUser.username==username){
                return res.status(409).json({ message: "Username already exists" });
            }
            return res.status(409).json({ message: "Email already exists" });

        }

        const hashPassword=await bcrypt.hash(password,10)
        const user=await prisma.user.create({
            data:{
                username,
                email,
                password:hashPassword
            }
        });

        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET is not defined");

        const token=jwt.sign({id:user.id,role:user.role},secret,{expiresIn:"1h"})
        res.cookie("token",token,{
            httpOnly:true,
            secure:true,
            sameSite:"lax"
        })

        return res.status(201).json({
            message:"User created successfully",
            user
        })

    }catch(err){
        console.log(err);
        return res.status(500).json({ message: "Internal server error" });
    }
        
}