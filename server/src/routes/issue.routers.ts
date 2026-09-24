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

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getIssues);

router.post("/", requireAuth, createIssue);

router.patch("/:issueId/move", requireAuth, moveIssue);

router.get("/:issueId", requireAuth, getIssueById);

router.patch("/:issueId", requireAuth, requireCurrentIssueVersion, updateIssue);

router.delete("/:issueId", requireAuth, deleteIssue);

export default router;
