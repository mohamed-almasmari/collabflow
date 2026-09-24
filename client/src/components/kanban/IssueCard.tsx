import { CSS } from "@dnd-kit/utilities";

import { useSortable } from "@dnd-kit/sortable";

import type { Issue, IssuePriority } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

interface IssueCardProps {
  issue: Issue;

  activities: IssueActivity[];

  onEdit: (issue: Issue) => void;

  onDelete: (issue: Issue) => void;

  onComments: (issue: Issue) => void;
}

const priorityStyles: Record<IssuePriority, string> = {
  LOW: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",

  MEDIUM: "border-blue-500/30 bg-blue-500/10 text-blue-300",

  HIGH: "border-amber-500/30 bg-amber-500/10 text-amber-300",

  URGENT: "border-red-500/30 bg-red-500/10 text-red-300",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function IssueCard({
  issue,
  activities,
  onEdit,
  onDelete,
  onComments,
}: IssueCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,

    data: {
      issue,
      type: "issue",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),

    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        cursor-grab rounded-xl border bg-slate-800 p-4 shadow-sm transition
        active:cursor-grabbing
        ${activities.length > 0 ? "border-cyan-500/60" : "border-slate-700"}
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      {activities.length > 0 && (
        <div className="mb-3 space-y-1">
          {activities.map((activity) => (
            <div
              key={`${activity.user.id}-${activity.activity}`}
              className="flex items-center gap-2 rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-xs text-cyan-300"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />

              <span>
                <span className="font-semibold">{activity.user.name}</span> is{" "}
                {activity.activity === "EDITING" ? "editing" : "dragging"}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-6 text-white">{issue.title}</h3>

        <span
          className={`
            shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold
            ${priorityStyles[issue.priority]}
          `}
        >
          {issue.priority}
        </span>
      </div>

      {issue.description && (
        <p className="mb-4 line-clamp-3 text-sm leading-6 text-slate-400">
          {issue.description}
        </p>
      )}

      <div className="mb-4 flex items-center justify-between">
        {issue.assignee ? (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-300">
              {getInitials(issue.assignee.name)}
            </div>

            <span className="text-xs text-slate-400">
              {issue.assignee.name}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Unassigned</span>
        )}

        <span className="text-xs text-slate-500">#{issue.position + 1}</span>
      </div>

      <div className="border-t border-slate-700 pt-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onComments(issue);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="text-xs font-medium text-violet-400 transition hover:text-violet-300"
          >
            Comments
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onEdit(issue);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="text-xs font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();

              onDelete(issue);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="text-xs font-medium text-red-400 transition hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default IssueCard;
