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

import projectRoutes from "./project.routes.js";

const router = Router();

router.get("/", requireAuth, getWorkspaces);

router.post("/", requireAuth, createWorkspace);

router.use("/:workspaceId/projects", projectRoutes);

router.get("/:workspaceId", requireAuth, getWorkspaceById);

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
