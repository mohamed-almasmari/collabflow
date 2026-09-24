import { useState, type FormEvent } from "react";

import type { CreateIssueInput, IssuePriority } from "../../api/issues";

interface CreateIssueFormProps {
  onCreate: (input: CreateIssueInput) => Promise<void>;

  onCancel: () => void;
}

function CreateIssueForm({ onCreate, onCancel }: CreateIssueFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");

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

      await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });

      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create issue",
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
      <h2 className="mb-4 text-lg font-semibold text-white">Create Issue</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="issue-title"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Title
          </label>

          <input
            id="issue-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Issue title"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="issue-description"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Description
          </label>

          <textarea
            id="issue-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the issue"
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="issue-priority"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Priority
          </label>

          <select
            id="issue-priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as IssuePriority)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none focus:border-cyan-500"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Issue"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateIssueForm;
