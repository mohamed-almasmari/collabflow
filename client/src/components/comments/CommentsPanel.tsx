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
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70">
      <header className="flex items-start justify-between gap-4 border-b border-slate-800 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Discussion
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            {issue.title}
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
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
            <p className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
              No comments yet.
            </p>
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
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                          {getInitials(comment.author.name)}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-white">
                            {comment.author.name}
                          </p>

                          <time className="text-xs text-slate-500">
                            {formatDate(comment.createdAt)}
                          </time>
                        </div>
                      </div>

                      {!isEditing && (
                        <div className="flex gap-3">
                          {isAuthor && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(comment)}
                              className="text-xs text-cyan-400"
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
                              className="text-xs text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
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
                          rows={5}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white"
                        />

                        <div className="mt-3 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              void handleSaveEdit(comment);
                            }}
                            disabled={savingEdit}
                            className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">
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
          className="relative h-fit rounded-xl border border-slate-800 bg-slate-950/50 p-4"
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
            onChange={(event) => handleBodyChange(event.target.value)}
            rows={6}
            maxLength={5000}
            placeholder="Write @ to mention a teammate..."
            className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-cyan-500"
          />

          {mentionQuery !== null && mentionCandidates.length > 0 && (
            <div className="absolute left-4 right-4 z-20 mt-1 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
              {mentionCandidates.map((member) => (
                <button
                  key={member.user.id}
                  type="button"
                  onClick={() => handleSelectMention(member)}
                  className="flex w-full items-center gap-3 border-b border-slate-800 px-4 py-3 text-left last:border-b-0 hover:bg-slate-800"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-semibold text-cyan-300">
                    {getInitials(member.user.name)}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white">
                      {member.user.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {member.user.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>
              {body.length}
              /5000
            </span>

            <span>Type @ to mention</span>
          </div>

          <button
            type="submit"
            disabled={submitting || body.trim().length === 0}
            className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-40"
          >
            {submitting ? "Posting..." : "Post Comment"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default CommentsPanel;
