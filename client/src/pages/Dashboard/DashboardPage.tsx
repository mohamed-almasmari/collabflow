import { useEffect, useState } from "react";

import { useNavigate } from "react-router";

import {
  createProject,
  getProjects,
  type CreateProjectInput,
  type Project,
} from "../../api/projects";

import {
  createWorkspace,
  getWorkspaces,
  type CreateWorkspaceInput,
  type WorkspaceSummary,
} from "../../api/workspaces";

import CreateProjectForm from "../../pages/Dashboard/CreateProjectForm.tsx";
import CreateWorkspaceForm from "../../pages/Dashboard/CreateWorkspaceForm";

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

  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);

  const [showProjectForm, setShowProjectForm] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function loadWorkspaces(token: string) {
    const data = await getWorkspaces(token);

    setWorkspaces(data);

    setSelectedWorkspace((currentWorkspace) => {
      if (
        currentWorkspace &&
        data.some((workspace) => workspace.id === currentWorkspace.id)
      ) {
        return (
          data.find((workspace) => workspace.id === currentWorkspace.id) ?? null
        );
      }

      return data[0] ?? null;
    });
  }

  async function loadProjects(workspaceId: string, token: string) {
    const data = await getProjects(workspaceId, token);

    setProjects(data);
  }

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoadingWorkspaces(true);
        setError(null);

        const data = await getWorkspaces(currentAccessToken);

        if (cancelled) {
          return;
        }

        setWorkspaces(data);

        setSelectedWorkspace(data[0] ?? null);
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

    void loadDashboard();

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

    async function loadWorkspaceProjects() {
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

    void loadWorkspaceProjects();

    return () => {
      cancelled = true;
    };
  }, [selectedWorkspace, accessToken]);

  async function handleCreateWorkspace(input: CreateWorkspaceInput) {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    await createWorkspace(input, accessToken);

    await loadWorkspaces(accessToken);

    setShowWorkspaceForm(false);
  }

  async function handleCreateProject(input: CreateProjectInput) {
    if (!accessToken || !selectedWorkspace) {
      throw new Error("Workspace is required");
    }

    await createProject(selectedWorkspace.id, input, accessToken);

    await loadProjects(selectedWorkspace.id, accessToken);

    setShowProjectForm(false);
  }

  function handleSelectWorkspace(workspace: WorkspaceSummary) {
    setSelectedWorkspace(workspace);

    setShowProjectForm(false);
    setError(null);
  }

  function handleOpenProject(project: Project) {
    if (!selectedWorkspace) {
      return;
    }

    navigate(
      `/workspaces/${selectedWorkspace.id}/projects/${project.id}/board`,
    );
  }

  function handleStartWorkspaceCreation() {
    setShowProjectForm(false);
    setShowWorkspaceForm(true);
    setError(null);
  }

  function handleStartProjectCreation() {
    setShowWorkspaceForm(false);
    setShowProjectForm(true);
    setError(null);
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
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">
              CollabFlow
            </p>

            <h1 className="text-3xl font-bold">Dashboard</h1>

            <p className="mt-2 text-slate-400">
              Manage your workspaces and projects.
            </p>
          </div>

          <button
            type="button"
            onClick={handleStartWorkspaceCreation}
            className="self-start rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-cyan-400 sm:self-auto"
          >
            New Workspace
          </button>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        {showWorkspaceForm && (
          <div className="mb-6">
            <CreateWorkspaceForm
              onCreate={handleCreateWorkspace}
              onCancel={() => setShowWorkspaceForm(false)}
            />
          </div>
        )}

        {showProjectForm && selectedWorkspace && (
          <div className="mb-6">
            <CreateProjectForm
              onCreate={handleCreateProject}
              onCancel={() => setShowProjectForm(false)}
            />
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
                      <p className="truncate font-medium text-white">
                        {workspace.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {workspace.role}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </aside>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            {selectedWorkspace ? (
              <>
                <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-cyan-400">
                      Workspace
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      {selectedWorkspace.name}
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm text-slate-400">
                      {selectedWorkspace.description ??
                        "No workspace description."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleStartProjectCreation}
                    disabled={selectedWorkspace.role === "MEMBER"}
                    className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-600"
                  >
                    New Project
                  </button>
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
                      Create the first project in this workspace.
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

                        <button
                          type="button"
                          onClick={() => handleOpenProject(project)}
                          className="mt-5 w-full rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Open Board
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex min-h-72 items-center justify-center">
                <div className="text-center">
                  <p className="font-medium text-slate-300">
                    No workspace selected
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Create or select a workspace to continue.
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
