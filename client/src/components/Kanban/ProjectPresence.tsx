import type { PresenceUser } from "../../socket/socket";

interface ProjectPresenceProps {
  users: PresenceUser[];
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function ProjectPresence({ users }: ProjectPresenceProps) {
  if (users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="h-2 w-2 rounded-full bg-slate-600" />
        No one currently viewing
      </div>
    );
  }

  const visibleUsers = users.slice(0, 5);

  const additionalUsers = Math.max(users.length - visibleUsers.length, 0);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />

        <span className="text-sm text-slate-400">
          {users.length} {users.length === 1 ? "person" : "people"} viewing
        </span>
      </div>

      <div className="flex -space-x-2">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            title={`${user.name} (${user.email})`}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-cyan-500/20 text-xs font-semibold text-cyan-300"
          >
            {getInitials(user.name)}
          </div>
        ))}

        {additionalUsers > 0 && (
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-950 bg-slate-700 text-xs font-semibold text-slate-300">
            +{additionalUsers}
          </div>
        )}
      </div>

      <div className="hidden flex-wrap gap-2 xl:flex">
        {visibleUsers.map((user) => (
          <span
            key={user.id}
            className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300"
          >
            {user.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default ProjectPresence;
