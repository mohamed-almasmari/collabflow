import { CSS } from "@dnd-kit/utilities";

import { useSortable } from "@dnd-kit/sortable";

import type { Issue } from "../../api/issues";

interface IssueCardProps {
  issue: Issue;
  onEdit: (issue: Issue) => void;
  onDelete: (issue: Issue) => void;
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
        bg-slate-800 p-4 shadow-sm
        active:cursor-grabbing
        ${isDragging ? "opacity-50" : ""}
      `}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <h3 className="font-semibold text-white">{issue.title}</h3>

        <span className="rounded-full bg-slate-700 px-2 py-1 text-xs font-medium text-slate-200">
          {issue.priority}
        </span>
      </div>

      {issue.description && (
        <p className="mb-4 text-sm leading-6 text-slate-400">
          {issue.description}
        </p>
      )}

      <div className="mb-3 text-xs text-slate-500">
        {issue.assignee ? `Assigned to ${issue.assignee.name}` : "Unassigned"}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onEdit(issue);
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
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
            className="text-xs font-medium text-red-400 hover:text-red-300"
          >
            Delete
          </button>
        </div>

        <span className="text-xs text-slate-500">#{issue.position + 1}</span>
      </div>
    </article>
  );
}

export default IssueCard;
