const API_URL = "http://localhost:3000/api";

export interface PriorityDistribution {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  URGENT: number;
}

export interface WorkloadMember {
  userId: string;
  name: string;
  email: string;

  total: number;
  todo: number;
  inProgress: number;
  done: number;
  open: number;
}

export interface WorkspaceAnalytics {
  totalProjects: number;

  activeProjects: number;

  archivedProjects: number;

  totalIssues: number;

  todoIssues: number;

  inProgressIssues: number;

  doneIssues: number;

  completionRate: number;

  overdueIssues: number;

  highPriorityIssues: number;

  unassignedIssues: number;

  priorityDistribution: PriorityDistribution;

  workload: WorkloadMember[];
}

interface WorkspaceAnalyticsResponse {
  analytics: WorkspaceAnalytics;
}

export async function getWorkspaceAnalytics(
  workspaceId: string,
  accessToken: string,
): Promise<WorkspaceAnalytics> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/analytics/summary`,
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

    throw new Error(data?.message ?? "Unable to load workspace analytics");
  }

  const data: WorkspaceAnalyticsResponse = await response.json();

  return data.analytics;
}
