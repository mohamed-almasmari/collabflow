import { io, type Socket } from "socket.io-client";

import type { IssueComment } from "../api/comments";

import type { Issue } from "../api/issues";

export interface PresenceUser {
  id: string;
  name: string;
  email: string;
}

export type IssueActivityType = "EDITING" | "DRAGGING";

export interface IssueActivity {
  issueId: string;

  activity: IssueActivityType;

  user: PresenceUser;
}

interface ProjectRoomPayload {
  workspaceId: string;
  projectId: string;
}

interface IssueMutationPayload extends ProjectRoomPayload {
  issueId: string;
}

interface CommentMutationPayload extends IssueMutationPayload {
  commentId: string;
}

interface IssueActivityInput extends IssueMutationPayload {
  activity: IssueActivityType;

  active: boolean;
}

interface IssueRealtimePayload extends ProjectRoomPayload {
  issue: Issue;
}

interface IssueDeletedPayload extends ProjectRoomPayload {
  issueId: string;
}

interface CommentRealtimePayload extends ProjectRoomPayload {
  issueId: string;

  comment: IssueComment;
}

interface CommentDeletedPayload extends ProjectRoomPayload {
  issueId: string;

  commentId: string;
}

interface PresencePayload extends ProjectRoomPayload {
  users: PresenceUser[];
}

interface IssueActivityPayload extends ProjectRoomPayload {
  issueId: string;

  activity: IssueActivityType;

  active: boolean;

  user: PresenceUser;
}

interface SocketErrorPayload {
  message: string;
}

interface ServerToClientEvents {
  "issue:created": (payload: IssueRealtimePayload) => void;

  "issue:updated": (payload: IssueRealtimePayload) => void;

  "issue:moved": (payload: IssueRealtimePayload) => void;

  "issue:deleted": (payload: IssueDeletedPayload) => void;

  "issue:activity": (payload: IssueActivityPayload) => void;

  "comment:created": (payload: CommentRealtimePayload) => void;

  "comment:updated": (payload: CommentRealtimePayload) => void;

  "comment:deleted": (payload: CommentDeletedPayload) => void;

  "presence:updated": (payload: PresencePayload) => void;

  "socket:error": (payload: SocketErrorPayload) => void;
}

interface ClientToServerEvents {
  "project:join": (payload: ProjectRoomPayload) => void;

  "project:leave": (payload: ProjectRoomPayload) => void;

  "issue:created": (payload: IssueMutationPayload) => void;

  "issue:updated": (payload: IssueMutationPayload) => void;

  "issue:moved": (payload: IssueMutationPayload) => void;

  "issue:deleted": (payload: IssueDeletedPayload) => void;

  "issue:activity": (payload: IssueActivityInput) => void;

  "comment:created": (payload: CommentMutationPayload) => void;

  "comment:updated": (payload: CommentMutationPayload) => void;

  "comment:deleted": (payload: CommentMutationPayload) => void;
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
  if (!socket) {
    return;
  }

  socket.disconnect();

  socket = null;

  currentAccessToken = null;
}
