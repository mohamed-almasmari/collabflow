import type { Request, Response } from "express";

import { prisma } from "../config/database.js";

import {
  createIssueSchema,
  moveIssueSchema,
  updateIssueSchema,
} from "../validators/issue.schema.js";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

function getParam(value: string | string[] | undefined) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}

function parseDueDate(value: string | null): Date | null {
  if (value === null) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

async function getProjectAccess(
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

    select: {
      id: true,
      role: true,
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

    select: {
      id: true,
      status: true,
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

async function validateAssignee(
  workspaceId: string,
  assigneeId: string | null | undefined,
) {
  if (assigneeId === undefined || assigneeId === null) {
    return true;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: assigneeId,
      },
    },

    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

const issueInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },

  assignee: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const;

export async function getIssues(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

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

    const access = await getProjectAccess(userId, workspaceId, projectId);

    if (!access) {
      res.status(404).json({
        message: "Project not found or access denied",
      });

      return;
    }

    const issues = await prisma.issue.findMany({
      where: {
        projectId,
      },

      orderBy: [
        {
          status: "asc",
        },
        {
          position: "asc",
        },
        {
          createdAt: "asc",
        },
      ],

      include: issueInclude,
    });

    res.status(200).json({
      issues,
    });
  } catch (error) {
    console.error("Unable to load issues:", error);

    res.status(500).json({
      message: "Unable to load issues",
    });
  }
}

export async function getIssueById(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const access = await getProjectAccess(userId, workspaceId, projectId);

    if (!access) {
      res.status(404).json({
        message: "Project not found or access denied",
      });

      return;
    }

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,

        projectId,
      },

      include: issueInclude,
    });

    if (!issue) {
      res.status(404).json({
        message: "Issue not found",
      });

      return;
    }

    res.status(200).json({
      issue,
    });
  } catch (error) {
    console.error("Unable to load issue:", error);

    res.status(500).json({
      message: "Unable to load issue",
    });
  }
}

export async function createIssue(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

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

    const parsed = createIssueSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid issue data",
      });

      return;
    }

    const access = await getProjectAccess(userId, workspaceId, projectId);

    if (!access) {
      res.status(404).json({
        message: "Project not found or access denied",
      });

      return;
    }

    if (access.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const assigneeValid = await validateAssignee(
      workspaceId,
      parsed.data.assigneeId,
    );

    if (!assigneeValid) {
      res.status(400).json({
        message: "Assignee must be a member of this workspace",
      });

      return;
    }

    const lastIssue = await prisma.issue.findFirst({
      where: {
        projectId,

        status: "TODO",
      },

      orderBy: {
        position: "desc",
      },

      select: {
        position: true,
      },
    });

    const issue = await prisma.issue.create({
      data: {
        title: parsed.data.title,

        description: parsed.data.description ?? null,

        priority: parsed.data.priority ?? "MEDIUM",

        status: "TODO",

        position: (lastIssue?.position ?? -1) + 1,

        dueDate: parsed.data.dueDate ? parseDueDate(parsed.data.dueDate) : null,

        projectId,

        createdById: userId,

        assigneeId: parsed.data.assigneeId ?? null,
      },

      include: issueInclude,
    });

    res.status(201).json({
      message: "Issue created successfully",

      issue,
    });
  } catch (error) {
    console.error("Unable to create issue:", error);

    res.status(500).json({
      message: "Unable to create issue",
    });
  }
}

export async function updateIssue(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const parsed = updateIssueSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid issue data",
      });

      return;
    }

    const access = await getProjectAccess(userId, workspaceId, projectId);

    if (!access) {
      res.status(404).json({
        message: "Project not found or access denied",
      });

      return;
    }

    if (access.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,

        projectId,
      },

      select: {
        id: true,
      },
    });

    if (!existingIssue) {
      res.status(404).json({
        message: "Issue not found",
      });

      return;
    }

    const assigneeValid = await validateAssignee(
      workspaceId,
      parsed.data.assigneeId,
    );

    if (!assigneeValid) {
      res.status(400).json({
        message: "Assignee must be a member of this workspace",
      });

      return;
    }

    const issue = await prisma.issue.update({
      where: {
        id: issueId,
      },

      data: {
        ...(parsed.data.title !== undefined && {
          title: parsed.data.title,
        }),

        ...(parsed.data.description !== undefined && {
          description: parsed.data.description,
        }),

        ...(parsed.data.priority !== undefined && {
          priority: parsed.data.priority,
        }),

        ...(parsed.data.status !== undefined && {
          status: parsed.data.status,
        }),

        ...(parsed.data.assigneeId !== undefined && {
          assigneeId: parsed.data.assigneeId,
        }),

        ...(parsed.data.dueDate !== undefined
          ? {
              dueDate: parseDueDate(parsed.data.dueDate),
            }
          : {}),
      },

      include: issueInclude,
    });

    res.status(200).json({
      message: "Issue updated successfully",

      issue,
    });
  } catch (error) {
    console.error("Unable to update issue:", error);

    res.status(500).json({
      message: "Unable to update issue",
    });
  }
}

