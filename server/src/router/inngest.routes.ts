import { Router } from "express";
import { getSandboxId } from "../controllers/getSandboxId.controller.js";

export const InngestRouter= Router();

InngestRouter.post('/sandbox',getSandboxId)