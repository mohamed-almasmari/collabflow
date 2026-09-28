import { useDroppable } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Issue, IssueStatus } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

import IssueCard from "./IssueCard";

type ColumnAccent = "slate" | "violet" | "emerald";

interface KanbanColumnProps {
  status: IssueStatus;

  title: string;

  accent: ColumnAccent;

  issues: Issue[];

  activities: IssueActivity[];

  onCommentsIssue: (issue: Issue) => void;

  onEditIssue: (issue: Issue) => void;

  onDeleteIssue: (issue: Issue) => void;

  onDragActivity: (issueId: string, active: boolean) => void;
}

const accentStyles = {
  slate: {
    dot: "bg-slate-400",

    count: "bg-slate-800 text-slate-400",

    border: "border-slate-800",

    over: "border-slate-600 bg-slate-900/70",
  },

  violet: {
    dot: "bg-violet-400",

    count: "bg-violet-500/10 text-violet-300",

    border: "border-violet-500/15",

    over: "border-violet-400/50 bg-violet-500/5",
  },

  emerald: {
    dot: "bg-emerald-400",

    count: "bg-emerald-500/10 text-emerald-300",

    border: "border-emerald-500/15",

    over: "border-emerald-400/50 bg-emerald-500/5",
  },
} as const;

function KanbanColumn({
  status,
  title,
  accent,
  issues,
  activities,
  onCommentsIssue,
  onEditIssue,
  onDeleteIssue,
  onDragActivity,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,

    data: {
      type: "column",

      status,
    },
  });

  const issueIds = issues.map((issue) => issue.id);

  const styles = accentStyles[accent];

  return (
    <section
      ref={setNodeRef}
      className={`min-h-[420px] min-w-0 rounded-xl border bg-slate-900/30 transition ${
        isOver ? styles.over : styles.border
      }`}
    >
      <header className="flex h-11 items-center justify-between border-b border-slate-800/80 px-3.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${styles.dot}`} />

          <h2 className="text-xs font-semibold text-slate-200">{title}</h2>
        </div>

        <span
          className={`min-w-6 rounded-md px-1.5 py-0.5 text-center text-[10px] font-semibold ${styles.count}`}
        >
          {issues.length}
        </span>
      </header>

      <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 p-2.5">
          {issues.length === 0 ? (
            <div className="flex min-h-28 items-center justify-center rounded-lg border border-dashed border-slate-800">
              <p className="text-xs text-slate-700">Drop issues here</p>
            </div>
          ) : (
            issues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                activities={activities}
                onComments={onCommentsIssue}
                onEdit={onEditIssue}
                onDelete={onDeleteIssue}
                onDragActivity={onDragActivity}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export default KanbanColumn;
