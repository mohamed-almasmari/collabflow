import { useState, type SyntheticEvent } from "react";

import type { Issue, IssuePriority, UpdateIssueInput } from "../../api/issues";

import type { Label } from "../../api/labels";

import type { WorkspaceMember } from "../../api/workspaces";

interface EditIssueFormProps {
  issue: Issue;
  members: WorkspaceMember[];
  labels: Label[];

  onSave: (issueId: string, input: UpdateIssueInput) => Promise<void>;

  onCancel: () => void;
}

const controlClasses =
  "w-full rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-cyan-500/60";

function getDateInputValue(value: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

function EditIssueForm({
  issue,
  members,
  labels,
  onSave,
  onCancel,
}: EditIssueFormProps) {
  const [title, setTitle] = useState(issue.title);

  const [description, setDescription] = useState(issue.description ?? "");

  const [priority, setPriority] = useState<IssuePriority>(issue.priority);

  const [assigneeId, setAssigneeId] = useState(issue.assigneeId ?? "");

  const [dueDate, setDueDate] = useState(getDateInputValue(issue.dueDate));

  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(
    issue.issueLabels.map(({ label }) => label.id),
  );

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

      await onSave(issue.id, {
        title: trimmedTitle,

        description: description.trim() || null,

        priority,

        assigneeId: assigneeId || null,

        dueDate: dueDate || null,

        labelIds: selectedLabelIds,
      });
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update issue",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-xl border border-violet-500/20 bg-slate-900/45"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-violet-400">
            Edit issue
          </p>

          <h2 className="mt-0.5 max-w-xl truncate text-sm font-semibold text-slate-100">
            {issue.title}
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
              htmlFor="edit-issue-title"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Title
            </label>

            <input
              id="edit-issue-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={200}
              className={controlClasses}
            />
          </div>

          <div className="lg:col-span-2">
            <label
              htmlFor="edit-issue-description"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Description
            </label>

            <textarea
              id="edit-issue-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={5000}
              className={`${controlClasses} resize-y`}
            />
          </div>

          <div>
            <label
              htmlFor="edit-issue-priority"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Priority
            </label>

            <select
              id="edit-issue-priority"
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
              htmlFor="edit-issue-assignee"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Assignee
            </label>

            <select
              id="edit-issue-assignee"
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
              htmlFor="edit-issue-due-date"
              className="mb-1.5 block text-[10px] font-medium text-slate-500"
            >
              Due date
            </label>

            <div className="flex gap-2">
              <input
                id="edit-issue-due-date"
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className={controlClasses}
              />

              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate("")}
                  className="shrink-0 rounded-lg border border-slate-800 px-2.5 text-[10px] text-slate-500 transition hover:border-rose-900/50 hover:text-rose-300"
                >
                  Clear
                </button>
              )}
            </div>
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
          className="rounded-md bg-violet-500 px-3 py-2 text-[10px] font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

export default EditIssueForm;
