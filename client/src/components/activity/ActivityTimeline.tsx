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
      return "bg-amber-400";

    case "DELETED":
      return "bg-red-400";
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
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60">
      <header className="flex items-center justify-between border-b border-slate-800 p-5">
        <div>
          <h2 className="font-semibold text-white">Activity</h2>

          <p className="mt-1 text-sm text-slate-500">Recent project changes</p>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            void onRefresh();
          }}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      <div className="max-h-[600px] overflow-y-auto p-5">
        {loading && activities.length === 0 ? (
          <p className="text-sm text-slate-500">Loading activity...</p>
        ) : activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
            <p className="text-sm text-slate-500">No activity yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {activities.map((activity) => (
              <article key={activity.id} className="relative pl-6">
                <span
                  className={`absolute left-0 top-2 h-2.5 w-2.5 rounded-full ${getActionStyle(
                    activity.action,
                  )}`}
                />

                <p className="text-sm leading-6 text-slate-300">
                  <span className="font-semibold text-white">
                    {activity.actor.name}
                  </span>{" "}
                  {getActivityText(activity)}
                </p>

                <time className="mt-1 block text-xs text-slate-500">
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
