import type { Server as HttpServer } from "node:http";

import { Server, type Socket } from "socket.io";

interface ProjectRoomPayload {
  workspaceId: string;
  projectId: string;
}

interface BoardRefreshPayload {
  workspaceId: string;
  projectId: string;
}

interface ClientToServerEvents {
  "project:join": (payload: ProjectRoomPayload) => void;

  "project:leave": (payload: ProjectRoomPayload) => void;

  "board:changed": (payload: BoardRefreshPayload) => void;
}

interface ServerToClientEvents {
  "board:refresh": (payload: BoardRefreshPayload) => void;
}

type CollabFlowSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

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

export function initializeSocketServer(httpServer: HttpServer) {
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: clientOrigin,
        credentials: true,
      },
    },
  );

  io.on("connection", (socket: CollabFlowSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("project:join", (payload) => {
      if (!isValidRoomPayload(payload)) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      void socket.join(room);

      console.log(`Socket ${socket.id} joined ${room}`);
    });

    socket.on("project:leave", (payload) => {
      if (!isValidRoomPayload(payload)) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      void socket.leave(room);
    });

    socket.on("board:changed", (payload) => {
      if (!isValidRoomPayload(payload)) {
        return;
      }

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

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
