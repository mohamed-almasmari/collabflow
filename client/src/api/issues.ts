const API_URL = "http://localhost:3000/api";

export type IssueStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type IssuePriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface IssueUser {
  id: string;
  name: string;
  email: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string | null;

  status: IssueStatus;
  priority: IssuePriority;

  position: number;

  dueDate: string | null;

  projectId: string;
  createdById: string;
  assigneeId: string | null;

  createdAt: string;
  updatedAt: string;

  createdBy: IssueUser;
  assignee: IssueUser | null;
}

export interface CreateIssueInput {
  title: string;

  description?: string | null;

  priority?: IssuePriority;

  assigneeId?: string | null;

  dueDate?: string | null;
}

export interface UpdateIssueInput {
  title?: string;

  description?: string | null;

  priority?: IssuePriority;

  status?: IssueStatus;

  assigneeId?: string | null;

  dueDate?: string | null;
}

export interface MoveIssueInput {
  status: IssueStatus;

  position: number;
}

interface IssuesResponse {
  issues: Issue[];
}

interface IssueResponse {
  message?: string;

  issue: Issue;
}

interface ApiErrorResponse {
  message?: string;

  code?: string;
}

export class IssueConflictError extends Error {
  constructor(message: string) {
    super(message);

    this.name = "IssueConflictError";
  }
}

async function getErrorData(response: Response): Promise<ApiErrorResponse> {
  return (await response.json().catch(() => null)) ?? {};
}

export async function getIssues(
  workspaceId: string,

  projectId: string,

  accessToken: string,
): Promise<Issue[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new Error(data.message ?? "Unable to load issues");
  }

  const data: IssuesResponse = await response.json();

  return data.issues;
}

export async function getIssueById(
  workspaceId: string,

  projectId: string,

  issueId: string,

  accessToken: string,
): Promise<Issue> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new Error(data.message ?? "Unable to load issue");
  }

  const data: IssueResponse = await response.json();

  return data.issue;
}

export async function createIssue(
  workspaceId: string,

  projectId: string,

  input: CreateIssueInput,

  accessToken: string,
): Promise<Issue> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new Error(data.message ?? "Unable to create issue");
  }

  const data: IssueResponse = await response.json();

  return data.issue;
}

export async function updateIssue(
  workspaceId: string,

  projectId: string,

  issueId: string,

  input: UpdateIssueInput,

  currentUpdatedAt: string,

  accessToken: string,
): Promise<Issue> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,

        "If-Unmodified-Since": currentUpdatedAt,
      },

      credentials: "include",

      body: JSON.stringify(input),
    },
  );

  if (response.status === 409) {
    const data = await getErrorData(response);

    throw new IssueConflictError(
      data.message ?? "This issue was changed by another collaborator.",
    );
  }

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new Error(data.message ?? "Unable to update issue");
  }

  const data: IssueResponse = await response.json();

  return data.issue;
}

export async function moveIssue(
  workspaceId: string,

  projectId: string,

  issueId: string,

  input: MoveIssueInput,

  accessToken: string,
): Promise<Issue> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/move`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",

      body: JSON.stringify(input),
    },
  );

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new Error(data.message ?? "Unable to move issue");
  }

  const data: IssueResponse = await response.json();

  return data.issue;
}

export async function deleteIssue(
  workspaceId: string,

  projectId: string,

  issueId: string,

  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    const data = await getErrorData(response);

    throw new Error(data.message ?? "Unable to delete issue");
  }
}
