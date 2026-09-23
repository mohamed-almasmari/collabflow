import type { Response } from "express";

import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createIssueSchema } from "../validators/issue.schema.js";

export async function createIssue(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const workspaceId = req.params.workspaceId;
  const projectId = req.params.projectId;

  if (
    typeof workspaceId !== "string" ||
    typeof projectId !== "string"
  ) {
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

  const {
    title,
    description,
    priority,
    assigneeId,
  } = result.data;

  try {
    const membership =
      await prisma.workspaceMember.findUnique({
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
      const assigneeMembership =
        await prisma.workspaceMember.findUnique({
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

    const issue = await prisma.issue.create({
      data: {
        title,
        description: description ?? null,
        priority: priority ?? "MEDIUM",
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