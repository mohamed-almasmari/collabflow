import { Router } from "express";

import {
  createWorkspace,
} from "../controllers/workspace.controller.js";
import {
  requireAuth,
} from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  createWorkspace,
);

export default router;