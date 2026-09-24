import { useState, type FormEvent } from "react";

import type { CreateProjectInput } from "../../api/projects";

interface CreateProjectFormProps {
  onCreate: (input: CreateProjectInput) => Promise<void>;

  onCancel: () => void;
}

function CreateProjectForm({ onCreate, onCancel }: CreateProjectFormProps) {
  const [name, setName] = useState("");

  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError("Project name must be at least 2 characters");

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
        error instanceof Error ? error.message : "Unable to create project",
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
      <h2 className="mb-4 text-lg font-semibold text-white">Create Project</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="project-name"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Name
          </label>

          <input
            id="project-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="CollabFlow Web App"
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="project-description"
            className="mb-2 block text-sm font-medium text-slate-300"
          >
            Description
          </label>

          <textarea
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="What is this project for?"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3">
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
            disabled={submitting}
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Project"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateProjectForm;
