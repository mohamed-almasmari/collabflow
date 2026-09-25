import { useDroppable } from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { Issue, IssueStatus } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

import IssueCard from "./IssueCard";

interface KanbanColumnProps {
  status: IssueStatus;

  title: string;

  issues: Issue[];

  activities: IssueActivity[];

  onCommentsIssue: (issue: Issue) => void;

  onEditIssue: (issue: Issue) => void;

  onDeleteIssue: (issue: Issue) => void;

  onDragActivity: (issueId: string, active: boolean) => void;
}

function KanbanColumn({
  status,
  title,
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

  return (
    <section
      ref={setNodeRef}
      className={`
        min-h-[500px] rounded-2xl border bg-slate-950/50 p-4 transition
        ${isOver ? "border-cyan-500/60 bg-cyan-500/5" : "border-slate-800"}
      `}
    >
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>

        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-400">
          {issues.length}
        </span>
      </header>

      <SortableContext items={issueIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {issues.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
              <p className="text-sm text-slate-600">No issues</p>
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
