const API_URL = "http://localhost:3000/api";

export interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  position: number;
  issueId: string;
  createdAt: string;
  updatedAt: string;
}

interface ChecklistResponse {
  items: ChecklistItem[];
}

interface ChecklistItemResponse {
  item: ChecklistItem;
}

async function getErrorMessage(response: Response) {
  const data = await response.json().catch(() => null);

  return data?.message ?? "Request failed";
}

export async function getChecklistItems(
  workspaceId: string,

  projectId: string,

  issueId: string,

  accessToken: string,
): Promise<ChecklistItem[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/checklist`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: ChecklistResponse = await response.json();

  return data.items;
}

export async function createChecklistItem(
  workspaceId: string,

  projectId: string,

  issueId: string,

  title: string,

  accessToken: string,
): Promise<ChecklistItem> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/checklist`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",

      body: JSON.stringify({
        title,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const data: ChecklistItemResponse = await response.json();

  return data.item;
}

export async function updateChecklistItem(
  workspaceId: string,

  projectId: string,

  issueId: string,

  itemId: string,

  input: {
    title?: string;

    completed?: boolean;
  },

  accessToken: string,
): Promise<ChecklistItem> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/checklist/${itemId}`,
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
    throw new Error(await getErrorMessage(response));
  }

  const data: ChecklistItemResponse = await response.json();

  return data.item;
}

export async function deleteChecklistItem(
  workspaceId: string,

  projectId: string,

  issueId: string,

  itemId: string,

  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/checklist/${itemId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}
