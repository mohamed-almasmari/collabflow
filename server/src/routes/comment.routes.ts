import { Router } from "express";

import {
  createComment,
  deleteComment,
  getComments,
} from "../controllers/comment.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({
  mergeParams: true,
});

router.get("/", requireAuth, getComments);

router.post("/", requireAuth, createComment);

router.delete("/:commentId", requireAuth, deleteComment);

export default router;
