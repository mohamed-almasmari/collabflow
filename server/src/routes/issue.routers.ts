import { Router } from "express";

import {
  createIssue,
  deleteIssue,
  getIssueById,
  getIssues,
  moveIssue,
  updateIssue,
} from "../controllers/issue.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import { requireCurrentIssueVersion } from "../middleware/issueConflict.middleware.js";

import { recordIssueActivity } from "../middleware/issueActivity.middleware.js";

import checklistRoutes from "./checklist.routes.js";
import commentRoutes from "./comment.routes.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getIssues);

router.post("/", requireAuth, recordIssueActivity("CREATED"), createIssue);

router.use("/:issueId/comments", commentRoutes);

router.use("/:issueId/checklist", checklistRoutes);

router.patch(
  "/:issueId/move",
  requireAuth,
  recordIssueActivity("MOVED"),
  moveIssue,
);

router.get("/:issueId", requireAuth, getIssueById);

router.patch(
  "/:issueId",
  requireAuth,
  requireCurrentIssueVersion,
  recordIssueActivity("UPDATED"),
  updateIssue,
);

router.delete(
  "/:issueId",
  requireAuth,
  recordIssueActivity("DELETED"),
  deleteIssue,
);

export default router;
