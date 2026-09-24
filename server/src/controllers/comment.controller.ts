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

function getCommentBody(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const body = value.trim();

  if (body.length < 1 || body.length > 5000) {
    return null;
  }

  return body;
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
      id: true,
      role: true,
    },
  });

  if (!membership) {
    return null;
  }

  const issue = await prisma.issue.findFirst({
    where: {
      id: issueId,

      project: {
        id: projectId,
        workspaceId,
      },
    },

    select: {
      id: true,
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

export async function getComments(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const issueId = getRouteParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid workspace, project, or issue identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
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

    const comments = await prisma.comment.findMany({
      where: {
        issueId,
      },

      orderBy: {
        createdAt: "asc",
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error("Unable to load comments:", error);

    res.status(500).json({
      message: "Unable to load comments",
    });
  }
}

export async function createComment(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const issueId = getRouteParam(req.params.issueId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid workspace, project, or issue identifier",
      });

      return;
    }

    if (!userId) {
      res.status(401).json({
        message: "Authentication required",
      });

      return;
    }

    const body = getCommentBody(req.body?.body);

    if (!body) {
      res.status(400).json({
        message: "Comment must be between 1 and 5000 characters",
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

    const comment = await prisma.comment.create({
      data: {
        body,
        issueId,
        authorId: userId,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Comment created successfully",

      comment,
    });
  } catch (error) {
    console.error("Unable to create comment:", error);

    res.status(500).json({
      message: "Unable to create comment",
    });
  }
}

export async function updateComment(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const issueId = getRouteParam(req.params.issueId);

    const commentId = getRouteParam(req.params.commentId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId || !commentId) {
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

    const body = getCommentBody(req.body?.body);

    if (!body) {
      res.status(400).json({
        message: "Comment must be between 1 and 5000 characters",
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

    const existingComment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        issueId,
      },

      select: {
        id: true,
        authorId: true,
      },
    });

    if (!existingComment) {
      res.status(404).json({
        message: "Comment not found",
      });

      return;
    }

    if (existingComment.authorId !== userId) {
      res.status(403).json({
        message: "You can only edit your own comments",
      });

      return;
    }

    const comment = await prisma.comment.update({
      where: {
        id: commentId,
      },

      data: {
        body,
      },

      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Comment updated successfully",

      comment,
    });
  } catch (error) {
    console.error("Unable to update comment:", error);

    res.status(500).json({
      message: "Unable to update comment",
    });
  }
}

export async function deleteComment(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const issueId = getRouteParam(req.params.issueId);

    const commentId = getRouteParam(req.params.commentId);

    const userId = req.userId;

    if (!workspaceId || !projectId || !issueId || !commentId) {
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

    const comment = await prisma.comment.findFirst({
      where: {
        id: commentId,
        issueId,
      },

      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      res.status(404).json({
        message: "Comment not found",
      });

      return;
    }

    const canDelete =
      comment.authorId === userId ||
      access.membership.role === "OWNER" ||
      access.membership.role === "ADMIN";

    if (!canDelete) {
      res.status(403).json({
        message: "You do not have permission to delete this comment",
      });

      return;
    }

    await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Unable to delete comment:", error);

    res.status(500).json({
      message: "Unable to delete comment",
    });
  }
}
