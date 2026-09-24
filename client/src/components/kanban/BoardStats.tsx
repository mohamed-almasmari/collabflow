import { useMemo } from "react";

import type { Issue } from "../../api/issues";

interface BoardStatsProps {
  issues: Issue[];
}

interface MemberWorkload {
  id: string;
  name: string;
  email: string;
  total: number;
  active: number;
  done: number;
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

    const unassigned = issues.filter((issue) => !issue.assigneeId).length;

    const assigned = total - unassigned;

    const completionRate = total === 0 ? 0 : Math.round((done / total) * 100);

    const workloadMap = new Map<string, MemberWorkload>();

    for (const issue of issues) {
      if (!issue.assigneeId || !issue.assignee) {
        continue;
      }

      const existing = workloadMap.get(issue.assigneeId);

      if (existing) {
        existing.total += 1;

        if (issue.status === "DONE") {
          existing.done += 1;
        } else {
          existing.active += 1;
        }

        continue;
      }

      workloadMap.set(issue.assigneeId, {
        id: issue.assignee.id,

        name: issue.assignee.name,

        email: issue.assignee.email,

        total: 1,

        active: issue.status === "DONE" ? 0 : 1,

        done: issue.status === "DONE" ? 1 : 0,
      });
    }

    const workload = Array.from(workloadMap.values()).sort(
      (first, second) =>
        second.active - first.active ||
        second.total - first.total ||
        first.name.localeCompare(second.name),
    );

    const maxActive = workload.reduce(
      (highest, member) => Math.max(highest, member.active),
      0,
    );

    return {
      total,
      todo,
      inProgress,
      done,
      highPriority,
      assigned,
      unassigned,
      completionRate,
      workload,
      maxActive,
    };
  }, [issues]);

  return (
    <section className="mb-6 space-y-4">
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

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Assignment
            </p>

            <h2 className="mt-1 text-lg font-semibold text-white">
              Issue Ownership
            </h2>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Assigned</span>

                <span className="font-semibold text-white">
                  {stats.assigned}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width:
                      stats.total === 0
                        ? "0%"
                        : `${Math.round(
                            (stats.assigned / stats.total) * 100,
                          )}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Unassigned</span>

                <span
                  className={
                    stats.unassigned > 0
                      ? "font-semibold text-amber-300"
                      : "font-semibold text-slate-300"
                  }
                >
                  {stats.unassigned}
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{
                    width:
                      stats.total === 0
                        ? "0%"
                        : `${Math.round(
                            (stats.unassigned / stats.total) * 100,
                          )}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {stats.unassigned > 0 && (
            <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-5 text-amber-200">
              {stats.unassigned}{" "}
              {stats.unassigned === 1 ? "issue has" : "issues have"} no
              assignee.
            </p>
          )}
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Team
              </p>

              <h2 className="mt-1 text-lg font-semibold text-white">
                Workload Distribution
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Active work assigned across the team.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-right">
              <p className="text-xs text-slate-500">Assigned members</p>

              <p className="text-lg font-semibold text-white">
                {stats.workload.length}
              </p>
            </div>
          </div>

          {stats.workload.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-8 text-center">
              <p className="text-sm text-slate-400">
                No issues are assigned yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {stats.workload.map((member) => {
                const workloadPercent =
                  stats.maxActive === 0
                    ? 0
                    : Math.round((member.active / stats.maxActive) * 100);

                const isHighestLoad =
                  stats.maxActive > 0 && member.active === stats.maxActive;

                return (
                  <div
                    key={member.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {member.name}
                          </p>

                          {isHighestLoad && stats.workload.length > 1 && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                              Highest load
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-600">
                          {member.email}
                        </p>
                      </div>

                      <div className="flex gap-5 text-right">
                        <div>
                          <p className="text-xs text-slate-500">Active</p>

                          <p className="font-semibold text-cyan-300">
                            {member.active}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Done</p>

                          <p className="font-semibold text-emerald-300">
                            {member.done}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Total</p>

                          <p className="font-semibold text-white">
                            {member.total}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-cyan-400 transition-all duration-300"
                        style={{
                          width: `${workloadPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}

export default BoardStats;
