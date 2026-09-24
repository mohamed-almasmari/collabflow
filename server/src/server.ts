import "dotenv/config";

import { createServer } from "node:http";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";

import { initializeSocketServer } from "./socket/socket.js";

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

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

const httpServer = createServer(app);

initializeSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`CollabFlow API running on http://localhost:${PORT}`);

  console.log(`Socket.IO ready on port ${PORT}`);
});
