import type {
  Issue,
  IssueStatus,
} from "../../api/issues";

import IssueCard from "./IssueCard";

interface KanbanColumnProps {
  title: string;
  status: IssueStatus;
  issues: Issue[];
}

function KanbanColumn({
  title,
  status,
  issues,
}: KanbanColumnProps) {
  const columnIssues = issues
    .filter((issue) => issue.status === status)
    .sort((a, b) => a.position - b.position);

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-white">
          {title}
        </h2>

        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300">
          {columnIssues.length}
        </span>
      </header>

      <div className="space-y-3">
        {columnIssues.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-500">
            No issues
          </div>
        ) : (
          columnIssues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default KanbanColumn;