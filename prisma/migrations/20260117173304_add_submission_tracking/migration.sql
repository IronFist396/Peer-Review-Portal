-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hasSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "submittedAt" TIMESTAMP(3);
