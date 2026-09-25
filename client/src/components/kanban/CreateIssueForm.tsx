import { useState, type SyntheticEvent } from "react";

import type { CreateIssueInput, IssuePriority } from "../../api/issues";

import type { Label } from "../../api/labels";

import type { WorkspaceMember } from "../../api/workspaces";

interface CreateIssueFormProps {
  members: WorkspaceMember[];
  labels: Label[];
  onCreate: (input: CreateIssueInput) => Promise<void>;
  onCancel: () => void;
}

const controlClasses =
  "w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-cyan-500/60";

function CreateIssueForm({
  members,
  labels,
  onCreate,
  onCancel,
}: CreateIssueFormProps) {
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [priority, setPriority] = useState<IssuePriority>("MEDIUM");

  const [assigneeId, setAssigneeId] = useState("");

  const [dueDate, setDueDate] = useState("");

  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  function toggleLabel(labelId: string) {
    setSelectedLabelIds((current) =>
      current.includes(labelId)
        ? current.filter((id) => id !== labelId)
        : [...current, labelId],
    );
  }

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

        labelIds: selectedLabelIds,
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
      className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/45"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-cyan-400">
            New issue
          </p>

          <h2 className="mt-0.5 text-sm font-semibold text-slate-100">
            Create issue
          </h2>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-2 py-1.5 text-[10px] font-medium text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
        >
          Close
        </button>
      </div>

      <div className="p-4">
        {error && (
          <div className="mb-3 rounded-lg border border-rose-900/50 bg-rose-950/25 px-3 py-2 text-[11px] text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label
              htmlFor="create-issue-title"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Title
            </label>

            <input
              id="create-issue-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              placeholder="Implement authentication flow"
              className={controlClasses}
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="create-issue-description"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Description
            </label>

            <textarea
              id="create-issue-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="Describe the work..."
              className={`${controlClasses} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor="create-issue-priority"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Priority
            </label>

            <select
              id="create-issue-priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as IssuePriority)
              }
              className={controlClasses}
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
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Assignee
            </label>

            <select
              id="create-issue-assignee"
              value={assigneeId}
              onChange={(event) => setAssigneeId(event.target.value)}
              className={controlClasses}
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
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Due date
            </label>

            <input
              id="create-issue-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={controlClasses}
            />
          </div>

          <div className="lg:col-span-2">
            <p className="mb-2 text-[10px] font-medium text-slate-500">
              Labels
            </p>

            {labels.length === 0 ? (
              <p className="text-[10px] text-slate-700">
                No project labels yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {labels.map((label) => {
                  const selected = selectedLabelIds.includes(label.id);

                  return (
                    <label
                      key={label.id}
                      className="cursor-pointer rounded-md px-2 py-1 text-[10px] font-medium transition"
                      style={{
                        color: label.color,

                        backgroundColor: selected
                          ? `${label.color}20`
                          : `${label.color}0d`,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleLabel(label.id)}
                        className="sr-only"
                      />

                      {label.name}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-md border border-slate-800 px-3 py-2 text-[10px] font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || title.trim().length === 0}
          className="rounded-md bg-cyan-400 px-3 py-2 text-[10px] font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Creating..." : "Create issue"}
        </button>
      </div>
    </form>
  );
}

export default CreateIssueForm;
