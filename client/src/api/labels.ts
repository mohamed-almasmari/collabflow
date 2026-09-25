const API_URL = "http://localhost:3000/api";

export interface Label {
  id: string;
  name: string;
  color: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getLabels(
  workspaceId: string,
  projectId: string,
  accessToken: string,
): Promise<Label[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/labels`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to load labels");
  }

  return data.labels;
}

export async function createLabel(
  workspaceId: string,
  projectId: string,
  input: {
    name: string;
    color: string;
  },
  accessToken: string,
): Promise<Label> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/labels`,
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

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message ?? "Unable to create label");
  }

  return data.label;
}
