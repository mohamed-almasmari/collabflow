-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "dueDate" DATE;

-- CreateIndex
CREATE INDEX "Issue_dueDate_idx" ON "Issue"("dueDate");
