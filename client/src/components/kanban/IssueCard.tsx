import { CSS } from "@dnd-kit/utilities";

import { useSortable } from "@dnd-kit/sortable";

import type { Issue } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

import IssueChecklist from "./IssueChecklist";

interface IssueCardProps {
  issue: Issue;

  activities: IssueActivity[];

  onComments: (issue: Issue) => void;

  onEdit: (issue: Issue) => void;

  onDelete: (issue: Issue) => void;

  onDragActivity: (issueId: string, active: boolean) => void;
}

function getPriorityStyles(priority: Issue["priority"]) {
  switch (priority) {
    case "URGENT":
      return {
        dot: "bg-rose-400",

        text: "text-rose-300",

        background: "bg-rose-500/10",
      };

    case "HIGH":
      return {
        dot: "bg-orange-400",

        text: "text-orange-300",

        background: "bg-orange-500/10",
      };

    case "MEDIUM":
      return {
        dot: "bg-amber-400",

        text: "text-amber-300",

        background: "bg-amber-500/10",
      };

    case "LOW":
    default:
      return {
        dot: "bg-blue-400",

        text: "text-blue-300",

        background: "bg-blue-500/10",
      };
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

  const differenceDays = Math.round(
    (dueDateValue.getTime() - todayDate.getTime()) / 86_400_000,
  );

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
      label: formatted,

      className: "text-slate-600",
    };
  }

  if (differenceDays < 0) {
    return {
      label: `Overdue ${formatted}`,

      className: "text-rose-400",
    };
  }

  if (differenceDays === 0) {
    return {
      label: "Due today",

      className: "text-amber-400",
    };
  }

  if (differenceDays <= 3) {
    return {
      label: `Due in ${differenceDays} ${
        differenceDays === 1 ? "day" : "days"
      }`,

      className: "text-amber-300",
    };
  }

  return {
    label: formatted,

    className: "text-slate-500",
  };
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-cyan-500",
    "bg-violet-500",
    "bg-blue-500",
    "bg-emerald-500",
    "bg-rose-500",
    "bg-amber-500",
  ];

  const index =
    Array.from(name).reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    ) % colors.length;

  return colors[index];
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

  const priorityStyles = getPriorityStyles(issue.priority);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`group rounded-lg border border-slate-800 bg-slate-900/90 p-3 transition ${
        isDragging
          ? "scale-[0.98] opacity-40"
          : "hover:border-slate-700 hover:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          onPointerUp={() => {
            onDragActivity(issue.id, false);
          }}
          className="mt-0.5 cursor-grab rounded px-1 py-0.5 text-[12px] leading-none text-slate-700 transition hover:bg-slate-800 hover:text-slate-400 active:cursor-grabbing"
          aria-label={`Drag ${issue.title}`}
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-medium leading-5 text-slate-100">
            {issue.title}
          </h3>

          {issue.description && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-600">
              {issue.description}
            </p>
          )}
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[9px] font-semibold uppercase tracking-wide ${priorityStyles.background} ${priorityStyles.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priorityStyles.dot}`} />

          {issue.priority}
        </span>
      </div>

      {issue.issueLabels.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1">
          {issue.issueLabels.map(({ label }) => (
            <span
              key={label.id}
              className="rounded-md px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                color: label.color,

                backgroundColor: `${label.color}18`,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {(editingUsers.length > 0 || draggingUsers.length > 0) && (
        <div className="mt-2 space-y-1">
          {editingUsers.map((activity) => (
            <div
              key={`editing-${activity.user.id}`}
              className="flex items-center gap-1.5 text-[10px] text-cyan-400"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              {activity.user.name} is editing
            </div>
          ))}

          {draggingUsers.map((activity) => (
            <div
              key={`dragging-${activity.user.id}`}
              className="flex items-center gap-1.5 text-[10px] text-violet-400"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
              {activity.user.name} is moving
            </div>
          ))}
        </div>
      )}

      <div className="mt-2">
        <IssueChecklist issueId={issue.id} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {issue.assignee ? (
            <>
              <div
                title={issue.assignee.name}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white ${getAvatarColor(
                  issue.assignee.name,
                )}`}
              >
                {getInitials(issue.assignee.name)}
              </div>

              <span className="max-w-20 truncate text-[10px] text-slate-500">
                {issue.assignee.name}
              </span>
            </>
          ) : (
            <span className="text-[10px] text-slate-700">Unassigned</span>
          )}

          {dueDateInfo && (
            <>
              <span className="text-slate-800">•</span>

              <span className={`truncate text-[10px] ${dueDateInfo.className}`}>
                {dueDateInfo.label}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-0.5 opacity-50 transition group-hover:opacity-100">
          <button
            type="button"
            title="Comments"
            onClick={() => onComments(issue)}
            className="rounded-md px-1.5 py-1 text-[10px] text-slate-500 transition hover:bg-cyan-500/10 hover:text-cyan-300"
          >
            Chat
          </button>

          <button
            type="button"
            title="Edit issue"
            onClick={() => onEdit(issue)}
            className="rounded-md px-1.5 py-1 text-[10px] text-slate-500 transition hover:bg-violet-500/10 hover:text-violet-300"
          >
            Edit
          </button>

          <button
            type="button"
            title="Delete issue"
            onClick={() => onDelete(issue)}
            className="rounded-md px-1.5 py-1 text-[10px] text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-300"
          >
            ×
          </button>
        </div>
      </div>
    </article>
  );
}

export default IssueCard;
