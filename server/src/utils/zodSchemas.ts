import * as z from "zod";

export const userSignupSchema=z.object({
        username:z.string().min(3,{error:"Username too short"}).trim(),
        email:z.email({error:"Invalid email"}).trim(),
        password:z.string().min(8,{error:"Password must be at least 8 characters"}).trim()
})  

export const userLoginSchema=z.object({
        email:z.email({error:"Invalid email"}).trim(),
        password:z.string().trim()
}) 

