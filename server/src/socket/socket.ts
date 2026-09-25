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

interface CommentMutationPayload extends IssueMutationPayload {
  commentId: string;
}

type IssueActivityType = "EDITING" | "DRAGGING";

interface IssueActivityInput extends IssueMutationPayload {
  activity: IssueActivityType;

  active: boolean;
}

interface RealtimeUser {
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

  createdBy: RealtimeUser;

  assignee: RealtimeUser | null;
}

interface RealtimeComment {
  id: string;

  body: string;

  issueId: string;

  authorId: string;

  createdAt: string;

  updatedAt: string;

  author: RealtimeUser;
}

interface RealtimeNotification {
  id: string;

  type: "COMMENT_MENTION" | "ISSUE_ASSIGNED";

  recipientId: string;

  actorId: string;

  workspaceId: string;

  projectId: string;

  issueId: string;

  commentId: string | null;

  readAt: string | null;

  createdAt: string;

  actor: RealtimeUser;

  workspace: {
    id: string;

    name: string;
  };

  project: {
    id: string;

    name: string;
  };

  issue: {
    id: string;

    title: string;
  };

  comment: {
    id: string;

    body: string;
  } | null;
}

interface IssueRealtimePayload extends ProjectRoomPayload {
  issue: RealtimeIssue;
}

interface IssueDeletedPayload extends ProjectRoomPayload {
  issueId: string;
}

interface CommentRealtimePayload extends ProjectRoomPayload {
  issueId: string;

  comment: RealtimeComment;
}

interface CommentDeletedPayload extends ProjectRoomPayload {
  issueId: string;

  commentId: string;
}

interface PresenceUser {
  id: string;

  name: string;

  email: string;
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

interface ActiveSocketActivity extends ProjectRoomPayload {
  issueId: string;

  activity: IssueActivityType;
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

  "notification:created": (payload: RealtimeNotification) => void;

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

interface SocketData {
  userId: string;

  name: string;

  email: string;

  joinedProjects: ProjectRoomPayload[];

