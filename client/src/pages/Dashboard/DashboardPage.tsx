import { useEffect, useState } from "react";

import { useNavigate, useSearchParams } from "react-router";

import {
  getWorkspaceAnalytics,
  type WorkspaceAnalytics,
} from "../../api/analytics";

import {
  createProject,
  getProjects,
  type CreateProjectInput,
  type Project,
} from "../../api/projects";

import {
  addWorkspaceMember,
  createWorkspace,
  getWorkspaceById,
  getWorkspaces,
  removeWorkspaceMember,
  updateWorkspaceMember,
  type AddWorkspaceMemberInput,
  type AssignableWorkspaceRole,
  type CreateWorkspaceInput,
  type Workspace,
  type WorkspaceMember,
  type WorkspaceSummary,
} from "../../api/workspaces";

import { useAuth } from "../../hooks/useAuth";

import CreateProjectForm from "./CreateProjectForm";

import CreateWorkspaceForm from "./CreateWorkspaceForm";

import WorkspaceMembersPanel from "./WorkspaceMembersPanel";

const projectColors = [
  "bg-cyan-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
  "bg-blue-400",
];

function DashboardPage() {
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();

  const { accessToken } = useAuth();

  const requestedWorkspaceId = searchParams.get("workspace");

  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceSummary | null>(null);

  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace | null>(
    null,
  );

  const [projects, setProjects] = useState<Project[]>([]);

  const [analytics, setAnalytics] = useState<WorkspaceAnalytics | null>(null);

  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  const [loadingProjects, setLoadingProjects] = useState(false);

  const [loadingWorkspaceDetails, setLoadingWorkspaceDetails] = useState(false);

  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);

  const [showProjectForm, setShowProjectForm] = useState(false);

  const [showMembersPanel, setShowMembersPanel] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function loadWorkspaces(token: string) {
    const data = await getWorkspaces(token);

    const requested = requestedWorkspaceId
      ? data.find((workspace) => workspace.id === requestedWorkspaceId)
      : undefined;

    const nextWorkspace = requested ?? data[0] ?? null;

    setSelectedWorkspace(nextWorkspace);

    if (nextWorkspace && nextWorkspace.id !== requestedWorkspaceId) {
      setSearchParams(
        {
          workspace: nextWorkspace.id,
        },
        {
          replace: true,
        },
      );
    }
  }

  async function loadProjects(workspaceId: string, token: string) {
    const data = await getProjects(workspaceId, token);

    setProjects(data);
  }

  async function loadWorkspaceDetails(workspaceId: string, token: string) {
    const data = await getWorkspaceById(workspaceId, token);

    setWorkspaceDetails(data);

    return data;
  }

  async function loadAnalytics(workspaceId: string, token: string) {
    const data = await getWorkspaceAnalytics(workspaceId, token);

    setAnalytics(data);

    return data;
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

        const requested = requestedWorkspaceId
          ? data.find((workspace) => workspace.id === requestedWorkspaceId)
          : undefined;

        const nextWorkspace = requested ?? data[0] ?? null;

        setSelectedWorkspace(nextWorkspace);

        if (nextWorkspace && nextWorkspace.id !== requestedWorkspaceId) {
          setSearchParams(
            {
              workspace: nextWorkspace.id,
            },
            {
              replace: true,
            },
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
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
  }, [accessToken, requestedWorkspaceId, setSearchParams]);

  useEffect(() => {
    if (!selectedWorkspace || !accessToken) {
      setProjects([]);

      setWorkspaceDetails(null);

      setAnalytics(null);

      return;
    }

    const workspaceId = selectedWorkspace.id;

    const currentAccessToken = accessToken;

    let cancelled = false;

    async function loadSelectedWorkspace() {
      try {
        setLoadingProjects(true);

        setLoadingWorkspaceDetails(true);

        setLoadingAnalytics(true);

        setError(null);

        const [projectData, workspaceData, analyticsData] = await Promise.all([
          getProjects(workspaceId, currentAccessToken),

          getWorkspaceById(workspaceId, currentAccessToken),

          getWorkspaceAnalytics(workspaceId, currentAccessToken),
        ]);

        if (cancelled) {
          return;
        }

        setProjects(projectData);

        setWorkspaceDetails(workspaceData);

        setAnalytics(analyticsData);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load workspace",
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingProjects(false);

          setLoadingWorkspaceDetails(false);

          setLoadingAnalytics(false);
        }
      }
    }

    void loadSelectedWorkspace();

    return () => {
      cancelled = true;
    };
  }, [selectedWorkspace, accessToken]);

  async function handleCreateWorkspace(input: CreateWorkspaceInput) {
    if (!accessToken) {
      throw new Error("Authentication required");
    }

    const created = await createWorkspace(input, accessToken);

    await loadWorkspaces(accessToken);

    setSearchParams({
      workspace: created.id,
    });

    setShowWorkspaceForm(false);
  }

  async function handleCreateProject(input: CreateProjectInput) {
    if (!accessToken || !selectedWorkspace) {
      throw new Error("Workspace is required");
    }

    await createProject(selectedWorkspace.id, input, accessToken);

    await Promise.all([
      loadProjects(selectedWorkspace.id, accessToken),

      loadAnalytics(selectedWorkspace.id, accessToken),
    ]);

    setShowProjectForm(false);
  }

  async function handleAddMember(input: AddWorkspaceMemberInput) {
    if (!selectedWorkspace || !accessToken) {
      throw new Error("Workspace is required");
    }

    await addWorkspaceMember(selectedWorkspace.id, input, accessToken);

    await loadWorkspaceDetails(selectedWorkspace.id, accessToken);
  }

  async function handleUpdateMember(
    member: WorkspaceMember,
    role: AssignableWorkspaceRole,
  ) {
    if (!selectedWorkspace || !accessToken) {
      throw new Error("Workspace is required");
    }

    await updateWorkspaceMember(
      selectedWorkspace.id,
      member.id,
      {
        role,
      },
      accessToken,
    );

    await loadWorkspaceDetails(selectedWorkspace.id, accessToken);
  }

  async function handleRemoveMember(member: WorkspaceMember) {
    if (!selectedWorkspace || !accessToken) {
      throw new Error("Workspace is required");
    }

    await removeWorkspaceMember(selectedWorkspace.id, member.id, accessToken);

    await loadWorkspaceDetails(selectedWorkspace.id, accessToken);
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

    setShowMembersPanel(false);

    setShowWorkspaceForm(true);

    setError(null);
  }

  function handleStartProjectCreation() {
    setShowWorkspaceForm(false);

    setShowMembersPanel(false);

    setShowProjectForm(true);

    setError(null);
  }

  function handleStartMemberManagement() {
    setShowWorkspaceForm(false);

    setShowProjectForm(false);

    setShowMembersPanel(true);

    setError(null);
  }

  if (loadingWorkspaces) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-44 animate-pulse rounded bg-slate-800" />

        <div className="h-40 animate-pulse rounded-lg bg-slate-900/60" />

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-28 animate-pulse rounded-lg bg-slate-900/60"
            />
          ))}
        </div>
      </div>
    );
  }

  const canCreateProject =
    selectedWorkspace?.role === "OWNER" || selectedWorkspace?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-col gap-3 border-b border-slate-800/70 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-100">
            Dashboard
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Workspace performance, projects, and team activity.
          </p>
        </div>

        <button
          type="button"
          onClick={handleStartWorkspaceCreation}
          className="inline-flex items-center gap-1.5 self-start rounded-md bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          <span className="text-sm leading-none">+</span>
          New workspace
        </button>
      </header>

      {error && (
        <div className="mt-4 rounded-md border border-rose-900/60 bg-rose-950/30 px-3 py-2.5 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-5">
        {showWorkspaceForm && (
          <CreateWorkspaceForm
            onCreate={handleCreateWorkspace}
            onCancel={() => setShowWorkspaceForm(false)}
          />
        )}

        {showProjectForm && selectedWorkspace && (
          <CreateProjectForm
            onCreate={handleCreateProject}
            onCancel={() => setShowProjectForm(false)}
          />
        )}

        {showMembersPanel && workspaceDetails && (
          <WorkspaceMembersPanel
            workspace={workspaceDetails}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onRemoveMember={handleRemoveMember}
            onClose={() => setShowMembersPanel(false)}
          />
        )}

        {selectedWorkspace ? (
          <>
            <section className="rounded-lg border border-slate-800 bg-slate-900/35">
              <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-white">
                      {selectedWorkspace.name}
                    </h2>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                        selectedWorkspace.role === "OWNER"
                          ? "bg-violet-500/10 text-violet-300"
                          : selectedWorkspace.role === "ADMIN"
                            ? "bg-cyan-500/10 text-cyan-300"
                            : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {selectedWorkspace.role}
                    </span>
                  </div>

                  <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">
                    {selectedWorkspace.description ?? "No description"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleStartMemberManagement}
                    disabled={loadingWorkspaceDetails}
                    className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-slate-600 hover:text-white disabled:opacity-50"
                  >
                    Members
                  </button>

                  <button
                    type="button"
                    onClick={handleStartProjectCreation}
                    disabled={!canCreateProject}
                    className="rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600"
                  >
                    + New project
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-slate-800/70 px-4 py-3">
                <div>
                  <p className="text-[9px] uppercase tracking-wide text-slate-600">
                    Projects
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-200">
                    {analytics?.totalProjects ?? projects.length}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wide text-slate-600">
                    Active
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-emerald-400">
                    {analytics?.activeProjects ?? "—"}
                  </p>
                </div>

                <div>
                  <p className="text-[9px] uppercase tracking-wide text-slate-600">
                    Members
                  </p>

                  <p className="mt-0.5 text-sm font-semibold text-slate-200">
                    {workspaceDetails?.members.length ?? "—"}
                  </p>
                </div>
              </div>
            </section>

            <section>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  Workspace analytics
                </h3>

                <p className="mt-0.5 text-[10px] text-slate-600">
                  Live metrics across all projects in this workspace.
                </p>
              </div>

              {loadingAnalytics ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div
                      key={item}
                      className="h-24 animate-pulse rounded-lg bg-slate-900/60"
                    />
                  ))}
                </div>
              ) : analytics ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <article className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        Total issues
                      </p>

                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold text-white">
                      {analytics.totalIssues}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      Across all projects
                    </p>
                  </article>

                  <article className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                        To do
                      </p>

                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold text-slate-200">
                      {analytics.todoIssues}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      Waiting to start
                    </p>
                  </article>

                  <article className="rounded-lg border border-violet-500/10 bg-violet-500/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-violet-400">
                        In progress
                      </p>

                      <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-30" />

                        <span className="relative h-2 w-2 rounded-full bg-violet-400" />
                      </span>
                    </div>

                    <p className="mt-3 text-2xl font-semibold text-violet-300">
                      {analytics.inProgressIssues}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      Currently active
                    </p>
                  </article>

                  <article className="rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-emerald-400">
                        Done
                      </p>

                      <span className="text-xs text-emerald-400">✓</span>
                    </div>

                    <p className="mt-3 text-2xl font-semibold text-emerald-300">
                      {analytics.doneIssues}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      Completed issues
                    </p>
                  </article>

                  <article className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-cyan-400">
                      Completion
                    </p>

                    <div className="mt-3 flex items-end justify-between">
                      <p className="text-2xl font-semibold text-cyan-300">
                        {analytics.completionRate}%
                      </p>

                      <span className="text-[8px] text-slate-600">
                        {analytics.doneIssues}/{analytics.totalIssues}
                      </span>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                        style={{
                          width: `${analytics.completionRate}%`,
                        }}
                      />
                    </div>
                  </article>

                  <article
                    className={`rounded-lg border p-4 ${
                      analytics.overdueIssues > 0
                        ? "border-rose-500/20 bg-rose-500/[0.05]"
                        : "border-slate-800 bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-[9px] font-semibold uppercase tracking-wider ${
                          analytics.overdueIssues > 0
                            ? "text-rose-400"
                            : "text-slate-500"
                        }`}
                      >
                        Overdue
                      </p>

                      <span
                        className={`h-2 w-2 rounded-full ${
                          analytics.overdueIssues > 0
                            ? "bg-rose-400"
                            : "bg-emerald-400"
                        }`}
                      />
                    </div>

                    <p
                      className={`mt-3 text-2xl font-semibold ${
                        analytics.overdueIssues > 0
                          ? "text-rose-300"
                          : "text-slate-200"
                      }`}
                    >
                      {analytics.overdueIssues}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      Open issues past due
                    </p>
                  </article>

                  <article
                    className={`rounded-lg border p-4 ${
                      analytics.highPriorityIssues > 0
                        ? "border-amber-500/20 bg-amber-500/[0.05]"
                        : "border-slate-800 bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-amber-400">
                        High priority
                      </p>

                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold text-amber-300">
                      {analytics.highPriorityIssues}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      High + urgent open
                    </p>
                  </article>

                  <article className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-blue-400">
                        Projects
                      </p>

                      <span className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>

                    <p className="mt-3 text-2xl font-semibold text-blue-300">
                      {analytics.activeProjects}
                    </p>

                    <p className="mt-1 text-[9px] text-slate-600">
                      {analytics.archivedProjects} archived
                    </p>
                  </article>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-6 text-center text-xs text-slate-600">
                  Analytics are not available.
                </div>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Projects
                  </h3>

                  <p className="mt-0.5 text-[10px] text-slate-600">
                    Open a project to view its board.
                  </p>
                </div>

                <span className="text-[10px] text-slate-700">
                  {projects.length} total
                </span>
              </div>

              {loadingProjects ? (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-40 animate-pulse rounded-lg bg-slate-900"
                    />
                  ))}
                </div>
              ) : projects.length === 0 ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/25 px-6 py-10">
                  <div className="mx-auto max-w-sm text-center">
                    <p className="text-sm font-medium text-slate-300">
                      No projects in this workspace
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-600">
                      {canCreateProject
                        ? "Create the first project and start organizing work."
                        : "An owner or admin can create projects for this workspace."}
                    </p>

                    {canCreateProject && (
                      <button
                        type="button"
                        onClick={handleStartProjectCreation}
                        className="mt-4 rounded-md bg-blue-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-400"
                      >
                        Create project
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project, index) => (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => handleOpenProject(project)}
                      className="group overflow-hidden rounded-lg border border-slate-800 bg-slate-900/45 text-left transition hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-900/70"
                    >
                      <div
                        className={`h-1 ${
                          projectColors[index % projectColors.length]
                        }`}
                      />

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="truncate text-sm font-semibold text-slate-100">
                            {project.name}
                          </h4>

                          <span
                            className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${
                              project.status === "ACTIVE"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-slate-800 text-slate-500"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">
                          {project.description ?? "No project description."}
                        </p>

                        <div className="mt-4 border-t border-slate-800/70 pt-3">
                          <span className="text-[10px] font-medium text-cyan-400 transition group-hover:text-cyan-300">
                            Open board →
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-lg border border-slate-800 bg-slate-900/25 px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-300">
              No workspace available
            </p>

            <p className="mt-1 text-xs text-slate-600">
              Create a workspace to start organizing projects.
            </p>

            <button
              type="button"
              onClick={handleStartWorkspaceCreation}
              className="mt-4 rounded-md bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Create workspace
            </button>
          </section>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
