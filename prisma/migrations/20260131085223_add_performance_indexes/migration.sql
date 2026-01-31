-- Add GIN index for array field to speed up recommendations
CREATE INDEX "User_pors_idx" ON "User" USING GIN (pors);