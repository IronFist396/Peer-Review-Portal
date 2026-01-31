-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptingReviews" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "applyingFor" TEXT NOT NULL DEFAULT 'ismp',
ADD COLUMN     "isDeptHead" BOOLEAN NOT NULL DEFAULT false;
