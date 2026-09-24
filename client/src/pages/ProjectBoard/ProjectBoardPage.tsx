import { useEffect, useState } from "react";

import { useParams } from "react-router";

import {
  createIssue,
  getIssues,
  moveIssue,
  updateIssue,
  type CreateIssueInput,
  type Issue,
  type IssueStatus,
  type UpdateIssueInput,
} from "../../api/issues";

import CreateIssueForm from "../../components/kanban/CreateIssueForm.tsx";
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

  function handleStartCreate() {
    setEditingIssue(null);
    setShowCreateForm(true);
    setError(null);
  }

  function handleStartEdit(issue: Issue) {
    setShowCreateForm(false);
    setEditingIssue(issue);
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

        <KanbanBoard
          issues={issues}
          onMoveIssue={handleMoveIssue}
          onEditIssue={handleStartEdit}
        />
      </div>
    </main>
  );
}

export default ProjectBoardPage;
