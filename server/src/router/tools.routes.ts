import { Router } from "express";
import { createFileController } from "../controllers/createFile.controller.js";
import { toolMiddleware } from "../middleware/tool.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { runCommandController } from "../controllers/runCommand.controller.js";

export const toolRouter=Router();

toolRouter.post("/create-file",authMiddleware,toolMiddleware,createFileController)
toolRouter.post("/runCommand",authMiddleware,toolMiddleware,runCommandController)
toolRouter.post('/readFiles',authMiddleware,toolMiddleware,)