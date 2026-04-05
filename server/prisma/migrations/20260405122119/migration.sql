-- CreateTable
CREATE TABLE "Sandbox" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "sandbox_id" TEXT NOT NULL,
    "url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "expired_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sandbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sandbox_sandbox_id_key" ON "Sandbox"("sandbox_id");

-- AddForeignKey
ALTER TABLE "Sandbox" ADD CONSTRAINT "Sandbox_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
