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

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateDifference(dueDate: string) {
  const todayKey = getTodayKey();

  const today = new Date(`${todayKey}T00:00:00`);

  const target = new Date(`${dueDate.slice(0, 10)}T00:00:00`);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
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

    let overdue = 0;

    let dueToday = 0;

    let dueNextSevenDays = 0;

    let noDueDate = 0;

    for (const issue of issues) {
      if (!issue.dueDate) {
        noDueDate += 1;

        continue;
      }

      const difference = getDateDifference(issue.dueDate);

      if (issue.status !== "DONE" && difference < 0) {
        overdue += 1;
      }

      if (issue.status !== "DONE" && difference === 0) {
        dueToday += 1;
      }

      if (issue.status !== "DONE" && difference >= 0 && difference <= 7) {
        dueNextSevenDays += 1;
      }
    }

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
      overdue,
      dueToday,
      dueNextSevenDays,
      noDueDate,
      workload,
      maxActive,
    };
  }, [issues]);

  const assignedPercent =
    stats.total === 0 ? 0 : Math.round((stats.assigned / stats.total) * 100);

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/45 px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
            Total
          </p>

          <p className="mt-1 text-lg font-semibold text-white">{stats.total}</p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/45 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />

            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-600">
              To do
            </p>
          </div>

          <p className="mt-1 text-lg font-semibold text-slate-200">
            {stats.todo}
          </p>
        </div>

        <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />

            <p className="text-[10px] font-medium uppercase tracking-wide text-violet-400">
              In progress
            </p>
          </div>

          <p className="mt-1 text-lg font-semibold text-violet-300">
            {stats.inProgress}
          </p>
        </div>

        <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-400">
              Done
            </p>
          </div>

          <p className="mt-1 text-lg font-semibold text-emerald-300">
            {stats.done}
          </p>
        </div>

        <div className="rounded-lg border border-orange-500/15 bg-orange-500/5 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />

            <p className="text-[10px] font-medium uppercase tracking-wide text-orange-400">
              Priority
            </p>
          </div>

          <p className="mt-1 text-lg font-semibold text-orange-300">
            {stats.highPriority}
          </p>
        </div>

        <div className="rounded-lg border border-cyan-500/15 bg-cyan-500/5 px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-cyan-400">
            Complete
          </p>

          <div className="mt-1 flex items-center gap-2">
            <p className="text-lg font-semibold text-cyan-300">
              {stats.completionRate}%
            </p>

            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-cyan-400"
                style={{
                  width: `${stats.completionRate}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-lg border border-slate-800 bg-slate-900/35 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-300">
                Deadline health
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-600">
                Unfinished issue schedule
              </p>
            </div>

            {stats.overdue > 0 && (
              <span className="rounded-md bg-rose-500/10 px-2 py-1 text-[10px] font-medium text-rose-300">
                {stats.overdue} overdue
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg bg-rose-500/5 px-3 py-2">
              <p className="text-[10px] text-rose-400">Overdue</p>

              <p className="mt-1 text-base font-semibold text-rose-300">
                {stats.overdue}
              </p>
            </div>

            <div className="rounded-lg bg-amber-500/5 px-3 py-2">
              <p className="text-[10px] text-amber-400">Today</p>

              <p className="mt-1 text-base font-semibold text-amber-300">
                {stats.dueToday}
              </p>
            </div>

            <div className="rounded-lg bg-cyan-500/5 px-3 py-2">
              <p className="text-[10px] text-cyan-400">Next 7 days</p>

              <p className="mt-1 text-base font-semibold text-cyan-300">
                {stats.dueNextSevenDays}
              </p>
            </div>

            <div className="rounded-lg bg-slate-800/40 px-3 py-2">
              <p className="text-[10px] text-slate-500">No due date</p>

              <p className="mt-1 text-base font-semibold text-slate-300">
                {stats.noDueDate}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/35 p-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-slate-300">Assignment</h2>

            <span className="text-[10px] text-slate-600">
              {assignedPercent}% assigned
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{
                width: `${assignedPercent}%`,
              }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Assigned</span>

            <span className="font-medium text-cyan-300">{stats.assigned}</span>
          </div>

          <div className="mt-1.5 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Unassigned</span>

            <span
              className={
                stats.unassigned > 0
                  ? "font-medium text-amber-300"
                  : "font-medium text-slate-300"
              }
            >
              {stats.unassigned}
            </span>
          </div>
        </div>
      </div>

      {stats.workload.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/35 p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-semibold text-slate-300">
                Team workload
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-600">
                Active work by assignee
              </p>
            </div>

            <span className="text-[10px] text-slate-600">
              {stats.workload.length} members
            </span>
          </div>

          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {stats.workload.map((member) => {
              const workloadPercent =
                stats.maxActive === 0
                  ? 0
                  : Math.round((member.active / stats.maxActive) * 100);

              return (
                <div
                  key={member.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-slate-300">
                        {member.name}
                      </p>

                      <p className="mt-0.5 truncate text-[9px] text-slate-700">
                        {member.email}
                      </p>
                    </div>

                    <div className="flex gap-3 text-right">
                      <div>
                        <p className="text-[8px] text-slate-600">Active</p>

                        <p className="text-[11px] font-semibold text-cyan-300">
                          {member.active}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] text-slate-600">Done</p>

                        <p className="text-[11px] font-semibold text-emerald-300">
                          {member.done}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-cyan-400"
                      style={{
                        width: `${workloadPercent}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

export default BoardStats;
