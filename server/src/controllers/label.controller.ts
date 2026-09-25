import type { Request, Response } from "express";

import { prisma } from "../config/database.js";

import { createLabelSchema } from "../validators/label.schema.js";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

async function hasProjectAccess(
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
  });

  if (!membership) {
    return null;
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,

      workspaceId,
    },
  });

  if (!project) {
    return null;
  }

  return {
    membership,
    project,
  };
}

export async function getLabels(req: AuthenticatedRequest, res: Response) {
  const workspaceId = getParam(req.params.workspaceId);

  const projectId = getParam(req.params.projectId);

  const userId = req.userId;

  if (!workspaceId || !projectId || !userId) {
    res.status(400).json({
      message: "Invalid request",
    });

    return;
  }

  const access = await hasProjectAccess(userId, workspaceId, projectId);

  if (!access) {
    res.status(404).json({
      message: "Project not found or access denied",
    });

    return;
  }

  const labels = await prisma.label.findMany({
    where: {
      projectId,
    },

    orderBy: {
      name: "asc",
    },
  });

  res.json({
    labels,
  });
}

export async function createLabel(req: AuthenticatedRequest, res: Response) {
  const workspaceId = getParam(req.params.workspaceId);

  const projectId = getParam(req.params.projectId);

  const userId = req.userId;

  if (!workspaceId || !projectId || !userId) {
    res.status(400).json({
      message: "Invalid request",
    });

    return;
  }

  const parsed = createLabelSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      message: parsed.error.issues[0]?.message ?? "Invalid label",
    });

    return;
  }

  const access = await hasProjectAccess(userId, workspaceId, projectId);

  if (!access) {
    res.status(404).json({
      message: "Project not found or access denied",
    });

    return;
  }

  if (access.membership.role === "MEMBER") {
    res.status(403).json({
      message: "Only workspace owners and admins can create labels",
    });

    return;
  }

  try {
    const label = await prisma.label.create({
      data: {
        name: parsed.data.name,

        color: parsed.data.color,

        projectId,
      },
    });

    res.status(201).json({
      label,
    });
  } catch {
    res.status(409).json({
      message: "A label with this name already exists",
    });
  }
}
