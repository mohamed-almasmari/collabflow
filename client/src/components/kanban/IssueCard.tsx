import { CSS } from "@dnd-kit/utilities";

import { useSortable } from "@dnd-kit/sortable";

import type { Issue, IssuePriority } from "../../api/issues";

interface IssueCardProps {
  issue: Issue;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
}

const priorityStyles: Record<IssuePriority, string> = {
  LOW: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",

  MEDIUM: "bg-blue-500/10 text-blue-300 border-blue-500/30",

  HIGH: "bg-amber-500/10 text-amber-300 border-amber-500/30",

  URGENT: "bg-red-500/10 text-red-300 border-red-500/30",
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function IssueCard({ issue, onEdit, onDelete }: IssueCardProps) {
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
        cursor-grab rounded-xl border border-slate-700
        bg-slate-800 p-4 shadow-sm transition
        hover:border-slate-600 hover:bg-slate-800/90
        active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-6 text-white">{issue.title}</h3>

        <span
          className={`
            shrink-0 rounded-full border px-2.5 py-1
            text-[11px] font-semibold
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
        <div className="flex items-center gap-3">
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
