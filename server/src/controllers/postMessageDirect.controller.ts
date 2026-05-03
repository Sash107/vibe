import { Request, Response } from "express";
import axios from "axios";
import { sandboxRecord } from "../repositories/sandboxRecord.repository.js";
import { inngest } from "../inngest/index.js";
import { cloneTemplateToProject } from "../repositories/cloneTemplateToProject.js";
import { chat } from "../repositories/chats.repository.js";
import { checkExistingProject } from "../utils/checkExistingProject.js";
import { setExistingProjectInSandbox } from "../repositories/cloneExistingProject.js";
import { connectSandbox } from "../utils/connectSandbox.js";
import { prisma } from "../../lib/prisma.js";

const PYTHON_SERVER_URL = process.env.PYTHON_SERVER_URL as string;

export const invokeLLM = async (req: Request, res: Response) => {
    try {
        const { my_message } = req.body;
        const project_id = parseInt(String(req.params.project_id));

        if (!my_message) {
            return res.status(400).json({ message: "No data sent" });
        }

        let sandboxSchema = await sandboxRecord(project_id);
        
        if (sandboxSchema) {
            try {
                await connectSandbox(sandboxSchema.sandbox_id);
            } catch (err) {
                console.log("Sandbox dead in invokeLLM, deleting from DB...");
                await prisma.sandbox.delete({ where: { id: sandboxSchema.id } });
                sandboxSchema = null;
            }
        }

        if(!sandboxSchema){
            await inngest.send({ name: "app/getSandboxId", data: { project_id } });
            while (!sandboxSchema) {
                console.log("fetching")
                await new Promise(res => setTimeout(res, 2000));
                sandboxSchema = await sandboxRecord(project_id);
            }
        }

        const sandboxID = sandboxSchema.sandbox_id;
        const sandboxURL = sandboxSchema?.url;
        if (!sandboxID && !sandboxURL) return res.status(400).json({ message: "Sandbox not ready" });

        await chat(my_message, project_id,"user");

        if(await checkExistingProject(project_id)){
            await setExistingProjectInSandbox(project_id,sandboxID)
        }
        else{
            await cloneTemplateToProject(project_id, 3);
        }

        const payload = {
            projectId: String(project_id),
            messages: [
                { role: "user", content: my_message }
            ],
        };

        console.log("Payload:", JSON.stringify(payload));

        const pythonRes:any = await axios.post(PYTHON_SERVER_URL, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 0,
            validateStatus: () => true,
        });

        if (pythonRes.status >= 400) {
            const errData = typeof pythonRes.data === "object" ? JSON.stringify(pythonRes.data) : String(pythonRes.data);
            return res.status(pythonRes.status).json({ error: errData });
        }
        
        await chat(pythonRes.data.summary, project_id,"assistant");
        console.log(pythonRes.data.summary);
        return res.status(200).json(pythonRes.data);

    } catch (error) {
        const err = error as Error;
        console.error("[invokeLLM] Error:", err);
        return res.status(500).json({
            error: err.message ?? String(err),
            stack: err.stack,
        });
    }
};