import { io, type Socket } from "socket.io-client";

interface ProjectRoomPayload {
  workspaceId: string;
  projectId: string;
}

interface BoardRefreshPayload {
  workspaceId: string;
  projectId: string;
}

interface SocketErrorPayload {
  message: string;
}

interface ServerToClientEvents {
  "board:refresh": (payload: BoardRefreshPayload) => void;

  "socket:error": (payload: SocketErrorPayload) => void;
}

interface ClientToServerEvents {
  "project:join": (payload: ProjectRoomPayload) => void;

  "project:leave": (payload: ProjectRoomPayload) => void;

  "board:changed": (payload: BoardRefreshPayload) => void;
}

export type CollabFlowSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

const SOCKET_URL = "http://localhost:3000";

let socket: CollabFlowSocket | null = null;

let currentAccessToken: string | null = null;

export function getSocket(accessToken: string): CollabFlowSocket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,

      withCredentials: true,

      auth: {
        accessToken,
      },
    });

    currentAccessToken = accessToken;
  }

  if (currentAccessToken !== accessToken) {
    currentAccessToken = accessToken;

    socket.auth = {
      accessToken,
    };

    if (socket.connected) {
      socket.disconnect();
    }
  }

  if (!socket.connected) {
    socket.auth = {
      accessToken,
    };

    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();

    socket = null;

    currentAccessToken = null;
  }
}
