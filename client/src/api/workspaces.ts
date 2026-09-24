const API_URL = "http://localhost:3000/api";

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

export interface WorkspaceUser {
  id: string;
  name: string;
  email: string;
}

export interface WorkspaceMember {
  id: string;
  role: WorkspaceRole;
  joinedAt: string;
  user: WorkspaceUser;
}

export interface WorkspaceSummary {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;

  owner: WorkspaceUser;

  role: WorkspaceRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;

  owner: WorkspaceUser;

  currentUserRole: WorkspaceRole;

  members: WorkspaceMember[];
}

interface GetWorkspacesResponse {
  workspaces: WorkspaceSummary[];
}

interface GetWorkspaceResponse {
  workspace: Workspace;
}

export async function getWorkspaces(
  accessToken: string,
): Promise<WorkspaceSummary[]> {
  const response = await fetch(`${API_URL}/workspaces`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to load workspaces");
  }

  const data: GetWorkspacesResponse = await response.json();

  return data.workspaces;
}

export async function getWorkspaceById(
  workspaceId: string,
  accessToken: string,
): Promise<Workspace> {
  const response = await fetch(`${API_URL}/workspaces/${workspaceId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(data?.message ?? "Unable to load workspace");
  }

  const data: GetWorkspaceResponse = await response.json();

  return data.workspace;
}
