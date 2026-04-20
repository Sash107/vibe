import "dotenv/config"
import express from "express";
import cookieParser from "cookie-parser"
import { authRouter } from "./router/auth.routes.js";
import { projectRouter } from "./router/project.routes.js";
import {inngest,functions} from "./inngest/index.js";
import { serve } from "inngest/express";
import { messageRouter } from "./router/message.routes.js";
import { InngestRouter } from "./router/inngest.routes.js";
import { toolRouter } from "./router/tools.routes.js";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use('/api/inngest',serve({client:inngest,functions}));


app.use('/auth',authRouter);
app.use('/project',projectRouter);
app.use('/',messageRouter);
app.use('/app',InngestRouter);
app.use('/tools',toolRouter);

app.listen(5000,()=>{
    console.log("server is running on port 5000")
})