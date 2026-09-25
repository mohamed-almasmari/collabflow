import { Router } from "express";

import { createLabel, getLabels } from "../controllers/label.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getLabels);

router.post("/", requireAuth, createLabel);

export default router;
