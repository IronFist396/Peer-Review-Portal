/*
  Warnings:

  - You are about to drop the column `academic` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `behavior` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `feedback` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `social` on the `Review` table. All the data in the column will be lost.
  - Added the required column `academicEthics` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academicInclination` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `approachability` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maturity` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `openMindedness` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `workEthics` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "academic",
DROP COLUMN "behavior",
DROP COLUMN "feedback",
DROP COLUMN "social",
ADD COLUMN     "academicEthics" INTEGER NOT NULL,
ADD COLUMN     "academicInclination" INTEGER NOT NULL,
ADD COLUMN     "approachability" INTEGER NOT NULL,
ADD COLUMN     "ismpMentor" TEXT,
ADD COLUMN     "maturity" INTEGER NOT NULL,
ADD COLUMN     "openMindedness" INTEGER NOT NULL,
ADD COLUMN     "otherComments" TEXT,
ADD COLUMN     "substanceAbuse" TEXT,
ADD COLUMN     "workEthics" INTEGER NOT NULL;
