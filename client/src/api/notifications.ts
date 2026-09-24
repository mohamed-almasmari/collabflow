const API_URL = "http://localhost:3000/api";

export type NotificationType = "COMMENT_MENTION";

export interface NotificationActor {
  id: string;
  name: string;
  email: string;
}

export interface NotificationWorkspace {
  id: string;
  name: string;
}

export interface NotificationProject {
  id: string;
  name: string;
}

export interface NotificationIssue {
  id: string;
  title: string;
}

export interface NotificationComment {
  id: string;
  body: string;
}

export interface Notification {
  id: string;

  type: NotificationType;

  recipientId: string;

  actorId: string;

  workspaceId: string;

  projectId: string;

  issueId: string;

  commentId: string | null;

  readAt: string | null;

  createdAt: string;

  actor: NotificationActor;

  workspace: NotificationWorkspace;

  project: NotificationProject;

  issue: NotificationIssue;

  comment: NotificationComment | null;
}

interface NotificationsResponse {
  notifications: Notification[];

  unreadCount: number;
}

interface NotificationMutationResponse {
  message: string;

  notification?: Notification;

  unreadCount: number;
}

interface ApiErrorResponse {
  message?: string;
}

async function getErrorMessage(response: Response, fallback: string) {
  const data = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null;

  return data?.message ?? fallback;
}

export async function getNotifications(
  accessToken: string,
): Promise<NotificationsResponse> {
  const response = await fetch(`${API_URL}/notifications`, {
    method: "GET",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },

    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to load notifications"),
    );
  }

  return response.json();
}

export async function markNotificationRead(
  notificationId: string,
  accessToken: string,
): Promise<NotificationMutationResponse> {
  const response = await fetch(
    `${API_URL}/notifications/${notificationId}/read`,
    {
      method: "PATCH",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to update notification"),
    );
  }

  return response.json();
}

export async function markAllNotificationsRead(
  accessToken: string,
): Promise<NotificationMutationResponse> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },

    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to update notifications"),
    );
  }

  return response.json();
}
