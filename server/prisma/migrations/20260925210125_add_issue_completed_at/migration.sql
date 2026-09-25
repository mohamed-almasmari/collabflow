-- AlterTable
ALTER TABLE "Issue" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Issue_completedAt_idx" ON "Issue"("completedAt");
CREATE OR REPLACE FUNCTION set_issue_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'DONE' AND OLD.status <> 'DONE' THEN
    NEW."completedAt" = CURRENT_TIMESTAMP;
  ELSIF NEW.status <> 'DONE' AND OLD.status = 'DONE' THEN
    NEW."completedAt" = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER issue_completed_at_trigger
BEFORE UPDATE OF status ON "Issue"
FOR EACH ROW
EXECUTE FUNCTION set_issue_completed_at();