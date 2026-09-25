import { useCallback, useEffect, useMemo, useState } from "react";

import { useParams, useSearchParams } from "react-router";

import { getProjectActivity, type ActivityLog } from "../../api/activity";

import {
  createIssue,
  deleteIssue,
  getIssues,
  IssueConflictError,
  moveIssue,
  updateIssue,
  type CreateIssueInput,
  type Issue,
  type IssueStatus,
  type UpdateIssueInput,
} from "../../api/issues";

import { getLabels, type Label } from "../../api/labels";

import { getProjectById, type Project } from "../../api/projects";

import {
  getWorkspaceById,
  type Workspace,
  type WorkspaceMember,
} from "../../api/workspaces";

import ActivityTimeline from "../../components/Activity/ActivityTimeline";

import CommentsPanel from "../../components/Comments/CommentsPanel";

import BoardActions from "../../components/Kanban/BoardActions";

import BoardFilters, {
  type DueDateFilter,
  type PriorityFilter,
  type SortOption,
  type StatusFilter,
} from "../../components/Kanban/BoardFilters";

import BoardStats from "../../components/Kanban/BoardStats";

import CreateIssueForm from "../../components/Kanban/CreateIssueForm";

import EditIssueForm from "../../components/Kanban/EditIssueForm";

import KanbanBoard from "../../components/Kanban/KanbanBoard";

import LabelManager from "../../components/Kanban/LabelManager";

import ProjectPresence from "../../components/Kanban/ProjectPresence";

import { useAuth } from "../../hooks/useAuth";

import {
  getSocket,
  type IssueActivity,
  type IssueActivityType,
  type PresenceUser,
} from "../../socket/socket";

import {
  addRealtimeIssue,
  deleteRealtimeIssue,
  moveRealtimeIssue,
  updateRealtimeIssue,
} from "../../utils/issueRealtime";

function getStatusFilter(value: string | null): StatusFilter {
  switch (value) {
    case "TODO":
    case "IN_PROGRESS":
    case "DONE":
      return value;

    default:
      return "ALL";
  }
}

function getPriorityFilter(value: string | null): PriorityFilter {
  switch (value) {
    case "LOW":
    case "MEDIUM":
    case "HIGH":
    case "URGENT":
      return value;

    default:
      return "ALL";
  }
}

function getDueDateFilter(value: string | null): DueDateFilter {
  switch (value) {
    case "OVERDUE":
    case "TODAY":
    case "NEXT_7_DAYS":
    case "NO_DUE_DATE":
      return value;

    default:
      return "ALL";
  }
}

function getSortOption(value: string | null): SortOption {
  switch (value) {
    case "PRIORITY":
    case "DUE_DATE":
    case "UPDATED_DESC":
    case "UPDATED_ASC":
    case "TITLE":
      return value;

    default:
      return "BOARD";
  }
}

const priorityOrder = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
} as const;

