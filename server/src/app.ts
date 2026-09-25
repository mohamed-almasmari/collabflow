import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import authRoutes from "./routes/auth.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    }),
  );

  app.use(express.json());

  app.use(cookieParser());

  app.get("/api/health", (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "CollabFlow API is running",
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