export async function moveIssue(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const parsed = moveIssueSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.issues[0]?.message ?? "Invalid move request",
      });

      return;
    }

    const access = await getProjectAccess(userId, workspaceId, projectId);

    if (!access) {
      res.status(404).json({
        message: "Project not found or access denied",
      });

      return;
    }

    if (access.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,

        projectId,
      },
    });

    if (!existingIssue) {
      res.status(404).json({
        message: "Issue not found",
      });

      return;
    }

    const targetCount = await prisma.issue.count({
      where: {
        projectId,

        status: parsed.data.status,

        id: {
          not: issueId,
        },
      },
    });

    const targetPosition = Math.min(parsed.data.position, targetCount);

    await prisma.$transaction(async (transaction) => {
      if (existingIssue.status === parsed.data.status) {
        if (targetPosition > existingIssue.position) {
          await transaction.issue.updateMany({
            where: {
              projectId,

              status: existingIssue.status,

              position: {
                gt: existingIssue.position,

                lte: targetPosition,
              },

              id: {
                not: issueId,
              },
            },

            data: {
              position: {
                decrement: 1,
              },
            },
          });
        } else if (targetPosition < existingIssue.position) {
          await transaction.issue.updateMany({
            where: {
              projectId,

              status: existingIssue.status,

              position: {
                gte: targetPosition,

                lt: existingIssue.position,
              },

              id: {
                not: issueId,
              },
            },

            data: {
              position: {
                increment: 1,
              },
            },
          });
        }
      } else {
        await transaction.issue.updateMany({
          where: {
            projectId,

            status: existingIssue.status,

            position: {
              gt: existingIssue.position,
            },
          },

          data: {
            position: {
              decrement: 1,
            },
          },
        });

        await transaction.issue.updateMany({
          where: {
            projectId,

            status: parsed.data.status,

            position: {
              gte: targetPosition,
            },
          },

          data: {
            position: {
              increment: 1,
            },
          },
        });
      }

      await transaction.issue.update({
        where: {
          id: issueId,
        },

        data: {
          status: parsed.data.status,

          position: targetPosition,
        },
      });
    });

    const issue = await prisma.issue.findUnique({
      where: {
        id: issueId,
      },

      include: issueInclude,
    });

    if (!issue) {
      res.status(404).json({
        message: "Issue not found",
      });

      return;
    }

    res.status(200).json({
      message: "Issue moved successfully",

      issue,
    });
  } catch (error) {
    console.error("Unable to move issue:", error);

    res.status(500).json({
      message: "Unable to move issue",
    });
  }
}

export async function deleteIssue(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getParam(req.params.workspaceId);

    const projectId = getParam(req.params.projectId);

    const issueId = getParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const access = await getProjectAccess(userId, workspaceId, projectId);

    if (!access) {
      res.status(404).json({
        message: "Project not found or access denied",
      });

      return;
    }

    if (access.project.status === "ARCHIVED") {
      res.status(403).json({
        message: "Archived projects cannot be modified",
      });

      return;
    }

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,

        projectId,
      },

      select: {
        id: true,
        status: true,
        position: true,
      },
    });

    if (!issue) {
      res.status(404).json({
        message: "Issue not found",
      });

      return;
    }

    await prisma.$transaction(async (transaction) => {
      await transaction.issue.delete({
        where: {
          id: issueId,
        },
      });

      await transaction.issue.updateMany({
        where: {
          projectId,

          status: issue.status,

          position: {
            gt: issue.position,
          },
        },

        data: {
          position: {
            decrement: 1,
          },
        },
      });
    });

    res.status(200).json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("Unable to delete issue:", error);

    res.status(500).json({
      message: "Unable to delete issue",
    });
  }
}
