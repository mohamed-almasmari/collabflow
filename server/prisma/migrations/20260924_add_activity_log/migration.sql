CREATE TABLE "activity_log" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "workspace_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "issue_id" TEXT,
    "actor_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey"
        PRIMARY KEY ("id"),

    CONSTRAINT "activity_log_action_check"
        CHECK (
            "action" IN (
                'CREATED',
                'UPDATED',
                'MOVED',
                'DELETED'
            )
        )
);

CREATE INDEX "activity_log_workspace_id_idx"
ON "activity_log"("workspace_id");

CREATE INDEX "activity_log_project_id_idx"
ON "activity_log"("project_id");

CREATE INDEX "activity_log_issue_id_idx"
ON "activity_log"("issue_id");

CREATE INDEX "activity_log_actor_id_idx"
ON "activity_log"("actor_id");

CREATE INDEX "activity_log_created_at_idx"
ON "activity_log"("created_at");

CREATE INDEX "activity_log_project_created_at_idx"
ON "activity_log"(
    "project_id",
    "created_at"
);