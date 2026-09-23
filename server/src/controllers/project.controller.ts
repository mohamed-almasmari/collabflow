import type { Response } from "express";

import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createProjectSchema } from "../validators/project.schema.js";

export async function createProject(
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

  const result = createProjectSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid project data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { name, description } = result.data;

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

    if (
      membership.role !== "OWNER" &&
      membership.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "You do not have permission to create projects",
      });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description ?? null,
        workspaceId,
        createdById: req.userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Project creation failed:", error);

    return res.status(500).json({
      message: "Unable to create project",
    });
  }
}