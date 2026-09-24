-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Issue_projectId_status_position_idx" ON "Issue"("projectId", "status", "position");
