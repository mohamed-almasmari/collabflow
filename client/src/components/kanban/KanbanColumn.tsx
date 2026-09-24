import { useDroppable } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Issue, IssueStatus } from "../../api/issues";

import IssueCard from "./IssueCard";

interface KanbanColumnProps {
  title: string;
  status: IssueStatus;
  issues: Issue[];
  onEditIssue: (issue: Issue) => void;
  onDeleteIssue: (issue: Issue) => void;
}

function KanbanColumn({
  title,
  status,
  issues,
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
        min-w-0 rounded-2xl border bg-slate-900/70 p-4
        ${isOver ? "border-cyan-500" : "border-slate-800"}
      `}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>

        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
          {columnIssues.length}
        </span>
      </header>

      <SortableContext
        items={columnIssues.map((issue) => issue.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="min-h-24 space-y-3">
          {columnIssues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
              Drop issue here
            </div>
          ) : (
            columnIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
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
