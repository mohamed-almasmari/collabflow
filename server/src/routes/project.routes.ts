import { Router } from "express";

import { getProjectActivity } from "../controllers/activity.controller.js";

import { getWorkspaceAnalytics } from "../controllers/analytics.controller.js";

import {
  createProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import issueRoutes from "./issue.routers.js";

import labelRoutes from "./label.routes.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getProjects);

router.post("/", requireAuth, createProject);

/*
 * IMPORTANT:
 * Keep this route above /:projectId.
 *
 * Otherwise Express could interpret
 * "analytics" as a project ID.
 */
router.get("/analytics/summary", requireAuth, getWorkspaceAnalytics);

router.get("/:projectId/activity", requireAuth, getProjectActivity);

router.use("/:projectId/labels", labelRoutes);

router.use("/:projectId/issues", issueRoutes);

router.get("/:projectId", requireAuth, getProjectById);

router.patch("/:projectId", requireAuth, updateProject);

export default router;
