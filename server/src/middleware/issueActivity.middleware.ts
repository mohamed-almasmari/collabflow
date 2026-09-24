import type { NextFunction, Request, Response } from "express";

import { Prisma } from "../generated/prisma/client.js";

import { prisma } from "../config/database.js";

export type IssueActivityAction = "CREATED" | "UPDATED" | "MOVED" | "DELETED";

interface AuthenticatedRequest extends Request {
  userId?: string;
}

interface IssueResponse {
  id?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  position?: number;
  assigneeId?: string | null;
}

interface IssueResponseBody {
  issue?: IssueResponse;
}

type ActivityDetails = Record<string, Prisma.InputJsonValue | null>;

function getRouteParam(value: string | string[] | undefined): string | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return null;
  }

  return value;
}

function getResponseIssue(body: unknown): IssueResponse | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const responseBody = body as IssueResponseBody;

  if (!responseBody.issue || typeof responseBody.issue !== "object") {
    return null;
  }

  return responseBody.issue;
}

function createDetails(issue: IssueResponse | null): ActivityDetails {
  if (!issue) {
    return {};
  }

  const details: ActivityDetails = {};

  if (typeof issue.title === "string") {
    details.title = issue.title;
  }

  if (typeof issue.status === "string") {
    details.status = issue.status;
  }

  if (typeof issue.priority === "string") {
    details.priority = issue.priority;
  }

  if (typeof issue.position === "number") {
    details.position = issue.position;
  }

  if (issue.assigneeId === null || typeof issue.assigneeId === "string") {
    details.assigneeId = issue.assigneeId;
  }

  return details;
}

async function saveActivity(
  action: IssueActivityAction,
  workspaceId: string,
  projectId: string,
  issueId: string | null,
  actorId: string,
  details: ActivityDetails,
) {
  try {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        projectId,
        issueId,
        actorId,
        action,
        details,
      },
    });
  } catch (error) {
    /*
     * Audit logging should never turn
     * an otherwise successful issue
     * operation into an API failure.
     */
    console.error("Failed to record issue activity:", error);
  }
}

export function recordIssueActivity(action: IssueActivityAction) {
  return function issueActivityMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ) {
    const workspaceId = getRouteParam(req.params.workspaceId);

    const projectId = getRouteParam(req.params.projectId);

    const routeIssueId = getRouteParam(req.params.issueId);

    const actorId = req.userId;

    let responseBody: unknown = null;

    const originalJson = res.json.bind(res);

    res.json = ((body: unknown) => {
      responseBody = body;

      return originalJson(body);
    }) as Response["json"];

    res.on("finish", () => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return;
      }

      if (!workspaceId || !projectId || !actorId) {
        return;
      }

      const responseIssue = getResponseIssue(responseBody);

      const issueId = responseIssue?.id ?? routeIssueId;

      if (!issueId) {
        console.error("Unable to record activity: issue id missing");

        return;
      }

      const details = createDetails(responseIssue);

      void saveActivity(
        action,
        workspaceId,
        projectId,
        issueId,
        actorId,
        details,
      );
    });

    next();
  };
}
