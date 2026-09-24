import { useDroppable } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Issue, IssueStatus } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

import IssueCard from "./IssueCard";

interface KanbanColumnProps {
  title: string;

  status: IssueStatus;

  issues: Issue[];

  activities: IssueActivity[];

  onEditIssue: (issue: Issue) => void;

  onDeleteIssue: (issue: Issue) => void;
}

function KanbanColumn({
  title,
  status,
  issues,
  activities,
  onEditIssue,
  onDeleteIssue,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,

    data: {
      type: "column",
      status,
    },
  });

  const columnIssues = issues
    .filter((issue) => issue.status === status)
    .sort((a, b) => a.position - b.position);

  return (
    <section
      ref={setNodeRef}
      className={`
        min-w-0 rounded-2xl border bg-slate-900/70 p-4 transition
        ${isOver ? "border-cyan-500 bg-slate-900" : "border-slate-800"}
      `}
    >
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-white">{title}</h2>

          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
            {columnIssues.length}
          </span>
        </div>
      </header>

      <SortableContext
        items={columnIssues.map((issue) => issue.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-40 space-y-3">
          {columnIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-500">Drop issue here</p>
            </div>
          ) : (
            columnIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                activities={activities.filter(
                  (activity) => activity.issueId === issue.id,
                )}
                onEdit={onEditIssue}
                onDelete={onDeleteIssue}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

export default KanbanColumn;
