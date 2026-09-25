import { useState, type SyntheticEvent } from "react";

import type {
  AddWorkspaceMemberInput,
  AssignableWorkspaceRole,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "../../api/workspaces";

interface WorkspaceMembersPanelProps {
  workspace: Workspace;

  onAddMember: (input: AddWorkspaceMemberInput) => Promise<void>;

  onUpdateMember: (
    member: WorkspaceMember,
    role: AssignableWorkspaceRole,
  ) => Promise<void>;

  onRemoveMember: (member: WorkspaceMember) => Promise<void>;

  onClose: () => void;
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRoleBadgeClasses(role: WorkspaceRole) {
  switch (role) {
    case "OWNER":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";

    case "ADMIN":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

    case "MEMBER":
      return "border-slate-700 bg-slate-800 text-slate-300";
  }
}

function WorkspaceMembersPanel({
  workspace,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onClose,
}: WorkspaceMembersPanelProps) {
  const [email, setEmail] = useState("");

  const [role, setRole] = useState<AssignableWorkspaceRole>("MEMBER");

  const [submitting, setSubmitting] = useState(false);

  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);

  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const canManageMembers =
    workspace.currentUserRole === "OWNER" ||
    workspace.currentUserRole === "ADMIN";

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setError("Member email is required");

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onAddMember({
        email: email.trim().toLowerCase(),

        role,
      });

      setEmail("");
      setRole("MEMBER");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(
    member: WorkspaceMember,
    newRole: AssignableWorkspaceRole,
  ) {
    try {
      setUpdatingMemberId(member.id);

      setError(null);

      await onUpdateMember(member, newRole);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update member",
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemove(member: WorkspaceMember) {
    const confirmed = window.confirm(
      `Remove ${member.user.name} from ${workspace.name}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(member.id);

      setError(null);

      await onRemoveMember(member);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to remove member",
      );
    } finally {
      setRemovingMemberId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-black/20">
      <header className="flex flex-col gap-4 border-b border-slate-800 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <circle cx="9" cy="8" r="3" />

              <path d="M3.5 19c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5" />

              <path d="M16 8.5a2.5 2.5 0 1 1 0 5" />

              <path d="M17 14.5c2.2.5 3.4 2 3.5 4.5" />
            </svg>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-400">
              Workspace management
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-tight text-white">
              {workspace.name} members
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {workspace.members.length}{" "}
              {workspace.members.length === 1 ? "member" : "members"} in this
              workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
        >
          Close
        </button>
      </header>

      <div className="space-y-6 p-6">
        {error && (
          <div className="rounded-xl border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {canManageMembers && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-800 bg-slate-950/45 p-5"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-white">Add a team member</h3>

              <p className="mt-1 text-sm text-slate-500">
                Invite an existing CollabFlow user by email.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto]">
              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="member@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
              />

              <select
                id="member-role"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as AssignableWorkspaceRole)
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/10"
              >
                <option value="MEMBER">Member</option>

                <option value="ADMIN">Admin</option>
              </select>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Adding..." : "Add member"}
              </button>
            </div>
          </form>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-300">
              Team members
            </h3>

            <span className="text-xs text-slate-600">
              {workspace.members.length} total
            </span>
          </div>

          <div className="divide-y divide-slate-800 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/35">
            {workspace.members.map((member) => {
              const isOwner = member.role === "OWNER";

              const isAdmin = member.role === "ADMIN";

              const currentUserIsOwner = workspace.currentUserRole === "OWNER";

              const currentUserIsAdmin = workspace.currentUserRole === "ADMIN";

              const canEditRole =
                !isOwner &&
                canManageMembers &&
                !(currentUserIsAdmin && isAdmin);

              const canRemove =
                !isOwner &&
                canManageMembers &&
                !(currentUserIsAdmin && isAdmin);

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 px-4 py-4 transition hover:bg-slate-900/50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-semibold text-cyan-300">
                      {getInitials(member.user.name)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-white">
                          {member.user.name}
                        </p>

                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${getRoleBadgeClasses(
                            member.role,
                          )}`}
                        >
                          {member.role}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {member.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canEditRole && (
                      <select
                        value={member.role}
                        disabled={updatingMemberId === member.id}
                        onChange={(event) => {
                          void handleRoleChange(
                            member,
                            event.target.value as AssignableWorkspaceRole,
                          );
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 disabled:opacity-50"
                      >
                        <option value="MEMBER">Member</option>

                        <option value="ADMIN">Admin</option>
                      </select>
                    )}

                    {canRemove && (
                      <button
                        type="button"
                        disabled={removingMemberId === member.id}
                        onClick={() => {
                          void handleRemove(member);
                        }}
                        className="rounded-lg border border-red-900/70 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/30 disabled:opacity-50"
                      >
                        {removingMemberId === member.id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    )}

                    {isOwner && currentUserIsOwner && (
                      <span className="text-xs text-slate-600">
                        Workspace owner
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default WorkspaceMembersPanel;
