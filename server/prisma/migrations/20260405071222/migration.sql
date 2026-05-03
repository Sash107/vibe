/*
  Warnings:

  - A unique constraint covering the columns `[project_id,path]` on the table `File` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "File_project_id_path_key" ON "File"("project_id", "path");
