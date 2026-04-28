import { inngest } from "../inngest/index.js";
import { setExistingProjectInSandbox } from "../repositories/cloneExistingProject.js";
import { cloneTemplateToProject } from "../repositories/cloneTemplateToProject.js";
import { sandboxRecord } from "../repositories/sandboxRecord.repository.js";
import { checkExistingProject } from "./checkExistingProject.js";
import { connectSandbox } from "./connectSandbox.js";

export async function startOneProject(project_id:number){
    let sandboxSchema=await sandboxRecord(project_id);
    // Removed early return so we can sync files and start the server
    
    if(!sandboxSchema){
        await inngest.send({ name: "app/getSandboxId", data: { project_id } });
        while (!sandboxSchema) {
            await new Promise(res => setTimeout(res, 2000));
            sandboxSchema = await sandboxRecord(project_id);
        }
    }
    

    const sandbox_id = sandboxSchema.sandbox_id;
    const sandboxURL = sandboxSchema?.url;
    if (!sandbox_id && !sandboxURL) throw new Error("Sandbox not ready");


    if(await checkExistingProject(project_id)){
        await setExistingProjectInSandbox(project_id,sandbox_id)
    }
    else{
        await cloneTemplateToProject(project_id, 3);
    }
    const Sandbox=await connectSandbox(sandbox_id)
    await Sandbox.commands.run(`sudo killall node || true`);
    await Sandbox.commands.run(`npm install`, { cwd: "/home/user/myapp" });
    await Sandbox.commands.run(`npm run dev`, { cwd: "/home/user/myapp", background: true });
    return {sandbox_id,sandboxURL};
}