const API_URL = "http://localhost:3000/api";

export type ActivityAction = "CREATED" | "UPDATED" | "MOVED" | "DELETED";

export interface ActivityActor {
  id: string;
  name: string;
  email: string;
}

export interface ActivityDetails {
  title?: string;
  status?: string;
  priority?: string;
  position?: number;

  assigneeId?: string | null;
}

export interface ActivityLog {
  id: string;

  workspaceId: string;

  projectId: string;

  issueId: string | null;

  action: ActivityAction;

  details: ActivityDetails | null;

  createdAt: string;

  actor: ActivityActor;
}

interface ActivityResponse {
  activity: ActivityLog[];
}

interface ApiError {
  message?: string;
}

export async function getProjectActivity(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<ActivityLog[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/activity`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ApiError | null;

    throw new Error(data?.message ?? "Unable to load activity");
  }

  const data: ActivityResponse = await response.json();

  return data.activity;
}
