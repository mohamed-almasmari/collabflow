import { Router } from "express";

import {
  createWorkspace,
  getWorkspaces,
} from "../controllers/workspace.controller.js";

import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  getWorkspaces,
);

router.post(
  "/",
  requireAuth,
  createWorkspace,
);

export default router;