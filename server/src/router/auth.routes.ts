import { Router } from "express";
import { loginController } from "../controllers/login.controller.js";
import { signupController } from "../controllers/signup.controller.js";

export const authRouter=Router()

authRouter.post("/login",loginController)
authRouter.post("/signup",signupController)