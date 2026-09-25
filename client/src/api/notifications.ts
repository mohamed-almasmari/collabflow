const API_URL = "http://localhost:3000/api";

export type NotificationType = "COMMENT_MENTION" | "ISSUE_ASSIGNED";

export interface NotificationUser {
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

  actor: NotificationUser;

  workspace: NotificationWorkspace;

  project: NotificationProject;

  issue: NotificationIssue;

  comment: NotificationComment | null;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null);

  return data?.message ?? "Notification request failed";
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
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function markNotificationRead(
  notificationId: string,
  accessToken: string,
): Promise<Notification> {
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
    throw new Error(await getErrorMessage(response));
  }

  const data = await response.json();

  return data.notification;
}

export async function markAllNotificationsRead(
  accessToken: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },

    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}
