import type { Response } from "express";

import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { createWorkspaceSchema } from "../validators/workspace.schema.js";

export async function createWorkspace(
  req: AuthenticatedRequest,
  res: Response,
) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  const result = createWorkspaceSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid workspace data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { name, description } = result.data;

  try {
    const workspace = await prisma.$transaction(async (tx) => {
      const createdWorkspace = await tx.workspace.create({
        data: {
          name,
          description: description ?? null,
          ownerId: req.userId!,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: createdWorkspace.id,
          userId: req.userId!,
          role: "OWNER",
        },
      });

      return createdWorkspace;
    });

    return res.status(201).json({
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    console.error("Workspace creation failed:", error);

    return res.status(500).json({
      message: "Unable to create workspace",
    });
  }
}

export async function getWorkspaces(req: AuthenticatedRequest, res: Response) {
  if (!req.userId) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId: req.userId,
      },

      include: {
        workspace: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },

      orderBy: {
        joinedAt: "desc",
      },
    });

    const workspaces = memberships.map((membership) => ({
      id: membership.workspace.id,
      name: membership.workspace.name,
      description: membership.workspace.description,
      ownerId: membership.workspace.ownerId,
      createdAt: membership.workspace.createdAt,
      updatedAt: membership.workspace.updatedAt,

      owner: membership.workspace.owner,

      role: membership.role,
      joinedAt: membership.joinedAt,
    }));

    return res.status(200).json({
      workspaces,
    });
  } catch (error) {
    console.error("Failed to load workspaces:", error);

    return res.status(500).json({
      message: "Unable to load workspaces",
    });
  }
}
