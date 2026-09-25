import { Router } from "express";

import {
  createChecklistItem,
  deleteChecklistItem,
  getChecklistItems,
  updateChecklistItem,
} from "../controllers/checklist.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getChecklistItems);

router.post("/", requireAuth, createChecklistItem);

router.patch("/:itemId", requireAuth, updateChecklistItem);

router.delete("/:itemId", requireAuth, deleteChecklistItem);

export default router;
