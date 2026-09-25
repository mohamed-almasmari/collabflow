import { useEffect, useRef, useState } from "react";

import { useNavigate } from "react-router";

import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "../../api/notifications";

import { useAuth } from "../../hooks/useAuth";

import { getSocket } from "../../socket/socket";

function formatNotificationMessage(notification: Notification) {
  switch (notification.type) {
    case "ISSUE_ASSIGNED":
      return `${notification.actor.name} assigned you "${notification.issue.title}"`;

    case "COMMENT_MENTION":
      return `${notification.actor.name} mentioned you in "${notification.issue.title}"`;

    default:
      return "You have a new notification";
  }
}

function formatNotificationContext(notification: Notification) {
  if (notification.type === "ISSUE_ASSIGNED") {
    return `${notification.workspace.name} · ${notification.project.name}`;
  }

  if (notification.comment) {
    const body = notification.comment.body.trim();

    if (body.length > 80) {
      return `${body.slice(0, 80)}...`;
    }

    return body;
  }

  return `${notification.workspace.name} · ${notification.project.name}`;
}

function formatRelativeTime(createdAt: string) {
  const created = new Date(createdAt);

  const now = new Date();

  const difference = now.getTime() - created.getTime();

  const seconds = Math.floor(difference / 1000);

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return created.toLocaleDateString();
}

function NotificationBell() {
  const { accessToken } = useAuth();

  const navigate = useNavigate();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [unreadCount, setUnreadCount] = useState(0);

  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  const [markingAll, setMarkingAll] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setNotifications([]);

      setUnreadCount(0);

      return;
    }

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadNotifications() {
      try {
        setLoading(true);

        setError(null);

        const data = await getNotifications(currentAccessToken);

        if (cancelled) {
          return;
        }

        setNotifications(data.notifications);

        setUnreadCount(data.unreadCount);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load notifications",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket = getSocket(accessToken);

    function handleNotificationCreated(notification: Notification) {
      setNotifications((current) => {
        const alreadyExists = current.some(
          (item) => item.id === notification.id,
        );

        if (alreadyExists) {
          return current;
        }

        return [notification, ...current].slice(0, 50);
      });

      if (!notification.readAt) {
        setUnreadCount((current) => current + 1);
      }
    }

    socket.on("notification:created", handleNotificationCreated);

    return () => {
      socket.off("notification:created", handleNotificationCreated);
    };
  }, [accessToken]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  async function handleNotificationClick(notification: Notification) {
    if (!accessToken) {
      return;
    }

    setOpen(false);

    if (!notification.readAt) {
      try {
        const updated = await markNotificationRead(
          notification.id,
          accessToken,
        );

        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? updated : item)),
        );

        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (readError) {
        console.error("Unable to mark notification as read:", readError);
      }
    }

    navigate(
      `/workspaces/${notification.workspaceId}/projects/${notification.projectId}/board?issue=${notification.issueId}`,
    );
  }

  async function handleMarkAllRead() {
    if (!accessToken || unreadCount === 0) {
      return;
    }

    try {
      setMarkingAll(true);

      setError(null);

      await markAllNotificationsRead(accessToken);

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,

          readAt: notification.readAt ?? readAt,
        })),
      );

      setUnreadCount(0);
    } catch (markAllError) {
      setError(
        markAllError instanceof Error
          ? markAllError.message
          : "Unable to mark notifications as read",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <span aria-hidden="true" className="text-lg">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold text-slate-950">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="font-semibold text-white">Notifications</h2>

              <p className="mt-0.5 text-xs text-slate-500">
                {unreadCount === 0
                  ? "You're all caught up"
                  : `${unreadCount} unread`}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  void handleMarkAllRead();
                }}
                disabled={markingAll}
                className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300 disabled:opacity-50"
              >
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>

          {error && (
            <div className="border-b border-red-900/60 bg-red-950/30 px-4 py-3 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="text-2xl">🔔</div>

                <p className="mt-3 text-sm font-medium text-slate-300">
                  No notifications
                </p>

                <p className="mt-1 text-xs text-slate-600">
                  Mentions and issue assignments will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => {
                const unread = !notification.readAt;

                const assignment = notification.type === "ISSUE_ASSIGNED";

                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => {
                      void handleNotificationClick(notification);
                    }}
                    className={`flex w-full gap-3 border-b border-slate-800/80 px-4 py-4 text-left transition last:border-b-0 hover:bg-slate-800/70 ${
                      unread ? "bg-cyan-500/[0.04]" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm ${
                        assignment
                          ? "border-violet-500/30 bg-violet-500/10 text-violet-300"
                          : "border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
                      }`}
                    >
                      {assignment ? "→" : "@"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-2">
                        <p
                          className={`flex-1 text-sm leading-5 ${
                            unread
                              ? "font-medium text-slate-100"
                              : "text-slate-300"
                          }`}
                        >
                          {formatNotificationMessage(notification)}
                        </p>

                        {unread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                        )}
                      </div>

                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                        {formatNotificationContext(notification)}
                      </p>

                      <p className="mt-1.5 text-[11px] text-slate-600">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
