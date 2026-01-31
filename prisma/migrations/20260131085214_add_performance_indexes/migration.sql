-- CreateIndex
CREATE INDEX "User_applyingFor_idx" ON "User"("applyingFor");

-- CreateIndex
CREATE INDEX "User_department_idx" ON "User"("department");

-- CreateIndex
CREATE INDEX "User_acceptingReviews_idx" ON "User"("acceptingReviews");

-- CreateIndex
CREATE INDEX "User_applyingFor_department_idx" ON "User"("applyingFor", "department");

-- CreateIndex
CREATE INDEX "User_hostel_idx" ON "User"("hostel");

-- CreateIndex
CREATE INDEX "User_hasSubmitted_idx" ON "User"("hasSubmitted");
