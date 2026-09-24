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
  description?: string;
  priority?: IssuePriority;
  assigneeId?: string | null;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string | null;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
}

interface GetIssuesResponse {
  issues: Issue[];
}

interface CreateIssueResponse {
  message: string;
  issue: Issue;
}

interface UpdateIssueResponse {
  message: string;
  issue: Issue;
}

interface MoveIssueInput {
  status: IssueStatus;
  position: number;
}

interface MoveIssueResponse {
  message: string;
  issue: Issue;
}

interface DeleteIssueResponse {
  message: string;
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
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to load issues");
  }

  const data: GetIssuesResponse = await response.json();

  return data.issues;
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
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to create issue");
  }

  const data: CreateIssueResponse = await response.json();

  return data.issue;
}

export async function updateIssue(
  workspaceId: string,
  projectId: string,
  issueId: string,
  input: UpdateIssueInput,
  accessToken: string,
): Promise<Issue> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}`,
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
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to update issue");
  }

  const data: UpdateIssueResponse = await response.json();

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
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to move issue");
  }

  const data: MoveIssueResponse = await response.json();

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
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to delete issue");
  }

  const data: DeleteIssueResponse = await response.json();

  if (!data.message) {
    throw new Error("Invalid delete response");
  }
}
