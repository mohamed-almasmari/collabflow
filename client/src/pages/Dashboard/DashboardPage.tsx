import { useEffect, useState } from "react";

import { useNavigate } from "react-router";

import { getProjects, type Project } from "../../api/projects";

import { getWorkspaces, type WorkspaceSummary } from "../../api/workspaces";

import { useAuth } from "../../hooks/useAuth";

function DashboardPage() {
  const navigate = useNavigate();

  const { accessToken } = useAuth();

  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);

  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const [loadingProjects, setLoadingProjects] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadWorkspaces() {
      try {
        setLoadingWorkspaces(true);
        setError(null);

        const data = await getWorkspaces(currentAccessToken);

        if (cancelled) {
          return;
        }

        setWorkspaces(data);

        if (data.length > 0) {
          setSelectedWorkspace(data[0] ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load workspaces",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingWorkspaces(false);
        }
      }
    }

    void loadWorkspaces();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    if (!selectedWorkspace || !accessToken) {
      setProjects([]);
      return;
    }

    const workspaceId = selectedWorkspace.id;

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadProjects() {
      try {
        setLoadingProjects(true);
        setError(null);

        const data = await getProjects(workspaceId, currentAccessToken);

        if (!cancelled) {
          setProjects(data);
        }
      } catch (error) {
        if (!cancelled) {
          setError(
            error instanceof Error ? error.message : "Unable to load projects",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);
        }
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [selectedWorkspace, accessToken]);

  function handleSelectWorkspace(workspace: WorkspaceSummary) {
    setSelectedWorkspace(workspace);
  }

  function handleOpenProject(project: Project) {
    if (!selectedWorkspace) {
      return;
    }

    navigate(
      `/workspaces/${selectedWorkspace.id}/projects/${project.id}/board`,
    );
  }

  if (loadingWorkspaces) {
    return (
      <main className="min-h-screen bg-slate-950 p-8">
        <p className="text-slate-300">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
            CollabFlow
          </p>

          <h1 className="text-3xl font-bold">Dashboard</h1>

          <p className="mt-2 text-slate-400">
            Select a workspace and open one of its projects.
          </p>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Workspaces</h2>

              <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
                {workspaces.length}
              </span>
            </div>

            {workspaces.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
                <p className="text-sm text-slate-500">No workspaces yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workspaces.map((workspace) => {
                  const active = selectedWorkspace?.id === workspace.id;

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => handleSelectWorkspace(workspace)}
                      className={`
                          w-full rounded-xl border p-3 text-left transition
                          ${
                            active
                              ? "border-cyan-500 bg-cyan-500/10"
                              : "border-slate-800 bg-slate-900 hover:border-slate-700"
                          }
                        `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {workspace.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {workspace.role}
                          </p>
                        </div>

                        {active && (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            {selectedWorkspace ? (
              <>
                <header className="mb-6">
                  <p className="text-sm font-medium text-cyan-400">Workspace</p>

                  <h2 className="mt-1 text-2xl font-bold">
                    {selectedWorkspace.name}
                  </h2>

                  <p className="mt-2 text-sm text-slate-400">
                    {selectedWorkspace.description ??
                      "No workspace description."}
                  </p>
                </header>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200">Projects</h3>

                  <span className="text-sm text-slate-500">
                    {projects.length}{" "}
                    {projects.length === 1 ? "project" : "projects"}
                  </span>
                </div>

                {loadingProjects ? (
                  <p className="text-sm text-slate-400">Loading projects...</p>
                ) : projects.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center">
                    <p className="font-medium text-slate-300">
                      No projects yet
                    </p>

                    <p className="mt-2 text-sm text-slate-500">
                      This workspace does not have any projects.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project) => (
                      <article
                        key={project.id}
                        className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700"
                      >
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <h3 className="font-semibold text-white">
                            {project.name}
                          </h3>

                          <span
                            className={`
                                rounded-full border px-2.5 py-1 text-[11px] font-semibold
                                ${
                                  project.status === "ACTIVE"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                    : "border-slate-600 bg-slate-800 text-slate-400"
                                }
                              `}
                          >
                            {project.status}
                          </span>
                        </div>

                        <p className="min-h-12 text-sm leading-6 text-slate-400">
                          {project.description ?? "No project description."}
                        </p>

                        <div className="mt-5">
                          <button
                            type="button"
                            onClick={() => handleOpenProject(project)}
                            className="w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                          >
                            Open Board
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <p className="font-medium text-slate-300">
                    Select a workspace
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Choose a workspace to view its projects.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

export default DashboardPage;
