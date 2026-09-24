import { Router } from "express";

import { getProjectActivity } from "../controllers/activity.controller.js";

import {
  createProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

import issueRoutes from "./issue.routers.js"; 

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getProjects);

router.post("/", requireAuth, createProject);

router.get("/:projectId/activity", requireAuth, getProjectActivity);

router.use("/:projectId/issues", issueRoutes);

router.get("/:projectId", requireAuth, getProjectById);

router.patch("/:projectId", requireAuth, updateProject);

export default router;
