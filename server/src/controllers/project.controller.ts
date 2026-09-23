import type { Response } from "express";

import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../validators/project.schema.js";

export async function createProject(req: AuthenticatedRequest, res: Response) {
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

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
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

export async function getProjects(req: AuthenticatedRequest, res: Response) {
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

    const projects = await prisma.project.findMany({
      where: {
        workspaceId,
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
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      projects,
    });
  } catch (error) {
    console.error("Failed to load projects:", error);

    return res.status(500).json({
      message: "Unable to load projects",
    });
  }
}

export async function getProjectById(req: AuthenticatedRequest, res: Response) {
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

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    return res.status(200).json({
      project,
      currentUserRole: membership.role,
    });
  } catch (error) {
    console.error("Failed to load project:", error);

    return res.status(500).json({
      message: "Unable to load project",
    });
  }
}
export async function updateProject(req: AuthenticatedRequest, res: Response) {
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

  const result = updateProjectSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid project data",
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

    if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
      return res.status(403).json({
        message: "You do not have permission to update projects",
      });
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
        workspaceId,
      },
    });

    if (!existingProject) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const project = await prisma.project.update({
      where: {
        id: projectId,
      },

      data: {
        ...(result.data.name !== undefined && {
          name: result.data.name,
        }),

        ...(result.data.description !== undefined && {
          description: result.data.description,
        }),

        ...(result.data.status !== undefined && {
          status: result.data.status,
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
      },
    });

    return res.status(200).json({
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Project update failed:", error);

    return res.status(500).json({
      message: "Unable to update project",
    });
  }
}
