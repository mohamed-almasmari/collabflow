import { Router } from "express";

import { createProject } from "../controllers/project.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.post(
  "/",
  requireAuth,
  createProject,
);

export default router;