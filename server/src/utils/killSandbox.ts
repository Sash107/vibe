import { connectSandbox } from "./connectSandbox.js";

export async function killSandbox(sandboxID:string){
    const sandbox=await connectSandbox(sandboxID);
    sandbox.kill();
}