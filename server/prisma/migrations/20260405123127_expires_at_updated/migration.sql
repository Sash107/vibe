/*
  Warnings:

  - You are about to drop the column `expired_at` on the `Sandbox` table. All the data in the column will be lost.
  - Added the required column `expires_at` to the `Sandbox` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sandbox" DROP COLUMN "expired_at",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL;
