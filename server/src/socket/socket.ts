import type { Server as HttpServer } from "node:http";

import { jwtVerify } from "jose";

import { Server, type Socket } from "socket.io";

import { prisma } from "../config/database.js";

interface ProjectRoomPayload {
  workspaceId: string;
  projectId: string;
}

interface IssueMutationPayload extends ProjectRoomPayload {
  issueId: string;
}

interface RealtimeIssueUser {
  id: string;
  name: string;
  email: string;
}

interface RealtimeIssue {
  id: string;
  title: string;
  description: string | null;

  status: "TODO" | "IN_PROGRESS" | "DONE";

  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";

  position: number;

  projectId: string;
  createdById: string;
  assigneeId: string | null;

  createdAt: string;
  updatedAt: string;

  createdBy: RealtimeIssueUser;
  assignee: RealtimeIssueUser | null;
}

interface IssueRealtimePayload extends ProjectRoomPayload {
  issue: RealtimeIssue;
}

interface IssueDeletedPayload extends ProjectRoomPayload {
  issueId: string;
}

interface SocketErrorPayload {
  message: string;
}

interface ServerToClientEvents {
  "issue:created": (payload: IssueRealtimePayload) => void;

  "issue:updated": (payload: IssueRealtimePayload) => void;

  "issue:moved": (payload: IssueRealtimePayload) => void;

  "issue:deleted": (payload: IssueDeletedPayload) => void;

  "socket:error": (payload: SocketErrorPayload) => void;
}

interface ClientToServerEvents {
  "project:join": (payload: ProjectRoomPayload) => void;

  "project:leave": (payload: ProjectRoomPayload) => void;

  "issue:created": (payload: IssueMutationPayload) => void;

  "issue:updated": (payload: IssueMutationPayload) => void;

  "issue:moved": (payload: IssueMutationPayload) => void;

  "issue:deleted": (payload: IssueDeletedPayload) => void;
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

function isValidProjectPayload(payload: ProjectRoomPayload) {
  return Boolean(
    payload &&
    typeof payload.workspaceId === "string" &&
    payload.workspaceId.trim() &&
    typeof payload.projectId === "string" &&
    payload.projectId.trim(),
  );
}

function isValidIssuePayload(payload: IssueMutationPayload) {
  return Boolean(
    isValidProjectPayload(payload) &&
    typeof payload.issueId === "string" &&
    payload.issueId.trim(),
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

async function getRealtimeIssue(
  workspaceId: string,
  projectId: string,
  issueId: string,
): Promise<RealtimeIssue | null> {
  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,

      project: {
        id: projectId,
        workspaceId,
      },
    },

    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!issue) {
    return null;
  }

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,

    status: issue.status,

    priority: issue.priority,

    position: issue.position,

    projectId: issue.projectId,

    createdById: issue.createdById,

    assigneeId: issue.assigneeId,

    createdAt: issue.createdAt.toISOString(),

    updatedAt: issue.updatedAt.toISOString(),

    createdBy: issue.createdBy,

    assignee: issue.assignee,
  };
}

async function isAuthorizedRoom(
  socket: CollabFlowSocket,
  workspaceId: string,
  projectId: string,
) {
  const room = getProjectRoom(workspaceId, projectId);

  return socket.rooms.has(room);
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
      if (!isValidProjectPayload(payload)) {
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
      if (!isValidProjectPayload(payload)) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      await socket.leave(room);
    });

    socket.on("issue:created", async (payload) => {
      if (!isValidIssuePayload(payload)) {
        return;
      }

      if (
        !(await isAuthorizedRoom(
          socket,
          payload.workspaceId,
          payload.projectId,
        ))
      ) {
        socket.emit("socket:error", {
          message: "You are not authorized for this project room",
        });

        return;
      }

      const issue = await getRealtimeIssue(
        payload.workspaceId,
        payload.projectId,
        payload.issueId,
      );

      if (!issue) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      socket.to(room).emit("issue:created", {
        workspaceId: payload.workspaceId,

        projectId: payload.projectId,

        issue,
      });
    });

    socket.on("issue:updated", async (payload) => {
      if (!isValidIssuePayload(payload)) {
        return;
      }

      if (
        !(await isAuthorizedRoom(
          socket,
          payload.workspaceId,
          payload.projectId,
        ))
      ) {
        return;
      }

      const issue = await getRealtimeIssue(
        payload.workspaceId,
        payload.projectId,
        payload.issueId,
      );

      if (!issue) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      socket.to(room).emit("issue:updated", {
        workspaceId: payload.workspaceId,

        projectId: payload.projectId,

        issue,
      });
    });

    socket.on("issue:moved", async (payload) => {
      if (!isValidIssuePayload(payload)) {
        return;
      }

      if (
        !(await isAuthorizedRoom(
          socket,
          payload.workspaceId,
          payload.projectId,
        ))
      ) {
        return;
      }

      const issue = await getRealtimeIssue(
        payload.workspaceId,
        payload.projectId,
        payload.issueId,
      );

      if (!issue) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      socket.to(room).emit("issue:moved", {
        workspaceId: payload.workspaceId,

        projectId: payload.projectId,

        issue,
      });
    });

    socket.on("issue:deleted", async (payload) => {
      if (!isValidIssuePayload(payload)) {
        return;
      }

      if (
        !(await isAuthorizedRoom(
          socket,
          payload.workspaceId,
          payload.projectId,
        ))
      ) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      socket.to(room).emit("issue:deleted", {
        workspaceId: payload.workspaceId,

        projectId: payload.projectId,

        issueId: payload.issueId,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}
