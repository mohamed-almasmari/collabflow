import type { WorkspaceAnalytics } from "../../api/analytics";

interface WorkspaceAnalyticsPanelProps {
  analytics: WorkspaceAnalytics | null;
  loading: boolean;
}

interface PriorityRowProps {
  label: string;
  value: number;
  total: number;
  barClassName: string;
  textClassName: string;
}

function PriorityRow({
  label,
  value,
  total,
  barClassName,
  textClassName,
}: PriorityRowProps) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${barClassName}`} />

          <span className={`text-[10px] font-medium ${textClassName}`}>
            {label}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-600">{percentage}%</span>

          <span className="min-w-4 text-right text-[10px] font-semibold text-slate-300">
            {value}
          </span>
        </div>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClassName}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
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

function WorkspaceAnalyticsPanel({
  analytics,
  loading,
}: WorkspaceAnalyticsPanelProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-lg bg-slate-900/60"
            />
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-72 animate-pulse rounded-lg bg-slate-900/60" />

          <div className="h-72 animate-pulse rounded-lg bg-slate-900/60" />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-8 text-center">
        <p className="text-xs text-slate-600">Analytics are not available.</p>
      </div>
    );
  }

  const maxOpenWorkload = Math.max(
    1,
    ...analytics.workload.map((member) => member.open),
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            Total issues
          </p>

          <p className="mt-3 text-2xl font-semibold text-white">
            {analytics.totalIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">Across all projects</p>
        </article>

        <article className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
            To do
          </p>

          <p className="mt-3 text-2xl font-semibold text-slate-200">
            {analytics.todoIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">Waiting to start</p>
        </article>

        <article className="rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">
            In progress
          </p>

          <p className="mt-3 text-2xl font-semibold text-violet-300">
            {analytics.inProgressIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">Currently active</p>
        </article>

        <article className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
            Done
          </p>

          <p className="mt-3 text-2xl font-semibold text-emerald-300">
            {analytics.doneIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">Completed issues</p>
        </article>

        <article className="rounded-lg border border-cyan-500/10 bg-cyan-500/[0.03] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400">
            Completion
          </p>

          <div className="mt-3 flex items-end justify-between">
            <p className="text-2xl font-semibold text-cyan-300">
              {analytics.completionRate}%
            </p>

            <span className="text-[8px] text-slate-600">
              {analytics.doneIssues}/{analytics.totalIssues}
            </span>
          </div>

          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
              style={{
                width: `${analytics.completionRate}%`,
              }}
            />
          </div>
        </article>

        <article
          className={`rounded-lg border p-4 ${
            analytics.overdueIssues > 0
              ? "border-rose-500/20 bg-rose-500/[0.05]"
              : "border-slate-800 bg-slate-900/40"
          }`}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wider text-rose-400">
            Overdue
          </p>

          <p className="mt-3 text-2xl font-semibold text-rose-300">
            {analytics.overdueIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">Open issues past due</p>
        </article>

        <article className="rounded-lg border border-amber-500/10 bg-amber-500/[0.04] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-400">
            High priority
          </p>

          <p className="mt-3 text-2xl font-semibold text-amber-300">
            {analytics.highPriorityIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">High + urgent open</p>
        </article>

        <article className="rounded-lg border border-blue-500/10 bg-blue-500/[0.03] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-400">
            Unassigned
          </p>

          <p className="mt-3 text-2xl font-semibold text-blue-300">
            {analytics.unassignedIssues}
          </p>

          <p className="mt-1 text-[9px] text-slate-600">
            Issues without an owner
          </p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-lg border border-slate-800 bg-slate-900/35 p-4">
          <div>
            <h4 className="text-xs font-semibold text-slate-200">
              Priority distribution
            </h4>

            <p className="mt-1 text-[9px] text-slate-600">
              How work is distributed by urgency.
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <PriorityRow
              label="Urgent"
              value={analytics.priorityDistribution.URGENT}
              total={analytics.totalIssues}
              barClassName="bg-rose-400"
              textClassName="text-rose-400"
            />

            <PriorityRow
              label="High"
              value={analytics.priorityDistribution.HIGH}
              total={analytics.totalIssues}
              barClassName="bg-orange-400"
              textClassName="text-orange-400"
            />

            <PriorityRow
              label="Medium"
              value={analytics.priorityDistribution.MEDIUM}
              total={analytics.totalIssues}
              barClassName="bg-amber-400"
              textClassName="text-amber-400"
            />

            <PriorityRow
              label="Low"
              value={analytics.priorityDistribution.LOW}
              total={analytics.totalIssues}
              barClassName="bg-blue-400"
              textClassName="text-blue-400"
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/35 p-4">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-200">
                Team workload
              </h4>

              <p className="mt-1 text-[9px] text-slate-600">
                Open and completed work by assignee.
              </p>
            </div>

            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[8px] text-slate-500">
              {analytics.workload.length} assigned
            </span>
          </div>

          {analytics.workload.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center">
              <div className="text-center">
                <p className="text-[11px] font-medium text-slate-400">
                  No assigned issues
                </p>

                <p className="mt-1 text-[9px] text-slate-600">
                  Assign issues to members to see workload data.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {analytics.workload.map((member, index) => {
                const openPercentage = Math.round(
                  (member.open / maxOpenWorkload) * 100,
                );

                const completionPercentage =
                  member.total === 0
                    ? 0
                    : Math.round((member.done / member.total) * 100);

                const avatarClasses = [
                  "bg-cyan-500",
                  "bg-violet-500",
                  "bg-emerald-500",
                  "bg-amber-500",
                  "bg-rose-500",
                  "bg-blue-500",
                ];

                return (
                  <div
                    key={member.userId}
                    className="rounded-lg border border-slate-800/70 bg-slate-950/35 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[8px] font-bold text-white ${
                          avatarClasses[index % avatarClasses.length]
                        }`}
                      >
                        {getInitials(member.name)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[10px] font-semibold text-slate-300">
                              {member.name}
                            </p>

                            <p className="mt-0.5 truncate text-[8px] text-slate-600">
                              {member.email}
                            </p>
                          </div>

                          <div className="shrink-0 text-right">
                            <p className="text-sm font-semibold text-slate-200">
                              {member.open}
                            </p>

                            <p className="text-[7px] uppercase tracking-wide text-slate-600">
                              open
                            </p>
                          </div>
                        </div>

                        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 transition-all duration-500"
                            style={{
                              width: `${openPercentage}%`,
                            }}
                          />
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[8px]">
                          <span className="text-slate-500">
                            <strong className="font-semibold text-slate-300">
                              {member.todo}
                            </strong>{" "}
                            todo
                          </span>

                          <span className="text-violet-500">
                            <strong className="font-semibold text-violet-300">
                              {member.inProgress}
                            </strong>{" "}
                            active
                          </span>

                          <span className="text-emerald-500">
                            <strong className="font-semibold text-emerald-300">
                              {member.done}
                            </strong>{" "}
                            done
                          </span>

                          <span className="ml-auto text-slate-600">
                            {completionPercentage}% complete
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {analytics.unassignedIssues > 0 && (
            <div className="mt-3 flex items-center justify-between rounded-md border border-blue-500/10 bg-blue-500/[0.03] px-3 py-2">
              <span className="text-[9px] text-slate-500">Unassigned work</span>

              <span className="text-[10px] font-semibold text-blue-300">
                {analytics.unassignedIssues}
              </span>
            </div>
          )}
        </section>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/35">
        <div className="border-b border-slate-800 px-4 py-3">
          <h4 className="text-xs font-semibold text-slate-200">
            Workflow health
          </h4>

          <p className="mt-0.5 text-[9px] text-slate-600">
            Current issue distribution across the workspace.
          </p>
        </div>

        <div className="grid sm:grid-cols-3">
          <div className="border-b border-slate-800 p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-500">To do</span>

              <span className="text-sm font-semibold text-slate-300">
                {analytics.todoIssues}
              </span>
            </div>
          </div>

          <div className="border-b border-slate-800 p-4 sm:border-b-0 sm:border-r">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-violet-400">In progress</span>

              <span className="text-sm font-semibold text-violet-300">
                {analytics.inProgressIssues}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-emerald-400">Done</span>

              <span className="text-sm font-semibold text-emerald-300">
                {analytics.doneIssues}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WorkspaceAnalyticsPanel;
