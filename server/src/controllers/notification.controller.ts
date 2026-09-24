import type { Request, Response } from "express";

import { prisma } from "../config/database.js";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

function getRouteParam(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}

export async function getNotifications(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          recipientId: userId,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 50,

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
      }),

      prisma.notification.count({
        where: {
          recipientId: userId,

          readAt: null,
        },
      }),
    ]);

    res.status(200).json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Unable to load notifications:", error);

    res.status(500).json({
      message: "Unable to load notifications",
    });
  }
}

export async function markNotificationRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.userId;

    const notificationId = getRouteParam(req.params.notificationId);

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    if (!notificationId) {
      res.status(400).json({
        message: "Invalid notification identifier",
      });

      return;
    }

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,

        recipientId: userId,
      },

      select: {
        id: true,

        readAt: true,
      },
    });

    if (!notification) {
      res.status(404).json({
        message: "Notification not found",
      });

      return;
    }

    const updatedNotification = notification.readAt
      ? await prisma.notification.findUnique({
          where: {
            id: notificationId,
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
        })
      : await prisma.notification.update({
          where: {
            id: notificationId,
          },

          data: {
            readAt: new Date(),
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

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: userId,

        readAt: null,
      },
    });

    res.status(200).json({
      message: "Notification marked as read",

      notification: updatedNotification,

      unreadCount,
    });
  } catch (error) {
    console.error("Unable to mark notification as read:", error);

    res.status(500).json({
      message: "Unable to update notification",
    });
  }
}

export async function markAllNotificationsRead(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: userId,

        readAt: null,
      },

      data: {
        readAt: new Date(),
      },
    });

    res.status(200).json({
      message: "All notifications marked as read",

      unreadCount: 0,
    });
  } catch (error) {
    console.error("Unable to mark notifications as read:", error);

    res.status(500).json({
      message: "Unable to update notifications",
    });
  }
}
