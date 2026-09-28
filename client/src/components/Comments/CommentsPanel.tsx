import { useEffect, useMemo, useState, type FormEvent } from "react";

import {
  createComment,
  deleteComment,
  getComments,
  updateComment,
  type IssueComment,
} from "../../api/comments";

import type { Issue } from "../../api/issues";

import { getWorkspaceById, type WorkspaceMember } from "../../api/workspaces";

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

  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const [body, setBody] = useState("");

  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  const [editingBody, setEditingBody] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) {
      return [];
    }

    const normalizedQuery = mentionQuery.trim().toLowerCase();

    return members
      .filter((member) => member.user.id !== currentUserId)
      .filter(
        (member) =>
          member.user.name.toLowerCase().includes(normalizedQuery) ||
          member.user.email.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 5);
  }, [members, mentionQuery, currentUserId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDiscussion() {
      try {
        setLoading(true);

        setError(null);

        const [commentData, workspaceData] = await Promise.all([
          getComments(workspaceId, projectId, issue.id, accessToken),

          getWorkspaceById(workspaceId, accessToken),
        ]);

        if (cancelled) {
          return;
        }

        setComments(sortComments(commentData));

        setMembers(workspaceData.members);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load discussion",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDiscussion();

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

  function handleBodyChange(value: string) {
    setBody(value);

    setError(null);

    const match = value.match(/(?:^|\s)@([^\s@]*)$/);

    if (!match) {
      setMentionQuery(null);

      return;
    }

    setMentionQuery(match[1] ?? "");
  }

  function handleSelectMention(member: WorkspaceMember) {
    const match = body.match(/(?:^|\s)@([^\s@]*)$/);

    if (!match || match.index === undefined) {
      return;
    }

    const matchedText = match[0];

    const leadingWhitespace = matchedText.startsWith(" ") ? " " : "";

    const prefix = body.slice(0, match.index);

    const updatedBody = `${prefix}${leadingWhitespace}@${member.user.name} `;

    setBody(updatedBody);

    setMentionedUserIds((currentIds) =>
      currentIds.includes(member.user.id)
        ? currentIds
        : [...currentIds, member.user.id],
    );

    setMentionQuery(null);
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

      const validMentionIds = mentionedUserIds.filter((userId) => {
        const member = members.find(
          (workspaceMember) => workspaceMember.user.id === userId,
        );

        if (!member) {
          return false;
        }

        return body.includes(`@${member.user.name}`);
      });

      const comment = await createComment(
        workspaceId,
        projectId,
        issue.id,
        trimmedBody,
        validMentionIds,
        accessToken,
      );

      setComments((currentComments) =>
        sortComments([...currentComments, comment]),
      );

      setBody("");

      setMentionedUserIds([]);

      setMentionQuery(null);

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
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/45">
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
            Discussion
          </p>

          <h2 className="mt-0.5 truncate text-sm font-semibold text-slate-100">
            {issue.title}
          </h2>

          <p className="mt-1 text-[10px] text-slate-600">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1.5 text-[10px] font-medium text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
        >
          Close
        </button>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div>
          {error && (
            <div className="mb-3 rounded-lg border border-rose-900/50 bg-rose-950/25 px-3 py-2 text-[11px] text-rose-300">
              {error}
            </div>
          )}

          {loading ? (
            <p className="py-6 text-center text-[11px] text-slate-600">
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-800 py-8 text-center">
              <p className="text-[11px] text-slate-600">No comments yet</p>
            </div>
          ) : (
            <div className="space-y-2">
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
                    className="rounded-lg border border-slate-800 bg-slate-950/35 p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-500/10 text-[9px] font-semibold text-cyan-300">
                          {getInitials(comment.author.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-medium text-slate-300">
                            {comment.author.name}
                          </p>

                          <time className="text-[9px] text-slate-700">
                            {formatDate(comment.createdAt)}
                          </time>
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex shrink-0 gap-2">
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment)}
                              className="text-[9px] font-medium text-cyan-500 transition hover:text-cyan-300"
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
                              className="text-[9px] font-medium text-rose-500 transition hover:text-rose-300 disabled:opacity-50"
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
                      <div className="mt-3">
                        <textarea
                          value={editingBody}
                          onChange={(event) =>
                            setEditingBody(event.target.value)
                          }
                          rows={4}
                          className="w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500/60"
                        />

                        <div className="mt-2 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded-md border border-slate-800 px-2.5 py-1.5 text-[9px] text-slate-500 hover:text-slate-300"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleSaveEdit(comment);
                            }}
                            disabled={savingEdit}
                            className="rounded-md bg-cyan-400 px-2.5 py-1.5 text-[9px] font-semibold text-slate-950 disabled:opacity-50"
                          >
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-slate-400">
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
          className="relative h-fit rounded-lg border border-slate-800 bg-slate-950/35 p-3"
        >
          <label
            htmlFor="comment-body"
            className="text-[10px] font-medium text-slate-400"
          >
            Add comment
          </label>

          <textarea
            id="comment-body"
            value={body}
            onChange={(event) => handleBodyChange(event.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Write @ to mention a teammate..."
            className="mt-2 w-full resize-y rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-700 focus:border-cyan-500/60"
          />

          {mentionQuery !== null && mentionCandidates.length > 0 && (
            <div className="absolute left-3 right-3 z-20 mt-1 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
              {mentionCandidates.map((member) => (
                <button
                  key={member.user.id}
                  type="button"
                  onClick={() => handleSelectMention(member)}
                  className="flex w-full items-center gap-2 border-b border-slate-800 px-3 py-2 text-left transition last:border-b-0 hover:bg-slate-800"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10 text-[8px] font-semibold text-violet-300">
                    {getInitials(member.user.name)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-slate-300">
                      {member.user.name}
                    </p>

                    <p className="truncate text-[8px] text-slate-600">
                      {member.user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-1.5 flex justify-between text-[8px] text-slate-700">
            <span>
              {body.length}
              /5000
            </span>

            <span>Type @ to mention</span>
          </div>

          <button
            type="submit"
            disabled={submitting || body.trim().length === 0}
            className="mt-3 w-full rounded-md bg-cyan-400 px-3 py-2 text-[10px] font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Posting..." : "Post comment"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CommentsPanel;
