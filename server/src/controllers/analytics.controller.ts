import type { Response } from "express";

import { prisma } from "../config/database.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

export async function getWorkspaceAnalytics(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;

  if (typeof workspaceId !== "string") {
    return res.status(400).json({
      message: "Workspace ID is required",
    });
  }

  try {
    const membership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.userId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    const today = new Date();

    today.setUTCHours(0, 0, 0, 0);

    const issueWorkspaceFilter = {
      project: {
        workspaceId,
      },
    };

    const [
      totalProjects,
      activeProjects,
      archivedProjects,
      totalIssues,
      todoIssues,
      inProgressIssues,
      doneIssues,
      overdueIssues,
      highPriorityIssues,
    ] = await Promise.all([
      prisma.project.count({
        where: {
          workspaceId,
        },
      }),

      prisma.project.count({
        where: {
          workspaceId,

          status: "ACTIVE",
        },
      }),

      prisma.project.count({
        where: {
          workspaceId,

          status: "ARCHIVED",
        },
      }),

      prisma.issue.count({
        where: {
          ...issueWorkspaceFilter,
        },
      }),

      prisma.issue.count({
        where: {
          ...issueWorkspaceFilter,

          status: "TODO",
        },
      }),

      prisma.issue.count({
        where: {
          ...issueWorkspaceFilter,

          status: "IN_PROGRESS",
        },
      }),

      prisma.issue.count({
        where: {
          ...issueWorkspaceFilter,

          status: "DONE",
        },
      }),

      prisma.issue.count({
        where: {
          ...issueWorkspaceFilter,

          status: {
            not: "DONE",
          },

          dueDate: {
            lt: today,
          },
        },
      }),

      prisma.issue.count({
        where: {
          ...issueWorkspaceFilter,

          status: {
            not: "DONE",
          },

          priority: {
            in: ["HIGH", "URGENT"],
          },
        },
      }),
    ]);

    const completionRate =
      totalIssues === 0 ? 0 : Math.round((doneIssues / totalIssues) * 100);

    return res.status(200).json({
      analytics: {
        totalProjects,
        activeProjects,
        archivedProjects,

        totalIssues,
        todoIssues,
        inProgressIssues,
        doneIssues,

        completionRate,

        overdueIssues,
        highPriorityIssues,
      },
    });
  } catch (error) {
    console.error("Failed to load workspace analytics:", error);

    return res.status(500).json({
      message: "Unable to load workspace analytics",
    });
  }
}
