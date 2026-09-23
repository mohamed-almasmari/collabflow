import { Router } from "express";

import {
  addWorkspaceMember,
  createWorkspace,
  getWorkspaceById,
  getWorkspaces,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from "../controllers/workspace.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getWorkspaces);

router.get("/:workspaceId", requireAuth, getWorkspaceById);

router.post("/", requireAuth, createWorkspace);

router.patch("/:workspaceId", requireAuth, updateWorkspace);

router.post("/:workspaceId/members", requireAuth, addWorkspaceMember);

router.patch(
  "/:workspaceId/members/:memberId",
  requireAuth,
  updateWorkspaceMemberRole,
);

router.delete(
  "/:workspaceId/members/:memberId",
  requireAuth,
  removeWorkspaceMember,
);
export default router;
