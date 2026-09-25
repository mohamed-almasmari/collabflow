import type { Response } from "express";

import { prisma } from "../config/database.js";

import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";

interface WorkloadMember {
  userId: string;
  name: string;
  email: string;
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  open: number;
}

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

    const [totalProjects, activeProjects, archivedProjects, issues] =
      await Promise.all([
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

        prisma.issue.findMany({
          where: {
            project: {
              workspaceId,
            },
          },

          select: {
            id: true,
            status: true,
            priority: true,
            dueDate: true,

            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        }),
      ]);

    const totalIssues = issues.length;

    const todoIssues = issues.filter((issue) => issue.status === "TODO").length;

    const inProgressIssues = issues.filter(
      (issue) => issue.status === "IN_PROGRESS",
    ).length;

    const doneIssues = issues.filter((issue) => issue.status === "DONE").length;

    const completionRate =
      totalIssues === 0 ? 0 : Math.round((doneIssues / totalIssues) * 100);

    const today = new Date();

    today.setUTCHours(0, 0, 0, 0);

    const overdueIssues = issues.filter(
      (issue) =>
        issue.status !== "DONE" &&
        issue.dueDate !== null &&
        issue.dueDate < today,
    ).length;

    const highPriorityIssues = issues.filter(
      (issue) =>
        issue.status !== "DONE" &&
        (issue.priority === "HIGH" || issue.priority === "URGENT"),
    ).length;

    const priorityDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    for (const issue of issues) {
      priorityDistribution[issue.priority] += 1;
    }

    const workloadMap = new Map<string, WorkloadMember>();

    let unassignedIssues = 0;

    for (const issue of issues) {
      if (!issue.assignee) {
        unassignedIssues += 1;
        continue;
      }

      const existing = workloadMap.get(issue.assignee.id);

      if (existing) {
        existing.total += 1;

        if (issue.status === "TODO") {
          existing.todo += 1;
        }

        if (issue.status === "IN_PROGRESS") {
          existing.inProgress += 1;
        }

        if (issue.status === "DONE") {
          existing.done += 1;
        }

        existing.open = existing.todo + existing.inProgress;

        continue;
      }

      workloadMap.set(issue.assignee.id, {
        userId: issue.assignee.id,
        name: issue.assignee.name,
        email: issue.assignee.email,

        total: 1,

        todo: issue.status === "TODO" ? 1 : 0,

        inProgress: issue.status === "IN_PROGRESS" ? 1 : 0,

        done: issue.status === "DONE" ? 1 : 0,

        open: issue.status === "DONE" ? 0 : 1,
      });
    }

    const workload = Array.from(workloadMap.values()).sort(
      (first, second) =>
        second.open - first.open ||
        second.total - first.total ||
        first.name.localeCompare(second.name),
    );

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
        unassignedIssues,

        priorityDistribution,

        workload,
      },
    });
  } catch (error) {
    console.error("Failed to load workspace analytics:", error);

    return res.status(500).json({
      message: "Unable to load workspace analytics",
    });
  }
}
