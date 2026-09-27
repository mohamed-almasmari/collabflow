import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { env } from "./config/env.js";

import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "CollabFlow API is running",
      environment: env.NODE_ENV,
    });
  });

  app.use("/api/auth", authRoutes);

  app.use("/api/workspaces", workspaceRoutes);

  app.use("/api/notifications", notificationRoutes);

  app.use((_req, res) => {
    res.status(404).json({
      message: "Route not found",
    });
  });

  return app;
}

export const app = createApp();
