import { Router } from "express";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../controllers/notification.controller.js";

import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/", requireAuth, getNotifications);

router.patch("/read-all", requireAuth, markAllNotificationsRead);

router.patch("/:notificationId/read", requireAuth, markNotificationRead);

export default router;
