import {
  useState,
  type FormEvent,
} from "react";

import type {
  AddWorkspaceMemberInput,
  AssignableWorkspaceRole,
  Workspace,
  WorkspaceMember,
  WorkspaceRole,
} from "../../api/workspaces";

interface WorkspaceMembersPanelProps {
  workspace: Workspace;

  onAddMember: (
    input: AddWorkspaceMemberInput,
  ) => Promise<void>;

  onUpdateMember: (
    member: WorkspaceMember,
    role: AssignableWorkspaceRole,
  ) => Promise<void>;

  onRemoveMember: (
    member: WorkspaceMember,
  ) => Promise<void>;

  onClose: () => void;
}

function getInitials(
  name: string,
) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRoleBadgeClasses(
  role: WorkspaceRole,
) {
  switch (role) {
    case "OWNER":
      return "border-purple-500/30 bg-purple-500/10 text-purple-300";

    case "ADMIN":
      return "border-cyan-500/30 bg-cyan-500/10 text-cyan-300";

    case "MEMBER":
      return "border-slate-600 bg-slate-800 text-slate-300";
  }
}

function WorkspaceMembersPanel({
  workspace,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onClose,
}: WorkspaceMembersPanelProps) {
  const [email, setEmail] =
    useState("");

  const [role, setRole] =
    useState<AssignableWorkspaceRole>(
      "MEMBER",
    );

  const [submitting, setSubmitting] =
    useState(false);

  const [
    updatingMemberId,
    setUpdatingMemberId,
  ] = useState<string | null>(null);

  const [
    removingMemberId,
    setRemovingMemberId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const canManageMembers =
    workspace.currentUserRole ===
      "OWNER" ||
    workspace.currentUserRole ===
      "ADMIN";

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setError(
        "Member email is required",
      );

      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await onAddMember({
        email: email
          .trim()
          .toLowerCase(),
        role,
      });

      setEmail("");
      setRole("MEMBER");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to add member",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRoleChange(
    member: WorkspaceMember,
    newRole: AssignableWorkspaceRole,
  ) {
    try {
      setUpdatingMemberId(
        member.id,
      );

      setError(null);

      await onUpdateMember(
        member,
        newRole,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update member",
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function handleRemove(
    member: WorkspaceMember,
  ) {
    const confirmed =
      window.confirm(
        `Remove ${member.user.name} from ${workspace.name}?`,
      );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(
        member.id,
      );

      setError(null);

      await onRemoveMember(member);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove member",
      );
    } finally {
      setRemovingMemberId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Workspace Management
          </p>

          <h2 className="mt-1 text-xl font-bold text-white">
            {workspace.name} Members
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            {workspace.members.length}{" "}
            {workspace.members.length ===
            1
              ? "member"
              : "members"}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
        >
          Close
        </button>
      </header>

      {error && (
        <div className="mb-5 rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {canManageMembers && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-xl border border-slate-800 bg-slate-950/50 p-4"
        >
          <h3 className="mb-4 font-semibold text-white">
            Add Member
          </h3>

          <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <div>
              <label
                htmlFor="member-email"
                className="sr-only"
              >
                Email
              </label>

              <input
                id="member-email"
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value,
                  )
                }
                placeholder="member@example.com"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-500"
              />
            </div>

            <div>
              <label
                htmlFor="member-role"
                className="sr-only"
              >
                Role
              </label>

              <select
                id="member-role"
                value={role}
                onChange={(event) =>
                  setRole(
                    event.target
                      .value as AssignableWorkspaceRole,
                  )
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500"
              >
                <option value="MEMBER">
                  Member
                </option>

                <option value="ADMIN">
                  Admin
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Adding..."
                : "Add Member"}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {workspace.members.map(
          (member) => {
            const isOwner =
              member.role === "OWNER";

            const isAdmin =
              member.role === "ADMIN";

            const currentUserIsOwner =
              workspace.currentUserRole ===
              "OWNER";

            const currentUserIsAdmin =
              workspace.currentUserRole ===
              "ADMIN";

            const canEditRole =
              !isOwner &&
              canManageMembers &&
              !(
                currentUserIsAdmin &&
                isAdmin
              );

            const canRemove =
              !isOwner &&
              canManageMembers &&
              !(
                currentUserIsAdmin &&
                isAdmin
              );

            return (
              <div
                key={member.id}
                className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-300">
                    {getInitials(
                      member.user.name,
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-white">
                        {
                          member.user
                            .name
                        }
                      </p>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getRoleBadgeClasses(
                          member.role,
                        )}`}
                      >
                        {member.role}
                      </span>
                    </div>

                    <p className="mt-1 truncate text-sm text-slate-500">
                      {
                        member.user
                          .email
                      }
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {canEditRole && (
                    <select
                      value={
                        member.role
                      }
                      disabled={
                        updatingMemberId ===
                        member.id
                      }
                      onChange={(
                        event,
                      ) => {
                        void handleRoleChange(
                          member,
                          event.target
                            .value as AssignableWorkspaceRole,
                        );
                      }}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-cyan-500 disabled:opacity-50"
                    >
                      <option value="MEMBER">
                        Member
                      </option>

                      <option value="ADMIN">
                        Admin
                      </option>
                    </select>
                  )}

                  {canRemove && (
                    <button
                      type="button"
                      disabled={
                        removingMemberId ===
                        member.id
                      }
                      onClick={() => {
                        void handleRemove(
                          member,
                        );
                      }}
                      className="rounded-lg border border-red-900 px-3 py-2 text-sm font-medium text-red-400 transition hover:bg-red-950/40 disabled:opacity-50"
                    >
                      {removingMemberId ===
                      member.id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}

                  {isOwner &&
                    currentUserIsOwner && (
                      <span className="text-xs text-slate-500">
                        Workspace owner
                      </span>
                    )}
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}

export default WorkspaceMembersPanel;