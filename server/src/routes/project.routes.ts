import { Router } from "express";

import {
  createProject,
  getProjectById,
  getProjects,
} from "../controllers/project.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getProjects);

router.post("/", requireAuth, createProject);

router.get("/:projectId", requireAuth, getProjectById);

export default router;
