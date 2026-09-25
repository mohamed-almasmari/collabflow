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

    if (!workspaceId || !projectId || !accessToken || !title.trim()) {
      return;
    }

    try {
      setSaving(true);

      setError(null);

      const item = await createChecklistItem(
        workspaceId,
        projectId,
        issueId,
        title.trim(),
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
    <div className="mt-3 border-t border-slate-800 pt-3">
      <button
        type="button"
        onClick={() => {
          void handleExpand();
        }}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-xs font-medium text-slate-400">Checklist</span>

        <span className="text-xs text-slate-500">
          {loaded
            ? `${completedCount}/${items.length}`
            : expanded
              ? "Loading..."
              : "View"}
        </span>
      </button>

      {loaded && items.length > 0 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      )}

      {expanded && (
        <div className="mt-3">
          {loading ? (
            <p className="text-xs text-slate-500">Loading checklist...</p>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="text-xs text-slate-600">No checklist items.</p>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 rounded-lg bg-slate-950/60 p-2"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          void handleToggle(item);
                        }}
                        className="mt-1 h-3.5 w-3.5"
                      />

                      <span
                        className={`min-w-0 flex-1 text-xs ${
                          item.completed
                            ? "text-slate-600 line-through"
                            : "text-slate-300"
                        }`}
                      >
                        {item.title}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(item.id);
                        }}
                        className="text-xs text-slate-600 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={200}
                  placeholder="Add checklist item..."
                  className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />

                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="rounded-lg bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-40"
                >
                  Add
                </button>
              </form>
            </>
          )}

          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default IssueChecklist;
