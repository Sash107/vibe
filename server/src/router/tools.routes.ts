import { Router } from "express";
import { createFileController } from "../controllers/createFile.controller.js";
import { toolMiddleware } from "../middleware/tool.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { runCommandController } from "../controllers/runCommand.controller.js";
import { readFileController } from "../controllers/readFile.controller.js";

export const toolRouter=Router();

toolRouter.post("/create-file",toolMiddleware,createFileController)
toolRouter.post("/runCommand",toolMiddleware,runCommandController)
toolRouter.post('/readFiles',toolMiddleware,readFileController)