import { useState, type SyntheticEvent } from "react";

import { useParams } from "react-router";

import {
  createChecklistItem,
  deleteChecklistItem,
  getChecklistItems,
  updateChecklistItem,
  type ChecklistItem,
} from "../../api/checklist";

import { useAuth } from "../../hooks/useAuth";

interface IssueChecklistProps {
  issueId: string;
}

function IssueChecklist({ issueId }: IssueChecklistProps) {
  const { workspaceId, projectId } = useParams();

  const { accessToken } = useAuth();

  const [expanded, setExpanded] = useState(false);

  const [loaded, setLoaded] = useState(false);

  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<ChecklistItem[]>([]);

  const [title, setTitle] = useState("");

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const completedCount = items.filter((item) => item.completed).length;

  const progress =
    items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  const checklistRegionId = `checklist-${issueId}`;

  async function loadItems() {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await getChecklistItems(
        workspaceId,
        projectId,
        issueId,
        accessToken,
      );

      setItems(data);
      setLoaded(true);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load checklist",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleExpand() {
    const nextExpanded = !expanded;

    setExpanded(nextExpanded);

    if (nextExpanded && !loaded) {
      await loadItems();
    }
  }

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();

    if (!workspaceId || !projectId || !accessToken || !trimmedTitle) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const item = await createChecklistItem(
        workspaceId,
        projectId,
        issueId,
        trimmedTitle,
        accessToken,
      );

      setItems((current) => [...current, item]);

      setTitle("");
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create checklist item",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(item: ChecklistItem) {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    const previousItems = items;

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? {
              ...currentItem,
              completed: !currentItem.completed,
            }
          : currentItem,
      ),
    );

    try {
      const updated = await updateChecklistItem(
        workspaceId,
        projectId,
        issueId,
        item.id,
        {
          completed: !item.completed,
        },
        accessToken,
      );

      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === updated.id ? updated : currentItem,
        ),
      );
    } catch (updateError) {
      setItems(previousItems);

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update checklist item",
      );
    }
  }

  async function handleDelete(itemId: string) {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    try {
      setError(null);

      await deleteChecklistItem(
        workspaceId,
        projectId,
        issueId,
        itemId,
        accessToken,
      );

      setItems((current) => current.filter((item) => item.id !== itemId));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete checklist item",
      );
    }
  }

  return (
    <div className="border-t border-slate-800/70 pt-2.5">
      <button
        type="button"
        onClick={() => {
          void handleExpand();
        }}
        aria-expanded={expanded}
        aria-controls={checklistRegionId}
        className="group/checklist flex w-full items-center justify-between gap-3 rounded-md px-1 py-1 text-left outline-none transition hover:bg-slate-800/40 focus-visible:ring-2 focus-visible:ring-cyan-500/60"
      >
        <span className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-3.5 w-3.5 text-slate-600 transition group-hover/checklist:text-slate-400"
            aria-hidden="true"
          >
            <path d="M9 6h11M9 12h11M9 18h11" />

            <path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />
          </svg>

          <span className="text-[10px] font-medium text-slate-500">
            Checklist
          </span>
        </span>

        <span className="flex items-center gap-1.5">
          <span className="text-[9px] text-slate-600">
            {loaded
              ? `${completedCount}/${items.length}`
              : expanded
                ? "Loading..."
                : "Open"}
          </span>

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-3 w-3 text-slate-700 transition-transform ${
              expanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {loaded && items.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <span className="text-[8px] font-medium text-slate-600">
            {progress}%
          </span>
        </div>
      )}

      {expanded && (
        <div id={checklistRegionId} className="mt-2.5">
          {loading ? (
            <p className="py-2 text-[10px] text-slate-600">
              Loading checklist...
            </p>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="py-1 text-[10px] text-slate-700">
                  No checklist items yet.
                </p>
              ) : (
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="group/item flex items-start gap-2 rounded-md px-1.5 py-1.5 transition hover:bg-slate-950/50"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          void handleToggle(item);
                        }}
                        aria-label={`Mark ${item.title} as ${
                          item.completed ? "incomplete" : "complete"
                        }`}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-slate-700 bg-slate-950 accent-emerald-400 focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                      />

                      <span
                        className={`min-w-0 flex-1 break-words text-[10px] leading-4 ${
                          item.completed
                            ? "text-slate-700 line-through"
                            : "text-slate-400"
                        }`}
                      >
                        {item.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(item.id);
                        }}
                        aria-label={`Delete checklist item ${item.title}`}
                        className="shrink-0 rounded px-1 text-[9px] text-slate-700 opacity-0 outline-none transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-rose-500/50 group-hover/item:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-2 flex gap-1.5">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  aria-label="New checklist item"
                  placeholder="Add item..."
                  className="min-w-0 flex-1 rounded-md border border-slate-800 bg-slate-950/70 px-2 py-1.5 text-[10px] text-slate-300 outline-none placeholder:text-slate-700 focus:border-cyan-500/60 focus-visible:ring-2 focus-visible:ring-cyan-500/20"
                />

                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="rounded-md bg-cyan-400 px-2.5 py-1.5 text-[9px] font-semibold text-slate-950 outline-none transition hover:bg-cyan-300 focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "..." : "Add"}
                </button>
              </form>
            </>
          )}

          {error && (
            <p role="alert" className="mt-2 text-[9px] text-rose-300">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default IssueChecklist;
