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

function normalizeDetails(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export async function getProjectActivity(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const userId = req.userId;

    if (!workspaceId || !projectId) {
      res.status(400).json({
        message: "Invalid workspace or project identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

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
      res.status(403).json({
        message: "You do not have access to this workspace",
      });

      return;
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

    if (!project) {
      res.status(404).json({
        message: "Project not found",
      });

      return;
    }

    const logs = await prisma.activityLog.findMany({
      where: {
        workspaceId,
        projectId,
      },

      orderBy: {
        createdAt: "desc",
      },

      take: 50,
    });

    const actorIds = [...new Set(logs.map((log) => log.actorId))];

    const actors =
      actorIds.length > 0
        ? await prisma.user.findMany({
            where: {
              id: {
                in: actorIds,
              },
            },

            select: {
              id: true,
              name: true,
              email: true,
            },
          })
        : [];

    const actorsById = new Map(actors.map((actor) => [actor.id, actor]));

    const activity = logs.map((log) => ({
      id: log.id,

      workspaceId: log.workspaceId,

      projectId: log.projectId,

      issueId: log.issueId,

      action: log.action,

      details: normalizeDetails(log.details),

      createdAt: log.createdAt.toISOString(),

      actor: actorsById.get(log.actorId) ?? {
        id: log.actorId,

        name: "Unknown user",

        email: "",
      },
    }));

    res.status(200).json({
      activity,
    });
  } catch (error) {
    console.error("Unable to load project activity:", error);

    res.status(500).json({
      message: "Unable to load project activity",
    });
  }
}
