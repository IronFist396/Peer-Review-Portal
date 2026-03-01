-- CreateIndex
CREATE INDEX "User_pors_idx" ON "User" USING GIN ("pors");
