import { useState, type FormEvent } from "react";

import type {
  Issue,
  IssuePriority,
  IssueStatus,
  UpdateIssueInput,
} from "../../api/issues";

interface EditIssueFormProps {
  issue: Issue;

  onSave: (issueId: string, input: UpdateIssueInput) => Promise<void>;

  onCancel: () => void;
}

function EditIssueForm({ issue, onSave, onCancel }: EditIssueFormProps) {
  const [title, setTitle] = useState(issue.title);

  const [description, setDescription] = useState(issue.description ?? "");

  const [priority, setPriority] = useState<IssuePriority>(issue.priority);

  const [status, setStatus] = useState<IssueStatus>(issue.status);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (title.trim().length < 2) {
      setError("Issue title must be at least 2 characters");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onSave(issue.id, {
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update issue",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-700 bg-slate-900 p-5"
    >
      <h2 className="mb-4 text-lg font-semibold text-white">Edit Issue</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="edit-issue-title"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Title
          </label>

          <input
            id="edit-issue-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-issue-description"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Description
          </label>

          <textarea
            id="edit-issue-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="edit-issue-priority"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Priority
          </label>

          <select
            id="edit-issue-priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IssuePriority)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="edit-issue-status"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Status
          </label>

          <select
            id="edit-issue-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as IssueStatus)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default EditIssueForm;
