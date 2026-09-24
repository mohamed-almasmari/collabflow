import { useEffect, useState, type FormEvent } from "react";

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
  type IssueComment,
} from "../../api/comments";

import type { Issue } from "../../api/issues";

import { getSocket } from "../../socket/socket";

type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER";

interface CommentsPanelProps {
  workspaceId: string;

  projectId: string;

  issue: Issue;

  accessToken: string;

  currentUserId: string | null;

  currentUserRole: WorkspaceRole | null;

  onClose: () => void;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}

function sortComments(comments: IssueComment[]) {
  return [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function CommentsPanel({
  workspaceId,
  projectId,
  issue,
  accessToken,
  currentUserId,
  currentUserRole,
  onClose,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<IssueComment[]>([]);

  const [body, setBody] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const [editingBody, setEditingBody] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      try {
        setLoading(true);

        setError(null);

        const data = await getComments(
          workspaceId,
          projectId,
          issue.id,
          accessToken,
        );

        if (!cancelled) {
          setComments(sortComments(data));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load comments",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId, issue.id, accessToken]);

  useEffect(() => {
    const socket = getSocket(accessToken);

    function belongsToDiscussion(payload: {
      workspaceId: string;

      projectId: string;

      issueId: string;
    }) {
      return (
        payload.workspaceId === workspaceId &&
        payload.projectId === projectId &&
        payload.issueId === issue.id
      );
    }

    function handleCommentCreated(payload: {
      workspaceId: string;

      projectId: string;

      issueId: string;

      comment: IssueComment;
    }) {
      if (!belongsToDiscussion(payload)) {
        return;
      }

      setComments((currentComments) => {
        const exists = currentComments.some(
          (comment) => comment.id === payload.comment.id,
        );

        if (exists) {
          return currentComments;
        }

        return sortComments([...currentComments, payload.comment]);
      });
    }

    function handleCommentUpdated(payload: {
      workspaceId: string;

      projectId: string;

      issueId: string;

      comment: IssueComment;
    }) {
      if (!belongsToDiscussion(payload)) {
        return;
      }

      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment.id === payload.comment.id ? payload.comment : comment,
        ),
      );
    }

    function handleCommentDeleted(payload: {
      workspaceId: string;

      projectId: string;

      issueId: string;

      commentId: string;
    }) {
      if (!belongsToDiscussion(payload)) {
        return;
      }

      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== payload.commentId),
      );

      setEditingCommentId((currentId) =>
        currentId === payload.commentId ? null : currentId,
      );
    }

    socket.on("comment:created", handleCommentCreated);

    socket.on("comment:updated", handleCommentUpdated);

    socket.on("comment:deleted", handleCommentDeleted);

    return () => {
      socket.off("comment:created", handleCommentCreated);

      socket.off("comment:updated", handleCommentUpdated);

      socket.off("comment:deleted", handleCommentDeleted);
    };
  }, [workspaceId, projectId, issue.id, accessToken]);

  function emitCommentMutation(
    event: "comment:created" | "comment:updated" | "comment:deleted",

    commentId: string,
  ) {
    const socket = getSocket(accessToken);

    if (!socket.connected) {
      return;
    }

    socket.emit(event, {
      workspaceId,
      projectId,
      issueId: issue.id,

      commentId,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      setError("Comment cannot be empty");

      return;
    }

    try {
      setSubmitting(true);

      setError(null);

      const comment = await createComment(
        workspaceId,
        projectId,
        issue.id,
        trimmedBody,
        accessToken,
      );

      setComments((currentComments) =>
        sortComments([...currentComments, comment]),
      );

      setBody("");

      emitCommentMutation("comment:created", comment.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create comment",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleStartEdit(comment: IssueComment) {
    setEditingCommentId(comment.id);

    setEditingBody(comment.body);

    setError(null);
  }

  function handleCancelEdit() {
    setEditingCommentId(null);

    setEditingBody("");
  }

  async function handleSaveEdit(comment: IssueComment) {
    const trimmedBody = editingBody.trim();

    if (!trimmedBody) {
      setError("Comment cannot be empty");

      return;
    }

    try {
      setSavingEdit(true);

      setError(null);

      const updatedComment = await updateComment(
        workspaceId,
        projectId,
        issue.id,
        comment.id,
        trimmedBody,
        accessToken,
      );

      setComments((currentComments) =>
        currentComments.map((currentComment) =>
          currentComment.id === updatedComment.id
            ? updatedComment
            : currentComment,
        ),
      );

      setEditingCommentId(null);

      setEditingBody("");

      emitCommentMutation("comment:updated", updatedComment.id);
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update comment",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleDelete(comment: IssueComment) {
    const confirmed = window.confirm("Delete this comment?");

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(comment.id);

      setError(null);

      await deleteComment(
        workspaceId,
        projectId,
        issue.id,
        comment.id,
        accessToken,
      );

      setComments((currentComments) =>
        currentComments.filter(
          (currentComment) => currentComment.id !== comment.id,
        ),
      );

      emitCommentMutation("comment:deleted", comment.id);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete comment",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70">
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Discussion
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            {issue.title}
          </h2>

          <div className="mt-2 flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {comments.length} {comments.length === 1 ? "comment" : "comments"}
            </p>

            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          Close
        </button>
      </header>

      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div>
          {error && (
            <div className="mb-4 rounded-xl border border-red-900 bg-red-950/30 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-500">Loading comments...</p>
          ) : comments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-400">No comments yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => {
                const isAuthor = currentUserId === comment.authorId;

                const canDelete =
                  isAuthor ||
                  currentUserRole === "OWNER" ||
                  currentUserRole === "ADMIN";

                const isEditing = editingCommentId === comment.id;

                return (
                  <article
                    key={comment.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                          {getInitials(comment.author.name)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white">
                            {comment.author.name}
                          </p>

                          <div className="flex items-center gap-2">
                            <time className="text-xs text-slate-500">
                              {formatDate(comment.createdAt)}
                            </time>

                            {comment.updatedAt !== comment.createdAt && (
                              <span className="text-xs text-slate-600">
                                edited
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex items-center gap-3">
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment)}
                              className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
                            >
                              Edit
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              disabled={deletingId === comment.id}
                              onClick={() => {
                                void handleDelete(comment);
                              }}
                              className="text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
                            >
                              {deletingId === comment.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="mt-4">
                        <textarea
                          value={editingBody}
                          onChange={(event) =>
                            setEditingBody(event.target.value)
                          }
                          maxLength={5000}
                          rows={5}
                          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-cyan-500"
                        />

                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-xs text-slate-500">
                            {editingBody.length}
                            /5000
                          </span>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={savingEdit}
                              onClick={handleCancelEdit}
                              className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                            >
                              Cancel
                            </button>

                            <button
                              type="button"
                              disabled={
                                savingEdit || editingBody.trim().length === 0
                              }
                              onClick={() => {
                                void handleSaveEdit(comment);
                              }}
                              className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
                            >
                              {savingEdit ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                        {comment.body}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="h-fit rounded-xl border border-slate-800 bg-slate-950/50 p-4"
        >
          <label
            htmlFor="comment-body"
            className="text-sm font-semibold text-white"
          >
            Add comment
          </label>

          <textarea
            id="comment-body"
            value={body}
            maxLength={5000}
            onChange={(event) => {
              setBody(event.target.value);

              setError(null);
            }}
            rows={6}
            placeholder="Share an update, question, or note..."
            className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
          />

          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {body.length}
              /5000
            </span>

            <span>Updates live</span>
          </div>

          <button
            type="submit"
            disabled={submitting || body.trim().length === 0}
            className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CommentsPanel;
