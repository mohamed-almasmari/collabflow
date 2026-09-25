import { useState, type SyntheticEvent } from "react";

import type { CreateWorkspaceInput } from "../../api/workspaces";

interface CreateWorkspaceFormProps {
  onCreate: (input: CreateWorkspaceInput) => Promise<void>;

  onCancel: () => void;
}

function CreateWorkspaceForm({ onCreate, onCancel }: CreateWorkspaceFormProps) {
  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError("Workspace name must be at least 2 characters");

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onCreate({
        name: name.trim(),

        description: description.trim() || undefined,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create workspace",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20"
    >
      <div className="border-b border-slate-800 bg-slate-900/90 px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              New workspace
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              Create a workspace
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Organize a team, product area, or shared body of work.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div>
          <label
            htmlFor="workspace-name"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Workspace name
          </label>

          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Engineering Team"
            className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="workspace-description"
              className="text-sm font-medium text-slate-300"
            >
              Description
            </label>

            <span className="text-xs text-slate-600">Optional</span>
          </div>

          <textarea
            id="workspace-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="What is this workspace for?"
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-950" />
            )}

            {submitting ? "Creating..." : "Create workspace"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateWorkspaceForm;
