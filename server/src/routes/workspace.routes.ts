import { Router } from "express";

import {
  createWorkspace,
  getWorkspaceById,
  getWorkspaces,
  updateWorkspace,
} from "../controllers/workspace.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getWorkspaces);

router.get("/:workspaceId", requireAuth, getWorkspaceById);

router.post("/", requireAuth, createWorkspace);

router.patch("/:workspaceId", requireAuth, updateWorkspace);

export default router;