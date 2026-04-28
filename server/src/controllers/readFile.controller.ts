import {Sandbox} from "e2b";
import { Request, Response } from "express";

export const readFileController=async(req:Request,res:Response)=>{
    // Accept either { paths: string[] } or { files: {path:string}[] }
    const rawPaths = req.body?.paths;
    const rawFiles = req.body?.files;
    const paths: string[] = Array.isArray(rawPaths)
        ? rawPaths
        : Array.isArray(rawFiles)
            ? rawFiles.map((f: any) => (typeof f === "string" ? f : f.path))
            : [];

    const sandboxId=req.sandboxId;

    if (!Array.isArray(paths) || paths.length === 0) {
        return res.status(400).json({ success: false, error: "Request body must include a non-empty 'paths' array" });
    }

    if (!sandboxId) {
        return res.status(400).json({ success: false, error: "Sandbox not ready" });
    }

    const contents: { path: string; content?: string; error?: string }[] = [];
    try{
        const sandbox = await Sandbox.connect(sandboxId);

        for (const path of paths){
            let normalizedPath = path;
            if (normalizedPath.startsWith("/home/user/myapp")) {
                normalizedPath = normalizedPath.slice("/home/user/myapp".length);
            }
            normalizedPath = normalizedPath.replace(/^\/+/, "");
            const fullPath = `/home/user/myapp/${normalizedPath}`;
            try {
                const content = await sandbox.files.read(fullPath);
                console.log(`✓ Read: ${path}`);
                contents.push({ path, content });
            } catch (fileErr: any) {
                console.error(`Read error for ${path}:`, fileErr.message);
                contents.push({ path, error: fileErr.message || "File not found" });
            }
        }

        res.json({
            success: true,
            output: contents
        });
    }catch(err:any){
        console.error("Sandbox connection error:", err);
        return res.status(500).json({
            success: false,
            error: err.message || "Failed to connect to sandbox"
        });
    }
}