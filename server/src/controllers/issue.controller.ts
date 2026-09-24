import type { Response } from "express";

import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createIssueSchema,
  moveIssueSchema,
  updateIssueSchema,
} from "../validators/issue.schema.js";

export async function createIssue(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;
  const projectId = req.params.projectId;

  if (typeof workspaceId !== "string" || typeof projectId !== "string") {
    return res.status(400).json({
      message: "Workspace ID and project ID are required",
    });
  }

  const result = createIssueSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid issue data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { title, description, priority, assigneeId } = result.data;

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
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.status === "ARCHIVED") {
      return res.status(400).json({
        message: "Cannot create issues in an archived project",
      });
    }

    if (assigneeId) {
      const assigneeMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: assigneeId,
          },
        },
      });

      if (!assigneeMembership) {
        return res.status(400).json({
          message: "Assignee must be a member of this workspace",
        });
      }
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

    const nextPosition = (lastIssue?.position ?? -1) + 1;

    const issue = await prisma.issue.create({
      data: {
        title,
        description: description ?? null,
        priority: priority ?? "MEDIUM",
        status: "TODO",
        position: nextPosition,
        projectId,
        createdById: req.userId,
        assigneeId: assigneeId ?? null,
      },

      include: {
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
      },
    });

    return res.status(201).json({
      message: "Issue created successfully",
      issue,
    });
  } catch (error) {
    console.error("Issue creation failed:", error);

    return res.status(500).json({
      message: "Unable to create issue",
    });
  }
}

export async function getIssues(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;
  const projectId = req.params.projectId;

  if (typeof workspaceId !== "string" || typeof projectId !== "string") {
    return res.status(400).json({
      message: "Workspace ID and project ID are required",
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
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const issues = await prisma.issue.findMany({
      where: {
        projectId,
      },
      include: {
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
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          position: "asc",
        },
      ],
    });

    return res.status(200).json({
      issues,
    });
  } catch (error) {
    console.error("Failed to load issues:", error);

    return res.status(500).json({
      message: "Unable to load issues",
    });
  }
}

export async function getIssueById(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;
  const projectId = req.params.projectId;
  const issueId = req.params.issueId;

  if (
    typeof workspaceId !== "string" ||
    typeof projectId !== "string" ||
    typeof issueId !== "string"
  ) {
    return res.status(400).json({
      message: "Workspace ID, project ID, and issue ID are required",
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
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
      include: {
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
      },
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      issue,
      currentUserRole: membership.role,
    });
  } catch (error) {
    console.error("Failed to load issue:", error);

    return res.status(500).json({
      message: "Unable to load issue",
    });
  }
}

export async function updateIssue(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;
  const projectId = req.params.projectId;
  const issueId = req.params.issueId;

  if (
    typeof workspaceId !== "string" ||
    typeof projectId !== "string" ||
    typeof issueId !== "string"
  ) {
    return res.status(400).json({
      message: "Workspace ID, project ID, and issue ID are required",
    });
  }

  const result = updateIssueSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid issue data",
      errors: result.error.flatten().fieldErrors,
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
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.status === "ARCHIVED") {
      return res.status(400).json({
        message: "Cannot update issues in an archived project",
      });
    }

    const existingIssue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
    });

    if (!existingIssue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    if (result.data.assigneeId) {
      const assigneeMembership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: result.data.assigneeId,
          },
        },
      });

      if (!assigneeMembership) {
        return res.status(400).json({
          message: "Assignee must be a member of this workspace",
        });
      }
    }

    const issue = await prisma.issue.update({
      where: {
        id: issueId,
      },

      data: {
        ...(result.data.title !== undefined && {
          title: result.data.title,
        }),

        ...(result.data.description !== undefined && {
          description: result.data.description,
        }),

        ...(result.data.status !== undefined && {
          status: result.data.status,
        }),

        ...(result.data.priority !== undefined && {
          priority: result.data.priority,
        }),

        ...(result.data.assigneeId !== undefined && {
          assigneeId: result.data.assigneeId,
        }),
      },

      include: {
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
      },
    });

    return res.status(200).json({
      message: "Issue updated successfully",
      issue,
    });
  } catch (error) {
    console.error("Issue update failed:", error);

    return res.status(500).json({
      message: "Unable to update issue",
    });
  }
}
export async function moveIssue(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;
  const projectId = req.params.projectId;
  const issueId = req.params.issueId;

  if (
    typeof workspaceId !== "string" ||
    typeof projectId !== "string" ||
    typeof issueId !== "string"
  ) {
    return res.status(400).json({
      message: "Workspace ID, project ID, and issue ID are required",
    });
  }

  const result = moveIssueSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid issue move data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { status, position } = result.data;

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
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (project.status === "ARCHIVED") {
      return res.status(400).json({
        message: "Cannot move issues in an archived project",
      });
    }

    const issue = await prisma.issue.findFirst({
      where: {
        id: issueId,
        projectId,
      },
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    const movedIssue = await prisma.$transaction(async (tx) => {
      await tx.issue.updateMany({
        where: {
          projectId,
          status,
          id: {
            not: issueId,
          },
          position: {
            gte: position,
          },
        },
        data: {
          position: {
            increment: 1,
          },
        },
      });

      return tx.issue.update({
        where: {
          id: issueId,
        },
        data: {
          status,
          position,
        },
        include: {
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
        },
      });
    });

    return res.status(200).json({
      message: "Issue moved successfully",
      issue: movedIssue,
    });
  } catch (error) {
    console.error("Issue move failed:", error);

    return res.status(500).json({
      message: "Unable to move issue",
    });
  }
}
