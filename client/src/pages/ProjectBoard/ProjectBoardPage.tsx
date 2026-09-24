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

import CreateIssueForm from "../../components/kanban/CreateIssueForm";
import EditIssueForm from "../../components/kanban/EditIssueForm";
import KanbanBoard from "../../components/kanban/KanbanBoard";

import { useAuth } from "../../hooks/useAuth";

function ProjectBoardPage() {
  const { workspaceId, projectId } = useParams();

  const { accessToken } = useAuth();

  const [issues, setIssues] = useState<Issue[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

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

    async function loadIssues() {
      try {
        setLoading(true);
        setError(null);

        const data = await getIssues(
          currentWorkspaceId,
          currentProjectId,
          currentAccessToken,
        );

        if (!cancelled) {
          setIssues(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Unable to load issues",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadIssues();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, projectId, accessToken]);

  async function handleCreateIssue(input: CreateIssueInput) {
    if (!workspaceId || !projectId || !accessToken) {
      throw new Error(
        "Unable to create issue because project information is missing",
      );
    }

    const newIssue = await createIssue(
      workspaceId,
      projectId,
      input,
      accessToken,
    );

    setIssues((currentIssues) => [...currentIssues, newIssue]);

    setShowCreateForm(false);
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
        <header className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Project Board
              </p>

              <h1 className="text-3xl font-bold text-white">Kanban Board</h1>

              <p className="mt-2 text-slate-400">
                Track issues across your project workflow.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartCreate}
              className="self-start rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 sm:self-auto"
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
              onCreate={handleCreateIssue}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {editingIssue && (
          <div className="mb-6">
            <EditIssueForm
              issue={editingIssue}
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
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  void handleDeleteIssue();
                }}
                disabled={deleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
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
