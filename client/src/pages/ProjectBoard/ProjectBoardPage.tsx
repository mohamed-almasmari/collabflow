import { useCallback, useEffect, useState } from "react";

import { useParams } from "react-router";

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

import { getProjectById, type Project } from "../../api/projects";

import {
  getWorkspaceById,
  type Workspace,
  type WorkspaceMember,
} from "../../api/workspaces";

import ActivityTimeline from "../../components/activity/ActivityTimeline";
import CommentsPanel from "../../components/comments/CommentsPanel";
import CreateIssueForm from "../../components/kanban/CreateIssueForm";
import EditIssueForm from "../../components/kanban/EditIssueForm";
import KanbanBoard from "../../components/kanban/KanbanBoard";
import ProjectPresence from "../../components/kanban/ProjectPresence";

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

function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();

  const { accessToken, user } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);

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

        const [issueData, workspaceData, projectData, activityData] =
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
          ]);

        if (cancelled) {
          return;
        }

        setIssues(issueData);

        setMembers(workspaceData.members);

        setWorkspace(workspaceData);

        setProject(projectData);

        setActivities(activityData);
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

      setPresenceUsers([]);

      setIssueActivities([]);

      setError(socketError.message || "Unable to connect to real-time server");
    }

    function handleSocketError(payload: { message: string }) {
      setError(payload.message);
    }

    function handlePresenceUpdated(payload: {
      workspaceId: string;

      projectId: string;

      users: PresenceUser[];
    }) {
      if (!belongsToCurrentProject(payload)) {
        return;
      }

      setPresenceUsers(payload.users);
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

      setIssueActivities((currentActivities) => {
        const matches = (activity: IssueActivity) =>
          activity.issueId === payload.issueId &&
          activity.activity === payload.activity &&
          activity.user.id === payload.user.id;

        if (!payload.active) {
          return currentActivities.filter((activity) => !matches(activity));
        }

        if (currentActivities.some(matches)) {
          return currentActivities;
        }

        return [
          ...currentActivities,

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

      setIssues((currentIssues) =>
        addRealtimeIssue(currentIssues, payload.issue),
      );

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

      setIssues((currentIssues) =>
        updateRealtimeIssue(currentIssues, payload.issue),
      );

      setDiscussionIssue((currentIssue) =>
        currentIssue?.id === payload.issue.id ? payload.issue : currentIssue,
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

      setIssues((currentIssues) =>
        moveRealtimeIssue(currentIssues, payload.issue),
      );

      setDiscussionIssue((currentIssue) =>
        currentIssue?.id === payload.issue.id ? payload.issue : currentIssue,
      );

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

      setIssues((currentIssues) =>
        deleteRealtimeIssue(currentIssues, payload.issueId),
      );

      setIssueActivities((currentActivities) =>
        currentActivities.filter(
          (activity) => activity.issueId !== payload.issueId,
        ),
      );

      setEditingIssue((currentIssue) =>
        currentIssue?.id === payload.issueId ? null : currentIssue,
      );

      setDiscussionIssue((currentIssue) =>
        currentIssue?.id === payload.issueId ? null : currentIssue,
      );

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

      setPresenceUsers([]);

      setIssueActivities([]);

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
  }, [workspaceId, projectId, accessToken, loadActivity]);

  function emitIssueEvent(
    event: "issue:created" | "issue:updated" | "issue:moved" | "issue:deleted",

    issueId: string,
  ) {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    const socket = getSocket(accessToken);

    if (!socket.connected) {
      return;
    }

    socket.emit(event, {
      workspaceId,
      projectId,
      issueId,
    });
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

    if (!socket.connected) {
      return;
    }

    socket.emit("issue:activity", {
      workspaceId,
      projectId,
      issueId,
      activity,
      active,
    });
  }

  function refreshActivitySoon() {
    window.setTimeout(() => {
      void loadActivity();
    }, 300);
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

    setIssues((currentIssues) => addRealtimeIssue(currentIssues, newIssue));

    setShowCreateForm(false);

    emitIssueEvent("issue:created", newIssue.id);

    refreshActivitySoon();
  }

  async function handleUpdateIssue(
    issueId: string,

    input: UpdateIssueInput,
  ) {
    if (!workspaceId || !projectId || !accessToken) {
      throw new Error("Unable to update issue");
    }

    if (!editingIssue || editingIssue.id !== issueId) {
      throw new Error("The issue being edited is no longer available");
    }

    try {
      const updatedIssue = await updateIssue(
        workspaceId,
        projectId,
        issueId,
        input,
        editingIssue.updatedAt,
        accessToken,
      );

      setIssues((currentIssues) =>
        updateRealtimeIssue(currentIssues, updatedIssue),
      );

      setDiscussionIssue((currentIssue) =>
        currentIssue?.id === updatedIssue.id ? updatedIssue : currentIssue,
      );

      setEditingIssue(null);

      emitIssueEvent("issue:updated", updatedIssue.id);

      refreshActivitySoon();
    } catch (updateError) {
      if (updateError instanceof IssueConflictError) {
        const latestIssue = issues.find((issue) => issue.id === issueId);

        if (latestIssue) {
          setEditingIssue(latestIssue);
        }

        throw new IssueConflictError(
          "Another collaborator changed this issue while you were editing it. Review the latest version and save again.",
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

    const previousIssues = issues;

    const existingIssue = issues.find((issue) => issue.id === issueId);

    if (!existingIssue) {
      return;
    }

    const optimisticIssue: Issue = {
      ...existingIssue,
      status,
      position,
    };

    setError(null);

    setIssues((currentIssues) =>
      moveRealtimeIssue(currentIssues, optimisticIssue),
    );

    try {
      const movedIssue = await moveIssue(
        workspaceId,
        projectId,
        issueId,
        {
          status,
          position,
        },
        accessToken,
      );

      setIssues((currentIssues) =>
        moveRealtimeIssue(currentIssues, movedIssue),
      );

      setDiscussionIssue((currentIssue) =>
        currentIssue?.id === movedIssue.id ? movedIssue : currentIssue,
      );

      emitIssueEvent("issue:moved", movedIssue.id);

      refreshActivitySoon();
    } catch (moveError) {
      setIssues(previousIssues);

      setError(
        moveError instanceof Error ? moveError.message : "Unable to move issue",
      );
    }
  }

  async function handleDeleteIssue() {
    if (!deletingIssue || !workspaceId || !projectId || !accessToken) {
      return;
    }

    const issueId = deletingIssue.id;

    try {
      setDeleting(true);

      setError(null);

      await deleteIssue(workspaceId, projectId, issueId, accessToken);

      setIssues((currentIssues) => deleteRealtimeIssue(currentIssues, issueId));

      setIssueActivities((currentActivities) =>
        currentActivities.filter((activity) => activity.issueId !== issueId),
      );

      if (discussionIssue?.id === issueId) {
        setDiscussionIssue(null);
      }

      if (editingIssue?.id === issueId) {
        emitIssueActivity(issueId, "EDITING", false);

        setEditingIssue(null);
      }

      setDeletingIssue(null);

      emitIssueEvent("issue:deleted", issueId);

      refreshActivitySoon();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete issue",
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleStartCreate() {
    if (editingIssue) {
      emitIssueActivity(editingIssue.id, "EDITING", false);
    }

    setEditingIssue(null);

    setDeletingIssue(null);

    setShowCreateForm(true);

    setError(null);
  }

  function handleStartEdit(issue: Issue) {
    if (editingIssue && editingIssue.id !== issue.id) {
      emitIssueActivity(editingIssue.id, "EDITING", false);
    }

    setShowCreateForm(false);

    setDeletingIssue(null);

    setEditingIssue(issue);

    setError(null);

    emitIssueActivity(issue.id, "EDITING", true);
  }

  function handleCancelEdit() {
    if (editingIssue) {
      emitIssueActivity(editingIssue.id, "EDITING", false);
    }

    setEditingIssue(null);
  }

  function handleStartDelete(issue: Issue) {
    if (editingIssue) {
      emitIssueActivity(editingIssue.id, "EDITING", false);
    }

    setShowCreateForm(false);

    setEditingIssue(null);

    setDeletingIssue(issue);

    setError(null);
  }

  function handleOpenComments(issue: Issue) {
    setDiscussionIssue(issue);

    setError(null);
  }

  function handleDragActivity(
    issueId: string,

    active: boolean,
  ) {
    emitIssueActivity(issueId, "DRAGGING", active);
  }

  const currentMembership = user
    ? members.find((member) => member.user.id === user.id)
    : undefined;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <p className="text-slate-300">Loading board...</p>
      </main>
    );
  }

  if (error && issues.length === 0) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                {workspace?.name ?? "Workspace"}
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-white">
                  {project?.name ?? "Kanban Board"}
                </h1>

                {project && (
                  <span
                    className={`
                      rounded-full border px-3 py-1 text-xs font-semibold
                      ${
                        project.status === "ACTIVE"
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                          : "border-slate-600 bg-slate-800 text-slate-400"
                      }
                    `}
                  >
                    {project.status}
                  </span>
                )}
              </div>

              <p className="mt-2 max-w-2xl text-slate-400">
                {project?.description ??
                  "Track issues across your project workflow."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <span className="text-sm text-slate-500">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>

                <span className="text-sm text-slate-500">
                  {issues.length} {issues.length === 1 ? "issue" : "issues"}
                </span>

                <span
                  className={
                    realtimeConnected
                      ? "text-sm text-emerald-400"
                      : "text-sm text-amber-400"
                  }
                >
                  {realtimeConnected
                    ? "Real-time connected"
                    : "Real-time disconnected"}
                </span>
              </div>

              <div className="mt-4">
                <ProjectPresence users={presenceUsers} />
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartCreate}
              disabled={project?.status === "ARCHIVED"}
              className="self-start rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
            >
              New Issue
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {showCreateForm && (
          <div className="mb-6">
            <CreateIssueForm
              members={members}
              onCreate={handleCreateIssue}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {editingIssue && (
          <div className="mb-6">
            <EditIssueForm
              key={`${editingIssue.id}-${editingIssue.updatedAt}`}
              issue={editingIssue}
              members={members}
              onSave={handleUpdateIssue}
              onCancel={handleCancelEdit}
            />
          </div>
        )}

        {deletingIssue && (
          <div className="mb-6 rounded-2xl border border-red-900 bg-red-950/30 p-5">
            <h2 className="text-lg font-semibold text-white">Delete Issue</h2>

            <p className="mt-2 text-sm text-slate-300">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-white">
                {deletingIssue.title}
              </span>
              ?
            </p>

            <p className="mt-1 text-sm text-red-300">
              This action cannot be undone.
            </p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingIssue(null)}
                disabled={deleting}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleDeleteIssue();
                }}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete Issue"}
              </button>
            </div>
          </div>
        )}

        {discussionIssue && workspaceId && projectId && accessToken && (
          <CommentsPanel
            workspaceId={workspaceId}
            projectId={projectId}
            issue={discussionIssue}
            accessToken={accessToken}
            currentUserId={user?.id ?? null}
            currentUserRole={currentMembership?.role ?? null}
            onClose={() => setDiscussionIssue(null)}
          />
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <KanbanBoard
            issues={issues}
            activities={issueActivities}
            onMoveIssue={handleMoveIssue}
            onCommentsIssue={handleOpenComments}
            onEditIssue={handleStartEdit}
            onDeleteIssue={handleStartDelete}
            onDragActivity={handleDragActivity}
          />

          <ActivityTimeline
            activities={activities}
            loading={activityLoading}
            onRefresh={loadActivity}
          />
        </div>
      </div>
    </main>
  );
}

export default ProjectBoardPage;
