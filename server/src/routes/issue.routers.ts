import { Router } from "express";

import {
  createIssue,
  getIssueById,
  getIssues,
  updateIssue,
} from "../controllers/issue.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getIssues);

router.post("/", requireAuth, createIssue);

router.get("/:issueId", requireAuth, getIssueById);

router.patch("/:issueId", requireAuth, updateIssue);

export default router;
