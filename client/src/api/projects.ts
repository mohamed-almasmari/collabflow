const API_URL = "http://localhost:3000/api";

export type ProjectStatus = "ACTIVE" | "ARCHIVED";

export interface ProjectCreator {
  id: string;
  name: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;

  workspaceId: string;
  createdById: string;

  createdAt: string;
  updatedAt: string;

  createdBy: ProjectCreator;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

interface GetProjectsResponse {
  projects: Project[];
}

interface GetProjectResponse {
  project: Project;
  currentUserRole: string;
}

interface CreateProjectResponse {
  message: string;
  project: Project;
}

export async function getProjects(
  workspaceId: string,
  accessToken: string,
): Promise<Project[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects`,
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

    throw new Error(data?.message ?? "Unable to load projects");
  }

  const data: GetProjectsResponse = await response.json();

  return data.projects;
}

export async function getProjectById(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<Project> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}`,
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

    throw new Error(data?.message ?? "Unable to load project");
  }

  const data: GetProjectResponse = await response.json();

  return data.project;
}

export async function createProject(
  workspaceId: string,
  input: CreateProjectInput,
  accessToken: string,
): Promise<Project> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects`,
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

    throw new Error(data?.message ?? "Unable to create project");
  }

  const data: CreateProjectResponse = await response.json();

  return data.project;
}