  activeActivities: ActiveSocketActivity[];
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

function getUserRoom(userId: string) {
  return `user:${userId}`;
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

function isValidCommentPayload(payload: CommentMutationPayload) {
  return Boolean(
    isValidIssuePayload(payload) &&
    typeof payload.commentId === "string" &&
    payload.commentId.trim(),
  );
}

function isValidActivityPayload(payload: IssueActivityInput) {
  return Boolean(
    isValidIssuePayload(payload) &&
    (payload.activity === "EDITING" || payload.activity === "DRAGGING") &&
    typeof payload.active === "boolean",
  );
}

function projectAlreadyJoined(
  projects: ProjectRoomPayload[],
  workspaceId: string,
  projectId: string,
) {
  return projects.some(
    (project) =>
      project.workspaceId === workspaceId && project.projectId === projectId,
  );
}

function activityMatches(
  activity: ActiveSocketActivity,
  payload: IssueActivityInput,
) {
  return (
    activity.workspaceId === payload.workspaceId &&
    activity.projectId === payload.projectId &&
    activity.issueId === payload.issueId &&
    activity.activity === payload.activity
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

async function getRealtimeComment(
  workspaceId: string,
  projectId: string,
  issueId: string,
  commentId: string,
): Promise<RealtimeComment | null> {
  const comment = await prisma.comment.findFirst({
    where: {
      id: commentId,

      issueId,

      issue: {
        id: issueId,

        project: {
          id: projectId,

          workspaceId,
        },
      },
    },

    include: {
      author: {
        select: {
          id: true,

          name: true,

          email: true,
        },
      },
    },
  });

  if (!comment) {
    return null;
  }

  return {
    id: comment.id,

    body: comment.body,

    issueId: comment.issueId,

    authorId: comment.authorId,

    createdAt: comment.createdAt.toISOString(),

    updatedAt: comment.updatedAt.toISOString(),

    author: comment.author,
  };
}

async function getMentionNotifications(commentId: string) {
  const notifications = await prisma.notification.findMany({
    where: {
      type: "COMMENT_MENTION",

      commentId,
    },

    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      workspace: {
        select: {
          id: true,
          name: true,
        },
      },

      project: {
        select: {
          id: true,
          name: true,
        },
      },

      issue: {
        select: {
          id: true,
          title: true,
        },
      },

      comment: {
        select: {
          id: true,
          body: true,
        },
      },
    },
  });

  return notifications.map(
    (notification): RealtimeNotification => ({
      id: notification.id,

      type: notification.type,

      recipientId: notification.recipientId,

      actorId: notification.actorId,

      workspaceId: notification.workspaceId,

      projectId: notification.projectId,

      issueId: notification.issueId,

      commentId: notification.commentId,

      readAt: notification.readAt?.toISOString() ?? null,

      createdAt: notification.createdAt.toISOString(),

      actor: notification.actor,

      workspace: notification.workspace,

      project: notification.project,

      issue: notification.issue,

      comment: notification.comment,
    }),
  );
}

async function getAssignmentNotification(
  issueId: string,
  recipientId: string,
  minimumCreatedAt: Date,
): Promise<RealtimeNotification | null> {
  const notification = await prisma.notification.findFirst({
    where: {
      type: "ISSUE_ASSIGNED",

      issueId,

      recipientId,

      createdAt: {
        gte: minimumCreatedAt,
      },
    },

    orderBy: {
      createdAt: "desc",
    },

    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      workspace: {
        select: {
          id: true,
          name: true,
        },
      },

      project: {
        select: {
          id: true,
          name: true,
        },
      },

      issue: {
        select: {
          id: true,
          title: true,
        },
      },

      comment: {
        select: {
          id: true,
          body: true,
        },
      },
    },
  });

  if (!notification) {
    return null;
  }

  return {
    id: notification.id,

    type: notification.type,

    recipientId: notification.recipientId,

    actorId: notification.actorId,

    workspaceId: notification.workspaceId,

    projectId: notification.projectId,

    issueId: notification.issueId,

    commentId: notification.commentId,

    readAt: notification.readAt?.toISOString() ?? null,

    createdAt: notification.createdAt.toISOString(),

    actor: notification.actor,

    workspace: notification.workspace,

    project: notification.project,

    issue: notification.issue,

    comment: notification.comment,
  };
}

function isAuthorizedRoom(
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

  async function emitProjectPresence(workspaceId: string, projectId: string) {
    const room = getProjectRoom(workspaceId, projectId);

    const sockets = await io.in(room).fetchSockets();

    const uniqueUsers = new Map<string, PresenceUser>();

    for (const connectedSocket of sockets) {
      const { userId, name, email } = connectedSocket.data;

      if (!userId || uniqueUsers.has(userId)) {
        continue;
      }

      uniqueUsers.set(userId, {
        id: userId,

        name,

        email,
      });
    }

    const users = Array.from(uniqueUsers.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    io.to(room).emit("presence:updated", {
      workspaceId,

      projectId,

      users,
    });
  }

  function emitActivity(socket: CollabFlowSocket, payload: IssueActivityInput) {
    const room = getProjectRoom(payload.workspaceId, payload.projectId);

    socket.to(room).emit("issue:activity", {
      workspaceId: payload.workspaceId,

      projectId: payload.projectId,

      issueId: payload.issueId,

      activity: payload.activity,

      active: payload.active,

      user: {
        id: socket.data.userId,

        name: socket.data.name,

        email: socket.data.email,
      },
    });
  }

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
          name: true,
          email: true,
        },
      });

      if (!user) {
        next(new Error("User not found"));

        return;
      }

      socket.data.userId = user.id;

      socket.data.name = user.name;

      socket.data.email = user.email;

      socket.data.joinedProjects = [];

      socket.data.activeActivities = [];

      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket: CollabFlowSocket) => {
    console.log(`Socket connected: ${socket.id} user=${socket.data.userId}`);

    void socket.join(getUserRoom(socket.data.userId));

    let disconnectedProjects: ProjectRoomPayload[] = [];

    let disconnectedActivities: ActiveSocketActivity[] = [];

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

        if (
          !projectAlreadyJoined(
            socket.data.joinedProjects,
            payload.workspaceId,
            payload.projectId,
          )
        ) {
          socket.data.joinedProjects.push({
            workspaceId: payload.workspaceId,

            projectId: payload.projectId,
          });
        }

        await emitProjectPresence(payload.workspaceId, payload.projectId);
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

      const relatedActivities = socket.data.activeActivities.filter(
        (activity) =>
          activity.workspaceId === payload.workspaceId &&
          activity.projectId === payload.projectId,
      );

      for (const activity of relatedActivities) {
        emitActivity(socket, {
          ...activity,

          active: false,
        });
      }

      socket.data.activeActivities = socket.data.activeActivities.filter(
        (activity) =>
          !(
            activity.workspaceId === payload.workspaceId &&
            activity.projectId === payload.projectId
          ),
      );

      const room = getProjectRoom(payload.workspaceId, payload.projectId);

      await socket.leave(room);

      socket.data.joinedProjects = socket.data.joinedProjects.filter(
        (project) =>
          !(
            project.workspaceId === payload.workspaceId &&
            project.projectId === payload.projectId
          ),
      );

      await emitProjectPresence(payload.workspaceId, payload.projectId);
    });

