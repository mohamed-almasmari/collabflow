import cors from "cors";
import express from "express";

import { prisma } from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

const PORT = 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  }),
);

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      service: "collabflow-api",
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      service: "collabflow-api",
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`CollabFlow API running on http://localhost:${PORT}`);
});