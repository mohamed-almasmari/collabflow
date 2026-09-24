import { useMemo } from "react";

import type { Issue } from "../../api/issues";

interface BoardStatsProps {
  issues: Issue[];
}

function BoardStats({ issues }: BoardStatsProps) {
  const stats = useMemo(() => {
    const total = issues.length;

    const todo = issues.filter((issue) => issue.status === "TODO").length;

    const inProgress = issues.filter(
      (issue) => issue.status === "IN_PROGRESS",
    ).length;

    const done = issues.filter((issue) => issue.status === "DONE").length;

    const highPriority = issues.filter(
      (issue) => issue.priority === "HIGH" || issue.priority === "URGENT",
    ).length;

    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

    return {
      total,
      todo,
      inProgress,
      done,
      highPriority,
      completionRate,
    };
  }, [issues]);

  return (
    <section className="mb-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Issues
          </p>

          <p className="mt-3 text-3xl font-bold text-white">{stats.total}</p>

          <p className="mt-2 text-xs text-slate-600">Project workload</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            To Do
          </p>

          <p className="mt-3 text-3xl font-bold text-slate-200">{stats.todo}</p>

          <p className="mt-2 text-xs text-slate-600">Waiting to start</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            In Progress
          </p>

          <p className="mt-3 text-3xl font-bold text-cyan-300">
            {stats.inProgress}
          </p>

          <p className="mt-2 text-xs text-slate-600">Currently active</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Done
          </p>

          <p className="mt-3 text-3xl font-bold text-emerald-300">
            {stats.done}
          </p>

          <p className="mt-2 text-xs text-slate-600">Completed issues</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            High Priority
          </p>

          <p className="mt-3 text-3xl font-bold text-amber-300">
            {stats.highPriority}
          </p>

          <p className="mt-2 text-xs text-slate-600">High + urgent</p>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">
            Completion
          </p>

          <p className="mt-3 text-3xl font-bold text-violet-300">
            {stats.completionRate}%
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-violet-400 transition-all duration-300"
              style={{
                width: `${stats.completionRate}%`,
              }}
            />
          </div>
        </article>
      </div>
    </section>
  );
}

export default BoardStats;
