import type { ActivityLog } from "../../api/activity";

interface ActivityTimelineProps {
  activities: ActivityLog[];
  loading: boolean;
  onRefresh: () => Promise<void>;
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getActivityText(activity: ActivityLog) {
  const title = activity.details?.title;

  switch (activity.action) {
    case "CREATED":
      return title ? `created "${title}"` : "created an issue";

    case "UPDATED":
      return title ? `updated "${title}"` : "updated an issue";

    case "MOVED": {
      const status = activity.details?.status;

      if (title && status) {
        return `moved "${title}" to ${formatStatus(status)}`;
      }

      if (status) {
        return `moved an issue to ${formatStatus(status)}`;
      }

      return "moved an issue";
    }

    case "DELETED":
      return title ? `deleted "${title}"` : "deleted an issue";

    default:
      return "changed an issue";
  }
}

function getActionStyle(action: ActivityLog["action"]) {
  switch (action) {
    case "CREATED":
      return "bg-emerald-400";

    case "UPDATED":
      return "bg-cyan-400";

    case "MOVED":
      return "bg-violet-400";

    case "DELETED":
      return "bg-rose-400";
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",

    day: "numeric",

    hour: "numeric",

    minute: "2-digit",
  }).format(new Date(date));
}

function ActivityTimeline({
  activities,
  loading,
  onRefresh,
}: ActivityTimelineProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/35">
      <header className="flex h-11 items-center justify-between border-b border-slate-800 px-3">
        <div>
          <h2 className="text-xs font-semibold text-slate-300">Activity</h2>

          <p className="text-[9px] text-slate-700">Recent changes</p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            void onRefresh();
          }}
          className="rounded-md px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:bg-slate-800 hover:text-slate-300 disabled:opacity-50"
        >
          {loading ? "..." : "Refresh"}
        </button>
      </header>

      <div className="max-h-[520px] overflow-y-auto p-3">
        {loading && activities.length === 0 ? (
          <p className="py-6 text-center text-[11px] text-slate-600">
            Loading activity...
          </p>
        ) : activities.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 py-8 text-center">
            <p className="text-[11px] text-slate-600">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <article key={activity.id} className="relative pl-4">
                <span
                  className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full ${getActionStyle(
                    activity.action,
                  )}`}
                />

                <p className="text-[11px] leading-5 text-slate-500">
                  <span className="font-medium text-slate-300">
                    {activity.actor.name}
                  </span>{" "}
                  {getActivityText(activity)}
                </p>

                <time className="mt-0.5 block text-[9px] text-slate-700">
                  {formatDate(activity.createdAt)}
                </time>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ActivityTimeline;
