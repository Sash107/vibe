import { Router } from "express";
import { newProject } from "../controllers/newProject.controller.js";
import { allProjects } from "../controllers/getAllProjects.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { singleProject } from "../controllers/get-one-project.controller.js";

export const projectRouter=Router();

projectRouter.post('/new-project',authMiddleware,newProject)
projectRouter.get('/all-projects',authMiddleware,allProjects)
projectRouter.get('/:project_id',authMiddleware,singleProject)