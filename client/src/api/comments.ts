const API_URL = "http://localhost:3000/api";

export interface CommentAuthor {
  id: string;
  name: string;
  email: string;
}

export interface IssueComment {
  id: string;
  body: string;
  issueId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

interface CommentsResponse {
  comments: IssueComment[];
}

interface CommentMutationResponse {
  message: string;
  comment: IssueComment;
}

interface ApiErrorResponse {
  message?: string;
}

async function getErrorMessage(response: Response, fallback: string) {
  const data = (await response
    .json()
    .catch(() => null)) as ApiErrorResponse | null;

  return data?.message ?? fallback;
}

export async function getComments(
  workspaceId: string,
  projectId: string,
  issueId: string,
  accessToken: string,
): Promise<IssueComment[]> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments`,
    {
      method: "GET",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Unable to load comments"));
  }

  const data: CommentsResponse = await response.json();

  return data.comments;
}

export async function createComment(
  workspaceId: string,
  projectId: string,
  issueId: string,
  body: string,
  accessToken: string,
): Promise<IssueComment> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",

      body: JSON.stringify({
        body,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to create comment"),
    );
  }

  const data: CommentMutationResponse = await response.json();

  return data.comment;
}

export async function updateComment(
  workspaceId: string,
  projectId: string,
  issueId: string,
  commentId: string,
  body: string,
  accessToken: string,
): Promise<IssueComment> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",

      body: JSON.stringify({
        body,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to update comment"),
    );
  }

  const data: CommentMutationResponse = await response.json();

  return data.comment;
}

export async function deleteComment(
  workspaceId: string,
  projectId: string,
  issueId: string,
  commentId: string,
  accessToken: string,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/comments/${commentId}`,
    {
      method: "DELETE",

      headers: {
        Authorization: `Bearer ${accessToken}`,
      },

      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Unable to delete comment"),
    );
  }
}
