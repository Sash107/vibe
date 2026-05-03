import {Sandbox} from "e2b";

export async function getSandboxContext(sandbox: Sandbox): Promise<string> {
    const tree = await sandbox.commands.run(
        `find /home/user/myapp -type f -not -path "*/node_modules/*" -not -path "*/.next/*" -not -path "*/.git/*" | head -50`
    );
    return `Current file structure:\n${tree.stdout}`;
}