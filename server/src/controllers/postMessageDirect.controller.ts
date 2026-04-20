import { Request, Response } from "express";
import axios from "axios";
import { sandboxRecord } from "../repositories/sandboxRecord.repository.js";
import { inngest } from "../inngest/index.js";
import { cloneTemplateToProject } from "../repositories/cloneTemplateToProject.js";
import { chat } from "../repositories/chats.repository.js";

const PYTHON_SERVER_URL = "http://127.0.0.1:8000/call_llm";

export const invokeLLM = async (req: Request, res: Response) => {
    try {
        const { my_message } = req.body;
        const project_id = parseInt(String(req.params.project_id));

        if (!my_message) {
            return res.status(400).json({ message: "No data sent" });
        }

        const sandboxSchema = await sandboxRecord(project_id);
        if (!sandboxSchema) {
            await inngest.send({ name: "app/getSandboxId", data: { project_id } });
            return res.status(202).json({ message: "Sandbox is being created. Please retry in a few seconds." });
        }

        const sandboxID = sandboxSchema.sandbox_id;
        const sandboxURL = sandboxSchema?.url;
        if (!sandboxID && !sandboxURL) return res.status(400).json({ message: "Sandbox not ready" });

        await chat(my_message, project_id);
        await cloneTemplateToProject(project_id, 3);

        const payload = {
            projectId: String(project_id),
            messages: [
                { role: "user", content: my_message }
            ],
        };

        console.log("[invokeLLM] POSTing to Python:", PYTHON_SERVER_URL);
        console.log("[invokeLLM] Payload:", JSON.stringify(payload));

        const pythonRes = await axios.post(PYTHON_SERVER_URL, payload, {
            headers: { "Content-Type": "application/json" },
            timeout: 0, // 0 means no timeout
            validateStatus: () => true, // resolve promise for all HTTP status codes
        });

        if (pythonRes.status >= 400) {
            const errData = typeof pythonRes.data === "object" ? JSON.stringify(pythonRes.data) : String(pythonRes.data);
            return res.status(pythonRes.status).json({ error: errData });
        }

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