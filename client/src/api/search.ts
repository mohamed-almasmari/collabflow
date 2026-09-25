import { getIssues, type Issue } from "./issues";

import { getProjects, type Project } from "./projects";

import { getWorkspaces, type WorkspaceSummary } from "./workspaces";

export interface SearchProjectResult {
  type: "PROJECT";

  id: string;

  name: string;

  description: string | null;

  status: Project["status"];

  workspaceId: string;

  workspaceName: string;

  projectId: string;

  projectName: string;
}

export interface SearchIssueResult {
  type: "ISSUE";

  id: string;

  name: string;

  description: string | null;

  status: Issue["status"];

  priority: Issue["priority"];

  workspaceId: string;

  workspaceName: string;

  projectId: string;

  projectName: string;
}

export type GlobalSearchResult = SearchProjectResult | SearchIssueResult;

export interface SearchCatalog {
  projects: SearchProjectResult[];

  issues: SearchIssueResult[];
}

async function loadProjectIssues(
  workspace: WorkspaceSummary,
  project: Project,
  accessToken: string,
): Promise<SearchIssueResult[]> {
  try {
    const issues = await getIssues(workspace.id, project.id, accessToken);

    return issues.map((issue) => ({
      type: "ISSUE" as const,

      id: issue.id,

      name: issue.title,

      description: issue.description,

      status: issue.status,

      priority: issue.priority,

      workspaceId: workspace.id,

      workspaceName: workspace.name,

      projectId: project.id,

      projectName: project.name,
    }));
  } catch {
    return [];
  }
}

export async function loadSearchCatalog(
  accessToken: string,
): Promise<SearchCatalog> {
  const workspaces = await getWorkspaces(accessToken);

  const projectGroups = await Promise.all(
    workspaces.map(async (workspace) => {
      try {
        const projects = await getProjects(workspace.id, accessToken);

        return {
          workspace,

          projects,
        };
      } catch {
        return {
          workspace,

          projects: [],
        };
      }
    }),
  );

  const projects: SearchProjectResult[] = [];

  const issueRequests: Promise<SearchIssueResult[]>[] = [];

  for (const group of projectGroups) {
    for (const project of group.projects) {
      projects.push({
        type: "PROJECT",

        id: project.id,

        name: project.name,

        description: project.description,

        status: project.status,

        workspaceId: group.workspace.id,

        workspaceName: group.workspace.name,

        projectId: project.id,

        projectName: project.name,
      });

      issueRequests.push(
        loadProjectIssues(group.workspace, project, accessToken),
      );
    }
  }

  const issueGroups = await Promise.all(issueRequests);

  return {
    projects,

    issues: issueGroups.flat(),
  };
}

export function searchCatalog(
  catalog: SearchCatalog,
  query: string,
  limit = 8,
): GlobalSearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  const projectMatches = catalog.projects.filter(
    (project) =>
      project.name.toLowerCase().includes(normalizedQuery) ||
      project.description?.toLowerCase().includes(normalizedQuery) ||
      project.workspaceName.toLowerCase().includes(normalizedQuery),
  );

  const issueMatches = catalog.issues.filter(
    (issue) =>
      issue.name.toLowerCase().includes(normalizedQuery) ||
      issue.description?.toLowerCase().includes(normalizedQuery) ||
      issue.projectName.toLowerCase().includes(normalizedQuery) ||
      issue.workspaceName.toLowerCase().includes(normalizedQuery) ||
      issue.priority.toLowerCase().includes(normalizedQuery) ||
      issue.status.toLowerCase().includes(normalizedQuery),
  );

  return [...projectMatches, ...issueMatches].slice(0, limit);
}
