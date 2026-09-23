import type { Response } from "express";

import { prisma } from "../config/database.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import {
  addWorkspaceMemberSchema,
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "../validators/workspace.schema.js";

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

export async function getWorkspaceById(
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

            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    return res.status(200).json({
      workspace: {
        id: membership.workspace.id,
        name: membership.workspace.name,
        description: membership.workspace.description,
        ownerId: membership.workspace.ownerId,
        createdAt: membership.workspace.createdAt,
        updatedAt: membership.workspace.updatedAt,

        owner: membership.workspace.owner,

        currentUserRole: membership.role,

        members: membership.workspace.members.map((member) => ({
          id: member.id,
          role: member.role,
          joinedAt: member.joinedAt,
          user: member.user,
        })),
      },
    });
  } catch (error) {
    console.error("Failed to load workspace:", error);

    return res.status(500).json({
      message: "Unable to load workspace",
    });
  }
}

export async function updateWorkspace(
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

  const result = updateWorkspaceSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid workspace data",
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
        message: "You do not have permission to update this workspace",
      });
    }

    const workspace = await prisma.workspace.update({
      where: {
        id: workspaceId,
      },

      data: {
        ...(result.data.name !== undefined && {
          name: result.data.name,
        }),

        ...(result.data.description !== undefined && {
          description: result.data.description,
        }),
      },
    });

    return res.status(200).json({
      message: "Workspace updated successfully",
      workspace,
    });
  } catch (error) {
    console.error("Workspace update failed:", error);

    return res.status(500).json({
      message: "Unable to update workspace",
    });
  }
}

export async function addWorkspaceMember(
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

  const result = addWorkspaceMemberSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      message: "Invalid member data",
      errors: result.error.flatten().fieldErrors,
    });
  }

  const { email, role } = result.data;

  try {
    const requestingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: req.userId,
        },
      },
    });

    if (!requestingMembership) {
      return res.status(403).json({
        message: "You do not have access to this workspace",
      });
    }

    if (
      requestingMembership.role !== "OWNER" &&
      requestingMembership.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "You do not have permission to add workspace members",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      return res.status(409).json({
        message: "User is already a member of this workspace",
      });
    }

    const membership = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(201).json({
      message: "Workspace member added successfully",
      member: {
        id: membership.id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        user: membership.user,
      },
    });
  } catch (error) {
    console.error("Failed to add workspace member:", error);

    return res.status(500).json({
      message: "Unable to add workspace member",
    });
  }
}