function getTodayKey() {
  const today = new Date();

  const year = today.getFullYear();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateDifference(date: string) {
  const today = new Date(`${getTodayKey()}T00:00:00`);

  const target = new Date(`${date.slice(0, 10)}T00:00:00`);

  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();

  const [searchParams, setSearchParams] = useSearchParams();

  const { accessToken, user } = useAuth();

  const linkedIssueId = searchParams.get("issue");

  const searchText = searchParams.get("q") ?? "";

  const statusFilter = getStatusFilter(searchParams.get("status"));

  const priorityFilter = getPriorityFilter(searchParams.get("priority"));

  const dueDateFilter = getDueDateFilter(searchParams.get("due"));

  const assigneeFilter = searchParams.get("assignee") ?? "ALL";

  const labelFilter = searchParams.get("label") ?? "ALL";

  const sortOption = getSortOption(searchParams.get("sort"));

  const myIssuesOnly = searchParams.get("mine") === "true";

  const [issues, setIssues] = useState<Issue[]>([]);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const [labels, setLabels] = useState<Label[]>([]);

  const [activities, setActivities] = useState<ActivityLog[]>([]);

  const [activityLoading, setActivityLoading] = useState(false);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [project, setProject] = useState<Project | null>(null);

  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);

  const [issueActivities, setIssueActivities] = useState<IssueActivity[]>([]);

  const [discussionIssue, setDiscussionIssue] = useState<Issue | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);

  const [deleting, setDeleting] = useState(false);

  const filteredIssues = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    const filtered = issues.filter((issue) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        issue.title.toLowerCase().includes(normalizedSearch) ||
        (issue.description ?? "").toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "ALL" || issue.status === statusFilter;

      const matchesPriority =
        priorityFilter === "ALL" || issue.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === "ALL" ||
        (assigneeFilter === "UNASSIGNED" && !issue.assigneeId) ||
        issue.assigneeId === assigneeFilter;

      const matchesMine = !myIssuesOnly || issue.assigneeId === user?.id;

      const matchesLabel =
        labelFilter === "ALL" ||
        issue.issueLabels.some(({ label }) => label.id === labelFilter);

      let matchesDueDate = true;

      if (dueDateFilter !== "ALL") {
        if (dueDateFilter === "NO_DUE_DATE") {
          matchesDueDate = !issue.dueDate;
        } else if (!issue.dueDate) {
          matchesDueDate = false;
        } else {
          const difference = getDateDifference(issue.dueDate);

          switch (dueDateFilter) {
            case "OVERDUE":
              matchesDueDate = issue.status !== "DONE" && difference < 0;

              break;

            case "TODAY":
              matchesDueDate = difference === 0;

              break;

            case "NEXT_7_DAYS":
              matchesDueDate = difference >= 0 && difference <= 7;

              break;

            default:
              matchesDueDate = true;
          }
        }
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesAssignee &&
        matchesMine &&
        matchesLabel &&
        matchesDueDate
      );
    });

    return [...filtered].sort((firstIssue, secondIssue) => {
      switch (sortOption) {
        case "PRIORITY": {
          const difference =
            priorityOrder[firstIssue.priority] -
            priorityOrder[secondIssue.priority];

          return difference || firstIssue.position - secondIssue.position;
        }

        case "DUE_DATE": {
          if (!firstIssue.dueDate && !secondIssue.dueDate) {
            return firstIssue.position - secondIssue.position;
          }

          if (!firstIssue.dueDate) {
            return 1;
          }

          if (!secondIssue.dueDate) {
            return -1;
          }

          return firstIssue.dueDate.localeCompare(secondIssue.dueDate);
        }

        case "UPDATED_DESC":
          return (
            new Date(secondIssue.updatedAt).getTime() -
            new Date(firstIssue.updatedAt).getTime()
          );

        case "UPDATED_ASC":
          return (
            new Date(firstIssue.updatedAt).getTime() -
            new Date(secondIssue.updatedAt).getTime()
          );

        case "TITLE":
          return firstIssue.title.localeCompare(secondIssue.title);

        case "BOARD":
        default:
          return firstIssue.position - secondIssue.position;
      }
    });
  }, [
    issues,
    searchText,
    statusFilter,
    priorityFilter,
    dueDateFilter,
    assigneeFilter,
    labelFilter,
    sortOption,
    myIssuesOnly,
    user?.id,
  ]);

  const loadActivity = useCallback(async () => {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    try {
      setActivityLoading(true);

      const data = await getProjectActivity(
        workspaceId,
        projectId,
        accessToken,
      );

      setActivities(data);
    } catch (activityError) {
      console.error("Unable to refresh activity:", activityError);
    } finally {
      setActivityLoading(false);
    }
  }, [workspaceId, projectId, accessToken]);

  useEffect(() => {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    const currentWorkspaceId = workspaceId;

    const currentProjectId = projectId;

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadBoard() {
      try {
        setLoading(true);

        setError(null);

        const [issueData, workspaceData, projectData, activityData, labelData] =
          await Promise.all([
            getIssues(currentWorkspaceId, currentProjectId, currentAccessToken),

            getWorkspaceById(currentWorkspaceId, currentAccessToken),

            getProjectById(
              currentWorkspaceId,
              currentProjectId,
              currentAccessToken,
            ),

            getProjectActivity(
              currentWorkspaceId,
              currentProjectId,
              currentAccessToken,
            ),

            getLabels(currentWorkspaceId, currentProjectId, currentAccessToken),
          ]);

        if (cancelled) {
          return;
        }

        setIssues(issueData);

        setMembers(workspaceData.members);

        setWorkspace(workspaceData);

        setProject(projectData);

        setActivities(activityData);

        setLabels(labelData);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load project board",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBoard();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId, accessToken]);

  useEffect(() => {
    if (!linkedIssueId) {
      setDiscussionIssue(null);

      return;
    }

    const linkedIssue = issues.find((issue) => issue.id === linkedIssueId);

    if (linkedIssue) {
      setDiscussionIssue(linkedIssue);
    }
  }, [linkedIssueId, issues]);

  useEffect(() => {
    if (!workspaceId || !projectId || !accessToken) {
      setRealtimeConnected(false);

      setPresenceUsers([]);

      setIssueActivities([]);

      return;
    }

    const currentWorkspaceId = workspaceId;

    const currentProjectId = projectId;

    const socket = getSocket(accessToken);

    const roomPayload = {
      workspaceId: currentWorkspaceId,

      projectId: currentProjectId,
    };

    function belongsToCurrentProject(payload: {
      workspaceId: string;
      projectId: string;
    }) {
      return (
        payload.workspaceId === currentWorkspaceId &&
        payload.projectId === currentProjectId
      );
    }

    function refreshActivitySoon() {
      window.setTimeout(() => {
        void loadActivity();
      }, 300);
    }

    function joinProjectRoom() {
      setRealtimeConnected(true);

      socket.emit("project:join", roomPayload);
    }

    function handleDisconnect() {
      setRealtimeConnected(false);

      setPresenceUsers([]);

      setIssueActivities([]);
    }

    function handleConnectError(socketError: Error) {
      setRealtimeConnected(false);

      setError(socketError.message);
    }

    function handleSocketError(payload: { message: string }) {
      setError(payload.message);
    }

    function handlePresenceUpdated(payload: {
      workspaceId: string;
      projectId: string;
      users: PresenceUser[];
    }) {
      if (belongsToCurrentProject(payload)) {
        setPresenceUsers(payload.users);
      }
    }

    function handleIssueActivity(payload: {
      workspaceId: string;
      projectId: string;
      issueId: string;
      activity: IssueActivityType;
      active: boolean;
      user: PresenceUser;
    }) {
      if (!belongsToCurrentProject(payload)) {
        return;
      }

      setIssueActivities((current) => {
        const matches = (item: IssueActivity) =>
          item.issueId === payload.issueId &&
          item.activity === payload.activity &&
          item.user.id === payload.user.id;

        if (!payload.active) {
          return current.filter((item) => !matches(item));
        }

        if (current.some(matches)) {
          return current;
        }

        return [
          ...current,
          {
            issueId: payload.issueId,

            activity: payload.activity,

            user: payload.user,
          },
        ];
      });
    }

    function handleIssueCreated(payload: {
      workspaceId: string;
      projectId: string;
      issue: Issue;
    }) {
      if (!belongsToCurrentProject(payload)) {
        return;
      }

      setIssues((current) => addRealtimeIssue(current, payload.issue));

      refreshActivitySoon();
    }

    function handleIssueUpdated(payload: {
      workspaceId: string;
      projectId: string;
      issue: Issue;
    }) {
      if (!belongsToCurrentProject(payload)) {
        return;
      }

      setIssues((current) => updateRealtimeIssue(current, payload.issue));

      setDiscussionIssue((current) =>
        current?.id === payload.issue.id ? payload.issue : current,
      );

      refreshActivitySoon();
    }

    function handleIssueMoved(payload: {
      workspaceId: string;
      projectId: string;
      issue: Issue;
    }) {
      if (!belongsToCurrentProject(payload)) {
        return;
      }

      setIssues((current) => moveRealtimeIssue(current, payload.issue));

      refreshActivitySoon();
    }

    function handleIssueDeleted(payload: {
      workspaceId: string;
      projectId: string;
      issueId: string;
    }) {
      if (!belongsToCurrentProject(payload)) {
        return;
      }

      setIssues((current) => deleteRealtimeIssue(current, payload.issueId));

      if (linkedIssueId === payload.issueId) {
        setSearchParams((current) => {
          const next = new URLSearchParams(current);

          next.delete("issue");

          return next;
        });
      }

      refreshActivitySoon();
    }

    socket.on("connect", joinProjectRoom);

    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", handleConnectError);

    socket.on("socket:error", handleSocketError);

    socket.on("presence:updated", handlePresenceUpdated);

    socket.on("issue:activity", handleIssueActivity);

    socket.on("issue:created", handleIssueCreated);

    socket.on("issue:updated", handleIssueUpdated);

    socket.on("issue:moved", handleIssueMoved);

    socket.on("issue:deleted", handleIssueDeleted);

    if (socket.connected) {
      joinProjectRoom();
    }

    return () => {
      if (socket.connected) {
        socket.emit("project:leave", roomPayload);
      }

      socket.off("connect", joinProjectRoom);

      socket.off("disconnect", handleDisconnect);

      socket.off("connect_error", handleConnectError);

      socket.off("socket:error", handleSocketError);

      socket.off("presence:updated", handlePresenceUpdated);

      socket.off("issue:activity", handleIssueActivity);

      socket.off("issue:created", handleIssueCreated);

      socket.off("issue:updated", handleIssueUpdated);

      socket.off("issue:moved", handleIssueMoved);

      socket.off("issue:deleted", handleIssueDeleted);
    };
  }, [
    workspaceId,
    projectId,
    accessToken,
    loadActivity,
    linkedIssueId,
    setSearchParams,
  ]);

  function setQueryParameter(key: string, value: string, defaultValue: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (value.trim().length === 0 || value === defaultValue) {
        next.delete(key);
      } else {
        next.set(key, value);
      }

      return next;
    });
  }

  function handleClearFilters() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      [
        "q",
        "status",
        "priority",
        "due",
        "assignee",
        "label",
        "sort",
        "mine",
      ].forEach((key) => next.delete(key));

      return next;
    });
  }

  function emitIssueEvent(
    event: "issue:created" | "issue:updated" | "issue:moved" | "issue:deleted",
    issueId: string,
  ) {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    const socket = getSocket(accessToken);

    if (socket.connected) {
      socket.emit(event, {
        workspaceId,
        projectId,
        issueId,
      });
    }
  }

  function emitIssueActivity(
    issueId: string,
    activity: IssueActivityType,
    active: boolean,
  ) {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    const socket = getSocket(accessToken);

    if (socket.connected) {
      socket.emit("issue:activity", {
        workspaceId,
        projectId,
        issueId,
        activity,
        active,
      });
    }
  }

  async function handleCreateIssue(input: CreateIssueInput) {
    if (!workspaceId || !projectId || !accessToken) {
      throw new Error("Unable to create issue");
    }

    const newIssue = await createIssue(
      workspaceId,
      projectId,
      input,
      accessToken,
    );

    setIssues((current) => addRealtimeIssue(current, newIssue));

    setShowCreateForm(false);

    emitIssueEvent("issue:created", newIssue.id);

    void loadActivity();
  }

  async function handleUpdateIssue(issueId: string, input: UpdateIssueInput) {
    if (!workspaceId || !projectId || !accessToken || !editingIssue) {
      throw new Error("Unable to update issue");
    }

    try {
      const updated = await updateIssue(
        workspaceId,
        projectId,
        issueId,
        input,
        editingIssue.updatedAt,
        accessToken,
      );

      setIssues((current) => updateRealtimeIssue(current, updated));

      setEditingIssue(null);

      emitIssueEvent("issue:updated", updated.id);

      void loadActivity();
    } catch (updateError) {
      if (updateError instanceof IssueConflictError) {
        throw new IssueConflictError(
          "Another collaborator changed this issue. Review the latest version and save again.",
        );
      }

      throw updateError;
    } finally {
      emitIssueActivity(issueId, "EDITING", false);
    }
  }

  async function handleMoveIssue(
    issueId: string,
    status: IssueStatus,
    position: number,
  ) {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    try {
      const moved = await moveIssue(
        workspaceId,
        projectId,
        issueId,
        {
          status,
          position,
        },
        accessToken,
      );

      setIssues((current) => moveRealtimeIssue(current, moved));

      emitIssueEvent("issue:moved", moved.id);
    } catch (moveError) {
      setError(
        moveError instanceof Error ? moveError.message : "Unable to move issue",
      );
    }
  }

  async function handleDeleteIssue() {
    if (!deletingIssue || !workspaceId || !projectId || !accessToken) {
      return;
    }

    try {
      setDeleting(true);

      await deleteIssue(workspaceId, projectId, deletingIssue.id, accessToken);

      setIssues((current) => deleteRealtimeIssue(current, deletingIssue.id));

      emitIssueEvent("issue:deleted", deletingIssue.id);

      setDeletingIssue(null);
    } finally {
      setDeleting(false);
    }
  }

  function handleOpenComments(issue: Issue) {
    setDiscussionIssue(issue);

    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      next.set("issue", issue.id);

      return next;
    });
  }

  function handleCloseComments() {
    setDiscussionIssue(null);

    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      next.delete("issue");

      return next;
    });
  }

  const currentMembership = user
    ? members.find((member) => member.user.id === user.id)
    : undefined;

  const canManageLabels =
    currentMembership?.role === "OWNER" || currentMembership?.role === "ADMIN";

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-slate-800" />

        <div className="h-10 animate-pulse rounded-lg bg-slate-900" />

        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-96 animate-pulse rounded-xl bg-slate-900"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="border-b border-slate-800 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="font-medium text-cyan-400">
                {workspace?.name ?? "Workspace"}
              </span>

              <span className="text-slate-700">/</span>

              <span className="text-slate-500">Board</span>

              {project?.status === "ARCHIVED" && (
                <>
                  <span className="text-slate-700">•</span>

                  <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-500">
                    Archived
                  </span>
                </>
              )}
            </div>

            <h1 className="truncate text-xl font-semibold tracking-tight text-white">
              {project?.name ?? "Project Board"}
            </h1>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
              {project?.description ??
                "Track and collaborate on project issues."}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
              <span className="text-slate-500">
                <span className="font-semibold text-slate-300">
                  {members.length}
                </span>{" "}
                {members.length === 1 ? "member" : "members"}
              </span>

              <span className="text-slate-500">
                <span className="font-semibold text-slate-300">
                  {issues.length}
                </span>{" "}
                {issues.length === 1 ? "issue" : "issues"}
              </span>

              <span className="flex items-center gap-1.5">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    realtimeConnected ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                />

                <span
                  className={
                    realtimeConnected ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {realtimeConnected ? "Realtime" : "Disconnected"}
                </span>
              </span>
            </div>

            {presenceUsers.length > 0 && (
              <div className="mt-3">
                <ProjectPresence users={presenceUsers} />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            disabled={project?.status === "ARCHIVED"}
            className="inline-flex items-center gap-1.5 self-start rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 xl:self-auto"
          >
            <span className="text-sm leading-none">+</span>
            New issue
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-900/60 bg-rose-950/30 px-3 py-2.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      <BoardStats issues={issues} />

      {workspaceId && projectId && accessToken && (
        <LabelManager
          workspaceId={workspaceId}
          projectId={projectId}
          accessToken={accessToken}
          labels={labels}
          canManage={canManageLabels}
          onCreated={(label) =>
            setLabels((current) =>
              [...current, label].sort((first, second) =>
                first.name.localeCompare(second.name),
              ),
            )
          }
        />
      )}

      {showCreateForm && (
        <CreateIssueForm
          members={members}
          labels={labels}
          onCreate={handleCreateIssue}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingIssue && (
        <EditIssueForm
          key={`${editingIssue.id}-${editingIssue.updatedAt}`}
          issue={editingIssue}
          members={members}
          labels={labels}
          onSave={handleUpdateIssue}
          onCancel={() => {
            emitIssueActivity(editingIssue.id, "EDITING", false);

            setEditingIssue(null);
          }}
        />
      )}

      {discussionIssue && workspaceId && projectId && accessToken && (
        <CommentsPanel
          workspaceId={workspaceId}
          projectId={projectId}
          issue={discussionIssue}
          accessToken={accessToken}
          currentUserId={user?.id ?? null}
          currentUserRole={currentMembership?.role ?? null}
          onClose={handleCloseComments}
        />
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/35 p-3">
        <BoardFilters
          searchText={searchText}
          statusFilter={statusFilter}
          priorityFilter={priorityFilter}
          dueDateFilter={dueDateFilter}
          assigneeFilter={assigneeFilter}
          labelFilter={labelFilter}
          sortOption={sortOption}
          myIssuesOnly={myIssuesOnly}
          members={members}
          labels={labels}
          filteredCount={filteredIssues.length}
          totalCount={issues.length}
          onSearchChange={(value) => setQueryParameter("q", value, "")}
          onStatusChange={(value) => setQueryParameter("status", value, "ALL")}
          onPriorityChange={(value) =>
            setQueryParameter("priority", value, "ALL")
          }
          onDueDateChange={(value) => setQueryParameter("due", value, "ALL")}
          onAssigneeChange={(value) =>
            setQueryParameter("assignee", value, "ALL")
          }
          onLabelChange={(value) => setQueryParameter("label", value, "ALL")}
          onSortChange={(value) => setQueryParameter("sort", value, "BOARD")}
          onMyIssuesChange={(value) =>
            setQueryParameter("mine", value ? "true" : "", "")
          }
          onClear={handleClearFilters}
        />
      </div>

      <div className="flex justify-end">
        <BoardActions
          issues={filteredIssues}
          projectName={project?.name ?? "CollabFlow Project"}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0">
          <KanbanBoard
            issues={filteredIssues}
            activities={issueActivities}
            onMoveIssue={handleMoveIssue}
            onCommentsIssue={handleOpenComments}
            onEditIssue={(issue) => {
              setEditingIssue(issue);

              emitIssueActivity(issue.id, "EDITING", true);
            }}
            onDeleteIssue={setDeletingIssue}
            onDragActivity={(issueId, active) =>
              emitIssueActivity(issueId, "DRAGGING", active)
            }
          />
        </div>

        <ActivityTimeline
          activities={activities}
          loading={activityLoading}
          onRefresh={loadActivity}
        />
      </div>

      {deletingIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40">
            <div className="border-b border-slate-800 px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-400" />

                <h2 className="text-sm font-semibold text-white">
                  Delete issue
                </h2>
              </div>
            </div>

            <div className="px-5 py-4">
              <p className="text-sm leading-6 text-slate-400">
                Delete{" "}
                <span className="font-medium text-white">
                  {deletingIssue.title}
                </span>
                ?
              </p>

              <p className="mt-1 text-xs text-slate-600">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3">
              <button
                type="button"
                onClick={() => setDeletingIssue(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  void handleDeleteIssue();
                }}
                className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete issue"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectBoardPage;
