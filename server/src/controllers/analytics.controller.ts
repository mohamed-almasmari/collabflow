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

interface DailyActivity {
  date: string;
  label: string;
  created: number;
  completed: number;
}

type ProjectHealthStatus = "HEALTHY" | "WATCH" | "AT_RISK";

interface ProjectHealth {
  projectId: string;
  projectName: string;

  totalIssues: number;
  openIssues: number;
  doneIssues: number;

  overdueIssues: number;
  highPriorityIssues: number;

  completionRate: number;

  health: ProjectHealthStatus;
}

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function createRecentActivityDays(numberOfDays: number): DailyActivity[] {
  const days: DailyActivity[] = [];

  const today = new Date();

  today.setUTCHours(0, 0, 0, 0);

  for (let offset = numberOfDays - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);

    date.setUTCDate(today.getUTCDate() - offset);

    days.push({
      date: getDateKey(date),

      label: date.toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "UTC",
      }),

      created: 0,
      completed: 0,
    });
  }

  return days;
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

    const [projects, issues] = await Promise.all([
      prisma.project.findMany({
        where: {
          workspaceId,
        },

        select: {
          id: true,
          name: true,
          status: true,
        },

        orderBy: {
          createdAt: "desc",
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
          projectId: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          completedAt: true,

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

    const totalProjects = projects.length;

    const activeProjects = projects.filter(
      (project) => project.status === "ACTIVE",
    ).length;

    const archivedProjects = projects.filter(
      (project) => project.status === "ARCHIVED",
    ).length;

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

    const tomorrow = new Date(today);

    tomorrow.setUTCDate(today.getUTCDate() + 1);

    const nextSevenDays = new Date(today);

    nextSevenDays.setUTCDate(today.getUTCDate() + 7);

    const overdueIssues = issues.filter(
      (issue) =>
        issue.status !== "DONE" &&
        issue.dueDate !== null &&
        issue.dueDate < today,
    ).length;

    const dueTodayIssues = issues.filter(
      (issue) =>
        issue.status !== "DONE" &&
        issue.dueDate !== null &&
        issue.dueDate >= today &&
        issue.dueDate < tomorrow,
    ).length;

    const dueSoonIssues = issues.filter(
      (issue) =>
        issue.status !== "DONE" &&
        issue.dueDate !== null &&
        issue.dueDate >= tomorrow &&
        issue.dueDate < nextSevenDays,
    ).length;

    const noDueDateIssues = issues.filter(
      (issue) => issue.status !== "DONE" && issue.dueDate === null,
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

    const recentActivity = createRecentActivityDays(7);

    const recentActivityMap = new Map(
      recentActivity.map((day) => [day.date, day]),
    );

    for (const issue of issues) {
      const createdDateKey = getDateKey(issue.createdAt);

      const createdDay = recentActivityMap.get(createdDateKey);

      if (createdDay) {
        createdDay.created += 1;
      }

      if (issue.completedAt) {
        const completedDateKey = getDateKey(issue.completedAt);

        const completedDay = recentActivityMap.get(completedDateKey);

        if (completedDay) {
          completedDay.completed += 1;
        }
      }
    }

    const projectHealth: ProjectHealth[] = projects.map((project) => {
      const projectIssues = issues.filter(
        (issue) => issue.projectId === project.id,
      );

      const total = projectIssues.length;

      const done = projectIssues.filter(
        (issue) => issue.status === "DONE",
      ).length;

      const open = total - done;

      const overdue = projectIssues.filter(
        (issue) =>
          issue.status !== "DONE" &&
          issue.dueDate !== null &&
          issue.dueDate < today,
      ).length;

      const highPriority = projectIssues.filter(
        (issue) =>
          issue.status !== "DONE" &&
          (issue.priority === "HIGH" || issue.priority === "URGENT"),
      ).length;

      const projectCompletionRate =
        total === 0 ? 0 : Math.round((done / total) * 100);

      let health: ProjectHealthStatus = "HEALTHY";

      if (
        overdue >= 2 ||
        (open > 0 && highPriority >= Math.max(2, Math.ceil(open * 0.5)))
      ) {
        health = "AT_RISK";
      } else if (overdue > 0 || highPriority > 0) {
        health = "WATCH";
      }

      return {
        projectId: project.id,

        projectName: project.name,

        totalIssues: total,

        openIssues: open,

        doneIssues: done,

        overdueIssues: overdue,

        highPriorityIssues: highPriority,

        completionRate: projectCompletionRate,

        health,
      };
    });

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
        dueTodayIssues,
        dueSoonIssues,
        noDueDateIssues,

        highPriorityIssues,
        unassignedIssues,

        priorityDistribution,

        workload,

        recentActivity,

        projectHealth,
      },
    });
  } catch (error) {
    console.error("Failed to load workspace analytics:", error);

    return res.status(500).json({
      message: "Unable to load workspace analytics",
    });
  }
}
