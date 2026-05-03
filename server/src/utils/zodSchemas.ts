import * as z from "zod";

export const roleEnum=z.enum(["user","assistant"])

export const userSignupSchema=z.object({
    username:z.string().min(3,{error:"Username too short"}).trim(),
    email:z.email({error:"Invalid email"}).trim(),
    password:z.string().min(8,{error:"Password must be at least 8 characters"}).trim()
})  

export const userLoginSchema=z.object({
    email:z.email({error:"Invalid email"}).trim(),
    password:z.string().trim()
}) 

export const projectSchema=z.object({
    name:z.string().min(1,{error:"Name is required"}),
    description:z.string()
})

export const getProjectSchema=z.object({
    project_id: z.coerce.number().int("Wrong project id")
})

export const messageSchema=z.object({
    project_id:z.coerce.number().int({error:"Project ID is required"}),
    role:roleEnum
})