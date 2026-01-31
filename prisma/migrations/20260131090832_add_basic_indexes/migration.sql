-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "User_hostel_idx" ON "User"("hostel");

-- CreateIndex
CREATE INDEX "User_hasSubmitted_idx" ON "User"("hasSubmitted");

-- Add GIN index for array field to speed up POR matching
CREATE INDEX "User_pors_idx" ON "User" USING GIN (pors);
