import { useEffect, useState } from "react";

import { useNavigate } from "react-router";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../../api/notifications";

import { getSocket } from "../../socket/socket";

interface NotificationBellProps {
  accessToken: string;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNotificationText(notification: Notification) {
  switch (notification.type) {
    case "COMMENT_MENTION":
      return `${notification.actor.name} mentioned you in "${notification.issue.title}"`;
  }
}

function NotificationBell({ accessToken }: NotificationBellProps) {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function loadNotifications() {
    try {
      setLoading(true);

      setError(null);

      const data = await getNotifications(accessToken);

      setNotifications(data.notifications);

      setUnreadCount(data.unreadCount);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load notifications",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadNotifications();
  }, [accessToken]);

  useEffect(() => {
    const socket = getSocket(accessToken);

    function handleNotificationCreated(notification: Notification) {
      setNotifications((currentNotifications) => {
        const exists = currentNotifications.some(
          (currentNotification) => currentNotification.id === notification.id,
        );

        if (exists) {
          return currentNotifications;
        }

        return [notification, ...currentNotifications].slice(0, 50);
      });

      if (!notification.readAt) {
        setUnreadCount((currentCount) => currentCount + 1);
      }
    }

    socket.on("notification:created", handleNotificationCreated);

    return () => {
      socket.off("notification:created", handleNotificationCreated);
    };
  }, [accessToken]);

  async function handleNotificationClick(notification: Notification) {
    try {
      if (!notification.readAt) {
        const result = await markNotificationRead(notification.id, accessToken);

        setUnreadCount(result.unreadCount);

        setNotifications((currentNotifications) =>
          currentNotifications.map((currentNotification) =>
            currentNotification.id === notification.id
              ? {
                  ...currentNotification,

                  readAt:
                    result.notification?.readAt ?? new Date().toISOString(),
                }
              : currentNotification,
          ),
        );
      }

      setOpen(false);

      navigate(
        `/workspaces/${notification.workspaceId}/projects/${notification.projectId}/board?issue=${notification.issueId}`,
      );
    } catch (clickError) {
      setError(
        clickError instanceof Error
          ? clickError.message
          : "Unable to open notification",
      );
    }
  }

  async function handleMarkAllRead() {
    try {
      setError(null);

      const result = await markAllNotificationsRead(accessToken);

      setUnreadCount(result.unreadCount);

      const now = new Date().toISOString();

      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,

          readAt: notification.readAt ?? now,
        })),
      );
    } catch (markError) {
      setError(
        markError instanceof Error
          ? markError.message
          : "Unable to update notifications",
      );
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((currentOpen) => !currentOpen);

          if (!open) {
            void loadNotifications();
          }
        }}
        className="relative rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
      >
        <span aria-hidden="true" className="text-lg">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-800 p-4">
            <div>
              <h2 className="font-semibold text-white">Notifications</h2>

              <p className="mt-1 text-xs text-slate-500">
                {unreadCount} unread
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  void handleMarkAllRead();
                }}
                className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
              >
                Mark all read
              </button>
            )}
          </header>

          {error && (
            <div className="border-b border-red-900 bg-red-950/30 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="max-h-[480px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">
                Loading notifications...
              </p>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-400">No notifications yet.</p>

                <p className="mt-1 text-xs text-slate-600">
                  Mentions will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    void handleNotificationClick(notification);
                  }}
                  className={`
                      block w-full border-b border-slate-800 p-4 text-left transition last:border-b-0 hover:bg-slate-800/70
                      ${notification.readAt ? "bg-slate-900" : "bg-cyan-500/5"}
                    `}
                >
                  <div className="flex gap-3">
                    <span
                      className={`
                          mt-2 h-2 w-2 shrink-0 rounded-full
                          ${
                            notification.readAt ? "bg-slate-700" : "bg-cyan-400"
                          }
                        `}
                    />

                    <div className="min-w-0">
                      <p className="text-sm leading-5 text-slate-200">
                        {getNotificationText(notification)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {notification.workspace.name} ·{" "}
                        {notification.project.name}
                      </p>

                      {notification.comment && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {notification.comment.body}
                        </p>
                      )}

                      <time className="mt-2 block text-xs text-slate-600">
                        {formatDate(notification.createdAt)}
                      </time>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
