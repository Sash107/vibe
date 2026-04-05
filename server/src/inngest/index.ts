import {Sandbox} from "e2b";
import { Inngest, step } from "inngest";
import { connectSandbox } from "../utils/connectSandbox.js";
import { prisma } from "../../lib/prisma.js";

export const inngest = new Inngest({ id: "my-app" ,isDev:true});

const e2b_sandbox=inngest.createFunction({id:"e2b_sandbox",triggers:[{event:"app/getSandboxId"}]},
    async ({event,step})=>{
          
        let SandboxID="";
        let SandboxURL="";

        const {project_id}=event.data;

        const existing= await step.run("check-db",async()=>{
            return await prisma.sandbox.findFirst({
                where:{
                    project_id,
                    expires_at:{gt: new Date()}
                }
            })
        })

        if(existing){
            try{
                const sandbox=await connectSandbox(SandboxID);
                await sandbox.files.list("/home/user/myapp")
                SandboxID=existing.sandbox_id;
                SandboxURL=existing.url ?? "";
                return {SandboxID,SandboxURL}
            }catch(err){console.log("Sandbox Invalid, recreating")}
        }

        SandboxID=await step.run("get-sandbox",async()=>{
            const sandbox= await Sandbox.create("vibe",{timeoutMs:1_800_000});
            return sandbox.sandboxId
        })

        SandboxURL=await step.run("get-sandbox-url",async()=>{
            const sandbox=await connectSandbox(SandboxID);
            const files= await sandbox.files.list("/home/user/myapp")
            console.log(files)
            return sandbox.getHost(3000);
        })

        await step.run("save-db",async()=>{
            await prisma.sandbox.create({
                data:{
                    project_id,
                    sandbox_id:SandboxID,
                    url:SandboxURL,
                    expires_at:new Date(Date.now()+ 1000*60*30),
                }
            })
        })

        return {SandboxID,SandboxURL}
    }
)

export const functions = [e2b_sandbox];