    socket.on("issue:activity", (payload) => {
      if (!isValidActivityPayload(payload)) {
        return;
      }

      if (!isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)) {
        return;
      }

      if (payload.active) {
        const exists = socket.data.activeActivities.some((activity) =>
          activityMatches(activity, payload),
        );

        if (!exists) {
          socket.data.activeActivities.push({
            workspaceId: payload.workspaceId,

            projectId: payload.projectId,

            issueId: payload.issueId,

            activity: payload.activity,
          });
        }
      } else {
        socket.data.activeActivities = socket.data.activeActivities.filter(
          (activity) => !activityMatches(activity, payload),
        );
      }

      emitActivity(socket, payload);
    });

    socket.on("issue:created", async (payload) => {
      if (
        !isValidIssuePayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
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

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("issue:created", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issue,
        });

      if (issue.assigneeId) {
        const notification = await getAssignmentNotification(
          issue.id,
          issue.assigneeId,
          new Date(issue.createdAt),
        );

        if (notification) {
          io.to(getUserRoom(notification.recipientId)).emit(
            "notification:created",
            notification,
          );
        }
      }
    });

    socket.on("issue:updated", async (payload) => {
      if (
        !isValidIssuePayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
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

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("issue:updated", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issue,
        });

      if (issue.assigneeId) {
        const notification = await getAssignmentNotification(
          issue.id,
          issue.assigneeId,
          new Date(issue.updatedAt),
        );

        if (notification) {
          io.to(getUserRoom(notification.recipientId)).emit(
            "notification:created",
            notification,
          );
        }
      }
    });

    socket.on("issue:moved", async (payload) => {
      if (
        !isValidIssuePayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
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

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("issue:moved", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issue,
        });
    });

    socket.on("issue:deleted", (payload) => {
      if (
        !isValidIssuePayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
      ) {
        return;
      }

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("issue:deleted", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issueId: payload.issueId,
        });
    });

    socket.on("comment:created", async (payload) => {
      if (
        !isValidCommentPayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
      ) {
        return;
      }

      const comment = await getRealtimeComment(
        payload.workspaceId,
        payload.projectId,
        payload.issueId,
        payload.commentId,
      );

      if (!comment) {
        return;
      }

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("comment:created", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issueId: payload.issueId,

          comment,
        });

      const notifications = await getMentionNotifications(payload.commentId);

      for (const notification of notifications) {
        io.to(getUserRoom(notification.recipientId)).emit(
          "notification:created",
          notification,
        );
      }
    });

    socket.on("comment:updated", async (payload) => {
      if (
        !isValidCommentPayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
      ) {
        return;
      }

      const comment = await getRealtimeComment(
        payload.workspaceId,
        payload.projectId,
        payload.issueId,
        payload.commentId,
      );

      if (!comment) {
        return;
      }

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("comment:updated", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issueId: payload.issueId,

          comment,
        });
    });

    socket.on("comment:deleted", (payload) => {
      if (
        !isValidCommentPayload(payload) ||
        !isAuthorizedRoom(socket, payload.workspaceId, payload.projectId)
      ) {
        return;
      }

      socket
        .to(getProjectRoom(payload.workspaceId, payload.projectId))
        .emit("comment:deleted", {
          workspaceId: payload.workspaceId,

          projectId: payload.projectId,

          issueId: payload.issueId,

          commentId: payload.commentId,
        });
    });

    socket.on("disconnecting", () => {
      disconnectedProjects = [...socket.data.joinedProjects];

      disconnectedActivities = [...socket.data.activeActivities];
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);

      for (const activity of disconnectedActivities) {
        io.to(getProjectRoom(activity.workspaceId, activity.projectId)).emit(
          "issue:activity",
          {
            workspaceId: activity.workspaceId,

            projectId: activity.projectId,

            issueId: activity.issueId,

            activity: activity.activity,

            active: false,

            user: {
              id: socket.data.userId,

              name: socket.data.name,

              email: socket.data.email,
            },
          },
        );
      }

      for (const project of disconnectedProjects) {
        void emitProjectPresence(project.workspaceId, project.projectId);
      }
    });
  });

  return io;
}
