import {
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router";

import {
  getIssues,
  type Issue,
} from "../../api/issues";

import KanbanBoard from "../../components/kanban/KanbanBoard.tsx"
import { useAuth } from "../../hooks/useAuth";

function ProjectBoardPage() {
  const {
    workspaceId,
    projectId,
  } = useParams();

  const { accessToken } = useAuth();

  const [issues, setIssues] =
    useState<Issue[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (
      !workspaceId ||
      !projectId ||
      !accessToken
    ) {
      return;
    }

    let cancelled = false;

    async function loadIssues() {
      try {
        setLoading(true);
        setError(null);

        const data = await getIssues(
          workspaceId!,
          projectId!,
          accessToken!,
        );

        if (!cancelled) {
          setIssues(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load issues",
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
  }, [
    workspaceId,
    projectId,
    accessToken,
  ]);

  if (loading) {
    return (
      <div className="p-8 text-slate-300">
        Loading board...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
          {error}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
            Project Board
          </p>

          <h1 className="text-3xl font-bold text-white">
            Kanban Board
          </h1>

          <p className="mt-2 text-slate-400">
            Track issues across your project workflow.
          </p>
        </header>

        <KanbanBoard issues={issues} />
      </div>
    </main>
  );
}

export default ProjectBoardPage;