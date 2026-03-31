import { Router } from "express";
import { postMessage } from "../controllers/postMessage.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getAllMessages } from "../controllers/getAllMessages.controller.js";

export const messageRouter=Router();

messageRouter.post('/message/:project_id',authMiddleware,postMessage)
messageRouter.post('/allMessage/:project_id',authMiddleware,getAllMessages)