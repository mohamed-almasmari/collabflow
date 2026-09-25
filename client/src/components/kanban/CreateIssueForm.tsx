import { useState, type SyntheticEvent } from "react";

import type { CreateIssueInput, IssuePriority } from "../../api/issues";

import type { WorkspaceMember } from "../../api/workspaces";

interface CreateIssueFormProps {
  members: WorkspaceMember[];

  onCreate: (input: CreateIssueInput) => Promise<void>;

  onCancel: () => void;
}

function CreateIssueForm({
  members,
  onCreate,
  onCancel,
}: CreateIssueFormProps) {
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");

  const [assigneeId, setAssigneeId] = useState("");

  const [dueDate, setDueDate] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Issue title is required");

      return;
    }

    try {
      setSubmitting(true);

      setError(null);

      await onCreate({
        title: trimmedTitle,

        description: description.trim() || null,

        priority,

        assigneeId: assigneeId || null,

        dueDate: dueDate || null,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create issue",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            Issue
          </p>

          <h2 className="mt-1 text-xl font-semibold text-white">
            Create Issue
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <label
            htmlFor="create-issue-title"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Title
          </label>

          <input
            id="create-issue-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            placeholder="Implement authentication flow"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="lg:col-span-2">
          <label
            htmlFor="create-issue-description"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Description
          </label>

          <textarea
            id="create-issue-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={5000}
            placeholder="Describe the work..."
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="create-issue-priority"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Priority
          </label>

          <select
            id="create-issue-priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IssuePriority)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500"
          >
            <option value="LOW">Low</option>

            <option value="MEDIUM">Medium</option>

            <option value="HIGH">High</option>

            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="create-issue-assignee"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Assignee
          </label>

          <select
            id="create-issue-assignee"
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500"
          >
            <option value="">Unassigned</option>

            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="create-issue-due-date"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Due Date
          </label>

          <input
            id="create-issue-due-date"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-cyan-500"
          />

          <p className="mt-1 text-xs text-slate-500">Optional</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || title.trim().length === 0}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
        >
          {submitting ? "Creating..." : "Create Issue"}
        </button>
      </div>
    </form>
  );
}

export default CreateIssueForm;
