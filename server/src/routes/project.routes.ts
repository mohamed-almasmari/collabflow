import { Router } from "express";

import {
  createProject,
  getProjectById,
  getProjects,
  updateProject,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getProjects);

router.post("/", requireAuth, createProject);

router.get("/:projectId", requireAuth, getProjectById);

router.patch("/:projectId", requireAuth, updateProject);

export default router;
