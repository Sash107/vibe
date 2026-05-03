import {Sandbox} from "e2b";

export async function connectSandbox(sandboxID:string){
    const sandbox=await Sandbox.connect(sandboxID)
    return sandbox;
}