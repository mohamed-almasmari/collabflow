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
    <section className="rounded-lg border border-slate-800 bg-slate-900/35 p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {labels.length === 0 ? (
              <span className="text-[11px] text-slate-600">No labels</span>
            ) : (
              labels.map((label) => (
                <span
                  key={label.id}
                  className="rounded-md px-2 py-1 text-[10px] font-medium"
                  style={{
                    color: label.color,

                    backgroundColor: `${label.color}18`,
                  }}
                >
                  {label.name}
                </span>
              ))
            )}
          </div>
        </div>

        {canManage && (
          <form
            onSubmit={handleSubmit}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={40}
              placeholder="New label"
              className="h-8 w-36 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 text-[11px] text-slate-300 outline-none placeholder:text-slate-700 focus:border-cyan-500/60"
            />

            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              aria-label="Label color"
              className="h-8 w-9 cursor-pointer rounded-lg border border-slate-800 bg-slate-950 p-1"
            />

            <button
              type="submit"
              disabled={!name.trim()}
              className="h-8 rounded-lg bg-violet-500 px-3 text-[10px] font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add label
            </button>
          </form>
        )}
      </div>

      {error && <p className="mt-2 text-[10px] text-rose-300">{error}</p>}
    </section>
  );
}

export default LabelManager;
