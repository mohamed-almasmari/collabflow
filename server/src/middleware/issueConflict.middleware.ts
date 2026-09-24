import type { NextFunction, Request, Response } from "express";

import { prisma } from "../config/database.js";

function getRouteParam(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}

export async function requireCurrentIssueVersion(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const issueId = getRouteParam(req.params.issueId);

    if (!workspaceId || !projectId || !issueId) {
      res.status(400).json({
        message: "Invalid workspace, project, or issue identifier",
      });

      return;
    }

    const expectedUpdatedAt = req.header("If-Unmodified-Since");

    if (!expectedUpdatedAt) {
      res.status(428).json({
        message: "Issue version is required before updating",
      });

      return;
    }

    const expectedDate = new Date(expectedUpdatedAt);

    if (Number.isNaN(expectedDate.getTime())) {
      res.status(400).json({
        message: "Invalid issue version",
      });

      return;
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
        updatedAt: true,
      },
    });

    if (!issue) {
      res.status(404).json({
        message: "Issue not found",
      });

      return;
    }

    if (issue.updatedAt.getTime() !== expectedDate.getTime()) {
      res.status(409).json({
        message:
          "This issue was changed by another collaborator. Reload the latest version before saving.",

        code: "ISSUE_EDIT_CONFLICT",

        currentUpdatedAt: issue.updatedAt.toISOString(),
      });

      return;
    }

    next();
  } catch (error) {
    console.error("Issue conflict check failed:", error);

    res.status(500).json({
      message: "Unable to verify issue version",
    });
  }
}
