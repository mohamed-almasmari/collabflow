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

interface GetProjectResponse {
  project: Project;
  currentUserRole: string;
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
