import type { Request, Response } from "express";

import { prisma } from "../config/database.js";

import {
  createChecklistItemSchema,
  updateChecklistItemSchema,
} from "../validators/checklist.schema.js";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

async function getIssueAccess(
  userId: string,
  workspaceId: string,
  projectId: string,
  issueId: string,
) {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },

    select: {
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,

      projectId,

      project: {
        workspaceId,
      },
    },

    select: {
      id: true,

      project: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!issue) {
    return null;
  }

  return {
    membership,
    issue,
  };
}

export async function getChecklistItems(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId || !userId) {
      res.status(400).json({
        message: "Invalid request",
      });

      return;
    }

    const access = await getIssueAccess(
      userId,
      workspaceId,
      projectId,
      issueId,
    );

    if (!access) {
      res.status(404).json({
        message: "Issue not found or access denied",
      });

      return;
    }

    const items = await prisma.checklistItem.findMany({
      where: {
        issueId,
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          createdAt: "asc",
        },
      ],
    });

    res.json({
      items,
    });
  } catch (error) {
    console.error("Unable to load checklist:", error);

    res.status(500).json({
      message: "Unable to load checklist",
    });
  }
}

export async function createChecklistItem(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId || !userId) {
      res.status(400).json({
        message: "Invalid request",
      });

      return;
    }

    const parsed = createChecklistItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid checklist item",
      });

      return;
    }

    const access = await getIssueAccess(
      userId,
      workspaceId,
      projectId,
      issueId,
    );

    if (!access) {
      res.status(404).json({
        message: "Issue not found or access denied",
      });

      return;
    }

    if (access.issue.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const lastItem = await prisma.checklistItem.findFirst({
      where: {
        issueId,
      },

      orderBy: {
        position: "desc",
      },

      select: {
        position: true,
      },
    });

    const item = await prisma.checklistItem.create({
      data: {
        title: parsed.data.title,

        issueId,

        position: (lastItem?.position ?? -1) + 1,
      },
    });

    res.status(201).json({
      item,
    });
  } catch (error) {
    console.error("Unable to create checklist item:", error);

    res.status(500).json({
      message: "Unable to create checklist item",
    });
  }
}

export async function updateChecklistItem(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const itemId = getParam(req.params.itemId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId || !itemId || !userId) {
      res.status(400).json({
        message: "Invalid request",
      });

      return;
    }

    const parsed = updateChecklistItemSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid checklist item",
      });

      return;
    }

    const access = await getIssueAccess(
      userId,
      workspaceId,
      projectId,
      issueId,
    );

    if (!access) {
      res.status(404).json({
        message: "Issue not found or access denied",
      });

      return;
    }

    if (access.issue.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const existingItem = await prisma.checklistItem.findFirst({
      where: {
        id: itemId,

        issueId,
      },
    });

    if (!existingItem) {
      res.status(404).json({
        message: "Checklist item not found",
      });

      return;
    }

    const item = await prisma.checklistItem.update({
      where: {
        id: itemId,
      },

      data: {
        ...(parsed.data.title !== undefined
          ? {
              title: parsed.data.title,
            }
          : {}),

        ...(parsed.data.completed !== undefined
          ? {
              completed: parsed.data.completed,
            }
          : {}),
      },
    });

    res.json({
      item,
    });
  } catch (error) {
    console.error("Unable to update checklist item:", error);

    res.status(500).json({
      message: "Unable to update checklist item",
    });
  }
}

export async function deleteChecklistItem(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const itemId = getParam(req.params.itemId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId || !itemId || !userId) {
      res.status(400).json({
        message: "Invalid request",
      });

      return;
    }

    const access = await getIssueAccess(
      userId,
      workspaceId,
      projectId,
      issueId,
    );

    if (!access) {
      res.status(404).json({
        message: "Issue not found or access denied",
      });

      return;
    }

    if (access.issue.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const item = await prisma.checklistItem.findFirst({
      where: {
        id: itemId,

        issueId,
      },
    });

    if (!item) {
      res.status(404).json({
        message: "Checklist item not found",
      });

      return;
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.checklistItem.delete({
        where: {
          id: itemId,
        },
      });

      await transaction.checklistItem.updateMany({
        where: {
          issueId,

          position: {
            gt: item.position,
          },
        },

        data: {
          position: {
            decrement: 1,
          },
        },
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error("Unable to delete checklist item:", error);

    res.status(500).json({
      message: "Unable to delete checklist item",
    });
  }
}
