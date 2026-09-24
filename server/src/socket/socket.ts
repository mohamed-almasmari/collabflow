import type { Server as HttpServer } from "node:http";

import { jwtVerify } from "jose";

import { Server, type Socket } from "socket.io";

import { prisma } from "../config/database.js";

interface ProjectRoomPayload {
  workspaceId: string;
  projectId: string;
}

interface BoardRefreshPayload {
  workspaceId: string;
  projectId: string;
}

interface ServerToClientEvents {
  "board:refresh": (payload: BoardRefreshPayload) => void;

  "socket:error": (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  "project:join": (payload: ProjectRoomPayload) => void;

  "project:leave": (payload: ProjectRoomPayload) => void;

  "board:changed": (payload: BoardRefreshPayload) => void;
}

interface SocketData {
  userId: string;
}

type CollabFlowSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

function getProjectRoom(workspaceId: string, projectId: string) {
  return `workspace:${workspaceId}:project:${projectId}`;
}

function isValidRoomPayload(payload: ProjectRoomPayload) {
  return Boolean(
    payload &&
    typeof payload.workspaceId === "string" &&
    payload.workspaceId.trim() &&
    typeof payload.projectId === "string" &&
    payload.projectId.trim(),
  );
}

async function verifyAccessToken(token: string): Promise<string> {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  const secretKey = new TextEncoder().encode(secret);

  const { payload } = await jwtVerify(token, secretKey, {
    algorithms: ["HS256"],
  });

  if (!payload.sub || typeof payload.sub !== "string") {
    throw new Error("Invalid authentication token");
  }

  return payload.sub;
}

async function canAccessProject(
  userId: string,
  workspaceId: string,
  projectId: string,
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },

    select: {
      id: true,
    },
  });

  if (!membership) {
    return false;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      workspaceId,
    },

    select: {
      id: true,
    },
  });

  return Boolean(project);
}

export function initializeSocketServer(httpServer: HttpServer) {
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: {
      origin: clientOrigin,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.accessToken;

      if (!token || typeof token !== "string") {
        next(new Error("Authentication required"));

        return;
      }

      const userId = await verifyAccessToken(token);

      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          id: true,
        },
      });

      if (!user) {
        next(new Error("User not found"));

        return;
      }

      socket.data.userId = user.id;

      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket: CollabFlowSocket) => {
    console.log(`Socket connected: ${socket.id} user=${socket.data.userId}`);

    socket.on("project:join", async (payload) => {
      if (!isValidRoomPayload(payload)) {
        socket.emit("socket:error", {
          message: "Invalid project room request",
        });

        return;
      }

      try {
        const authorized = await canAccessProject(
          socket.data.userId,
          payload.workspaceId,
          payload.projectId,
        );

        if (!authorized) {
          socket.emit("socket:error", {
            message: "You do not have access to this project",
          });

          return;
        }

        const room = getProjectRoom(payload.workspaceId, payload.projectId);

        await socket.join(room);

        console.log(`Socket ${socket.id} joined ${room}`);
      } catch (error) {
        console.error("Unable to join project room:", error);

        socket.emit("socket:error", {
          message: "Unable to join project room",
        });
      }
    });

    socket.on("project:leave", async (payload) => {
      if (!isValidRoomPayload(payload)) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      await socket.leave(room);

      console.log(`Socket ${socket.id} left ${room}`);
    });

    socket.on("board:changed", (payload) => {
      if (!isValidRoomPayload(payload)) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      if (!socket.rooms.has(room)) {
        socket.emit("socket:error", {
          message: "You are not authorized for this project room",
        });

        return;
      }

      socket.to(room).emit("board:refresh", {
        workspaceId: payload.workspaceId,

        projectId: payload.projectId,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}
