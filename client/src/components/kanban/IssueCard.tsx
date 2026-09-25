import { CSS } from "@dnd-kit/utilities";

import { useSortable } from "@dnd-kit/sortable";

import type { Issue } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

interface IssueCardProps {
  issue: Issue;

  activities: IssueActivity[];

  onComments: (issue: Issue) => void;

  onEdit: (issue: Issue) => void;

  onDelete: (issue: Issue) => void;

  onDragActivity: (
    issueId: string,

    active: boolean,
  ) => void;
}

function getPriorityClasses(priority: Issue["priority"]) {
  switch (priority) {
    case "URGENT":
      return "border-red-500/30 bg-red-500/10 text-red-300";

    case "HIGH":
      return "border-amber-500/30 bg-amber-500/10 text-amber-300";

    case "MEDIUM":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

    case "LOW":
    default:
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDueDateInfo(issue: Issue) {
  if (!issue.dueDate) {
    return null;
  }

  const dueDate = issue.dueDate.slice(0, 10);

  const today = getLocalDateKey(new Date());

  const todayDate = new Date(`${today}T00:00:00`);

  const dueDateValue = new Date(`${dueDate}T00:00:00`);

  const differenceMs = dueDateValue.getTime() - todayDate.getTime();

  const differenceDays = Math.round(differenceMs / 86_400_000);

  const formatted = new Intl.DateTimeFormat(undefined, {
    month: "short",

    day: "numeric",

    year:
      dueDateValue.getFullYear() !== todayDate.getFullYear()
        ? "numeric"
        : undefined,
  }).format(dueDateValue);

  if (issue.status === "DONE") {
    return {
      label: `Due ${formatted}`,

      className: "border-slate-700 bg-slate-800 text-slate-400",
    };
  }

  if (differenceDays < 0) {
    return {
      label: `Overdue · ${formatted}`,

      className: "border-red-500/30 bg-red-500/10 text-red-300",
    };
  }

  if (differenceDays === 0) {
    return {
      label: "Due today",

      className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    };
  }

  if (differenceDays <= 3) {
    return {
      label: `Due in ${differenceDays} ${
        differenceDays === 1 ? "day" : "days"
      }`,

      className: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    };
  }

  return {
    label: `Due ${formatted}`,

    className: "border-slate-700 bg-slate-800 text-slate-300",
  };
}

function IssueCard({
  issue,
  activities,
  onComments,
  onEdit,
  onDelete,
  onDragActivity,
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
      type: "issue",

      issue,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),

    transition,
  };

  const issueActivities = activities.filter(
    (activity) => activity.issueId === issue.id,
  );

  const editingUsers = issueActivities.filter(
    (activity) => activity.activity === "EDITING",
  );

  const draggingUsers = issueActivities.filter(
    (activity) => activity.activity === "DRAGGING",
  );

  const dueDateInfo = getDueDateInfo(issue);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`
        rounded-xl border border-slate-800 bg-slate-900 p-4 shadow-sm transition
        ${isDragging ? "opacity-50" : "hover:border-slate-700"}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onPointerDown={(event) => {
            listeners?.onPointerDown?.(event);

            onDragActivity(issue.id, true);
          }}
          onPointerUp={() => {
            onDragActivity(issue.id, false);
          }}
          className="cursor-grab rounded-md px-1 text-slate-600 hover:bg-slate-800 hover:text-slate-300 active:cursor-grabbing"
          aria-label={`Drag ${issue.title}`}
        >
          ⋮⋮
        </button>

        <span
          className={`
            rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide
            ${getPriorityClasses(issue.priority)}
          `}
        >
          {issue.priority}
        </span>
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-6 text-white">
        {issue.title}
      </h3>

      {issue.description && (
        <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-500">
          {issue.description}
        </p>
      )}

      {issue.issueLabels.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {issue.issueLabels.map(({ label }) => (
            <span
              key={label.id}
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
              style={{
                borderColor: label.color,

                color: label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {dueDateInfo && (
        <div className="mt-3">
          <span
            className={`
              inline-flex rounded-full border px-2.5 py-1 text-xs font-medium
              ${dueDateInfo.className}
            `}
          >
            {dueDateInfo.label}
          </span>
        </div>
      )}

      {(editingUsers.length > 0 || draggingUsers.length > 0) && (
        <div className="mt-3 space-y-1">
          {editingUsers.map((activity) => (
            <p
              key={`editing-${activity.user.id}`}
              className="text-xs text-cyan-400"
            >
              {activity.user.name} is editing
            </p>
          ))}

          {draggingUsers.map((activity) => (
            <p
              key={`dragging-${activity.user.id}`}
              className="text-xs text-violet-400"
            >
              {activity.user.name} is moving
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <div className="min-w-0">
          {issue.assignee ? (
            <>
              <p className="truncate text-xs font-medium text-slate-300">
                {issue.assignee.name}
              </p>

              <p className="truncate text-[10px] text-slate-600">Assignee</p>
            </>
          ) : (
            <p className="text-xs text-slate-600">Unassigned</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onComments(issue)}
            className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-cyan-300"
          >
            Comments
          </button>

          <button
            type="button"
            onClick={() => onEdit(issue)}
            className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(issue)}
            className="rounded-md px-2 py-1 text-xs text-slate-500 transition hover:bg-red-950/40 hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

export default IssueCard;
