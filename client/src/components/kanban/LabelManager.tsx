import { useState, type SyntheticEvent } from "react";

import { createLabel, type Label } from "../../api/labels";

interface LabelManagerProps {
  workspaceId: string;

  projectId: string;

  accessToken: string;

  labels: Label[];

  canManage: boolean;

  onCreated: (label: Label) => void;
}

function LabelManager({
  workspaceId,
  projectId,
  accessToken,
  labels,
  canManage,
  onCreated,
}: LabelManagerProps) {
  const [name, setName] = useState("");

  const [color, setColor] = useState("#22d3ee");

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      setError(null);

      const label = await createLabel(
        workspaceId,
        projectId,
        {
          name: name.trim(),

          color,
        },
        accessToken,
      );

      onCreated(label);

      setName("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create label",
      );
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
          Labels
        </p>

        <h2 className="mt-1 text-lg font-semibold text-white">
          Project Labels
        </h2>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {labels.length === 0 ? (
          <p className="text-sm text-slate-500">No labels yet.</p>
        ) : (
          labels.map((label) => (
            <span
              key={label.id}
              className="rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: label.color,

                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))
        )}
      </div>

      {canManage && (
        <form
          onSubmit={handleSubmit}
          className="mt-5 flex flex-wrap items-end gap-3 border-t border-slate-800 pt-5"
        >
          <div className="min-w-[220px] flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Label name
            </label>

            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="Frontend"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Color
            </label>

            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-slate-700 bg-slate-950"
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-40"
          >
            Create Label
          </button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
    </section>
  );
}

export default LabelManager;
