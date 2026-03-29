import "dotenv/config"
import express from "express";
import cookieParser from "cookie-parser"
import { authRouter } from "./router/auth.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());

app.use('/auth',authRouter);
app.listen(5000,()=>{
    console.log("server is running on port 5000")
})