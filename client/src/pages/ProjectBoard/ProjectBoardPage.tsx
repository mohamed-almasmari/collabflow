import { useEffect, useState } from "react";

import { useParams } from "react-router";

import {
  createIssue,
  deleteIssue,
  getIssues,
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

import CreateIssueForm from "../../components/kanban/CreateIssueForm";
import EditIssueForm from "../../components/kanban/EditIssueForm";
import KanbanBoard from "../../components/kanban/KanbanBoard";

import { useAuth } from "../../hooks/useAuth";

import { getSocket } from "../../socket/socket";

function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();

  const { accessToken } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);

  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [project, setProject] = useState<Project | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [showCreateForm, setShowCreateForm] = useState(false);

  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);

  const [deletingIssue, setDeletingIssue] = useState<Issue | null>(null);

  const [deleting, setDeleting] = useState(false);

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

        const [issueData, workspaceData, projectData] = await Promise.all([
          getIssues(currentWorkspaceId, currentProjectId, currentAccessToken),

          getWorkspaceById(currentWorkspaceId, currentAccessToken),

          getProjectById(
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
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
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

      return;
    }

    const currentWorkspaceId = workspaceId;

    const currentProjectId = projectId;

    const currentAccessToken = accessToken;

    const socket = getSocket(currentAccessToken);

    const roomPayload = {
      workspaceId: currentWorkspaceId,

      projectId: currentProjectId,
    };

    function joinProjectRoom() {
      setRealtimeConnected(true);

      socket.emit("project:join", roomPayload);
    }

    function handleDisconnect() {
      setRealtimeConnected(false);
    }

    function handleConnectError(error: Error) {
      setRealtimeConnected(false);

      setError(error.message || "Unable to connect to real-time server");
    }

    function handleSocketError(payload: { message: string }) {
      setError(payload.message);
    }

    async function handleBoardRefresh(payload: {
      workspaceId: string;
      projectId: string;
    }) {
      if (
        payload.workspaceId !== currentWorkspaceId ||
        payload.projectId !== currentProjectId
      ) {
        return;
      }

      try {
        const refreshedIssues = await getIssues(
          currentWorkspaceId,
          currentProjectId,
          currentAccessToken,
        );

        setIssues(refreshedIssues);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Unable to refresh board",
        );
      }
    }

    socket.on("connect", joinProjectRoom);

    socket.on("disconnect", handleDisconnect);

    socket.on("connect_error", handleConnectError);

    socket.on("socket:error", handleSocketError);

    socket.on("board:refresh", handleBoardRefresh);

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

      socket.off("board:refresh", handleBoardRefresh);
    };
  }, [workspaceId, projectId, accessToken]);

  function broadcastBoardChange() {
    if (!workspaceId || !projectId || !accessToken) {
      return;
    }

    const socket = getSocket(accessToken);

    if (!socket.connected) {
      return;
    }

    socket.emit("board:changed", {
      workspaceId,
      projectId,
    });
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

    setIssues((currentIssues) => [...currentIssues, newIssue]);

    setShowCreateForm(false);

    broadcastBoardChange();
  }

  async function handleUpdateIssue(issueId: string, input: UpdateIssueInput) {
    if (!workspaceId || !projectId || !accessToken) {
      throw new Error("Unable to update issue");
    }

    const updatedIssue = await updateIssue(
      workspaceId,
      projectId,
      issueId,
      input,
      accessToken,
    );

    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === updatedIssue.id ? updatedIssue : issue,
      ),
    );

    setEditingIssue(null);

    broadcastBoardChange();
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

    setError(null);

    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === issueId
          ? {
              ...issue,
              status,
              position,
            }
          : issue,
      ),
    );

    try {
      await moveIssue(
        workspaceId,
        projectId,
        issueId,
        {
          status,
          position,
        },
        accessToken,
      );

      const refreshedIssues = await getIssues(
        workspaceId,
        projectId,
        accessToken,
      );

      setIssues(refreshedIssues);

      broadcastBoardChange();
    } catch (error) {
      setIssues(previousIssues);

      setError(error instanceof Error ? error.message : "Unable to move issue");
    }
  }

  async function handleDeleteIssue() {
    if (!deletingIssue || !workspaceId || !projectId || !accessToken) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await deleteIssue(workspaceId, projectId, deletingIssue.id, accessToken);

      const refreshedIssues = await getIssues(
        workspaceId,
        projectId,
        accessToken,
      );

      setIssues(refreshedIssues);

      if (editingIssue?.id === deletingIssue.id) {
        setEditingIssue(null);
      }

      setDeletingIssue(null);

      broadcastBoardChange();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to delete issue",
      );
    } finally {
      setDeleting(false);
    }
  }

  function handleStartCreate() {
    setEditingIssue(null);
    setDeletingIssue(null);
    setShowCreateForm(true);
    setError(null);
  }

  function handleStartEdit(issue: Issue) {
    setShowCreateForm(false);
    setDeletingIssue(null);
    setEditingIssue(issue);
    setError(null);
  }

  function handleStartDelete(issue: Issue) {
    setShowCreateForm(false);
    setEditingIssue(null);
    setDeletingIssue(issue);
    setError(null);
  }

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

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
                <span>
                  {members.length} {members.length === 1 ? "member" : "members"}
                </span>

                <span>
                  {issues.length} {issues.length === 1 ? "issue" : "issues"}
                </span>

                <span
                  className={
                    realtimeConnected ? "text-emerald-400" : "text-amber-400"
                  }
                >
                  {realtimeConnected
                    ? "Real-time connected"
                    : "Real-time disconnected"}
                </span>
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
              issue={editingIssue}
              members={members}
              onSave={handleUpdateIssue}
              onCancel={() => setEditingIssue(null)}
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

        <KanbanBoard
          issues={issues}
          onMoveIssue={handleMoveIssue}
          onEditIssue={handleStartEdit}
          onDeleteIssue={handleStartDelete}
        />
      </div>
    </main>
  );
}

export default ProjectBoardPage;
