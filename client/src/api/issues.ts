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

interface GetIssuesResponse {
  issues: Issue[];
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

interface MoveIssueInput {
  status: IssueStatus;
  position: number;
}

interface MoveIssueResponse {
  message: string;
  issue: Issue;
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
