import { Router } from "express";

import { createIssue } from "../controllers/issue.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.post(
  "/",
  requireAuth,
  createIssue,
);

export default router;