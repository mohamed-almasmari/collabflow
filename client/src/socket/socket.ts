import { io, type Socket } from "socket.io-client";

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
}

interface ClientToServerEvents {
  "project:join": (payload: ProjectRoomPayload) => void;

  "project:leave": (payload: ProjectRoomPayload) => void;

  "board:changed": (payload: BoardRefreshPayload) => void;
}

type CollabFlowSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_URL = "http://localhost:3000";

let socket: CollabFlowSocket | null = null;

export function getSocket(): CollabFlowSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
    });
  }

  return socket;
}
