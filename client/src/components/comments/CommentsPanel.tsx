import { useEffect, useState, type FormEvent } from "react";

import {
  createComment,
  deleteComment,
  getComments,
  type IssueComment,
} from "../../api/comments";

import type { Issue } from "../../api/issues";

interface CommentsPanelProps {
  workspaceId: string;
  projectId: string;
  issue: Issue;
  accessToken: string;
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

function CommentsPanel({
  workspaceId,
  projectId,
  issue,
  accessToken,
  onClose,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<IssueComment[]>([]);

  const [body, setBody] = useState("");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

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
          setComments(data);
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

      setComments((currentComments) => [...currentComments, comment]);

      setBody("");
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

          <p className="mt-1 text-sm text-slate-500">
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
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

              <p className="mt-1 text-xs text-slate-500">
                Start the discussion about this issue.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
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

                        <time className="text-xs text-slate-500">
                          {formatDate(comment.createdAt)}
                        </time>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={deletingId === comment.id}
                      onClick={() => {
                        void handleDelete(comment);
                      }}
                      className="text-xs font-medium text-red-400 transition hover:text-red-300 disabled:opacity-50"
                    >
                      {deletingId === comment.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-slate-300">
                    {comment.body}
                  </p>
                </article>
              ))}
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
