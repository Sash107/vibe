import { prisma } from "../../lib/prisma.js";

export async function cloneTemplateToProject(projectId:number,templateId:number){
    const templateFiles=await prisma.templateFile.findMany({
        where:{template_id:templateId}
    })

    if (!templateFiles.length) {
    throw new Error("Template is empty");
    }

    const fileData=templateFiles.map((file)=>({
      project_id:projectId,
      path:file.path,
      content:file.content
    }))

    await prisma.file.createMany({
      data:fileData,
      skipDuplicates: true
    })
  
}