import type { Issue } from "../api/issues";

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (
    stringValue.includes(",") ||
    stringValue.includes('"') ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

function formatFileName(projectName: string) {
  const safeName = projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const date = new Date().toISOString().slice(0, 10);

  return `${safeName || "project"}-issues-${date}.csv`;
}

export function exportIssuesToCsv(issues: Issue[], projectName: string) {
  const headers = [
    "ID",
    "Title",
    "Description",
    "Status",
    "Priority",
    "Position",
    "Assignee",
    "Assignee Email",
    "Created By",
    "Created At",
    "Updated At",
  ];

  const rows = issues.map((issue) => [
    issue.id,

    issue.title,

    issue.description ?? "",

    issue.status,

    issue.priority,

    issue.position,

    issue.assignee?.name ?? "Unassigned",

    issue.assignee?.email ?? "",

    issue.createdBy?.name ?? "",

    issue.createdAt,

    issue.updatedAt,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");

  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");

  anchor.href = url;

  anchor.download = formatFileName(projectName);

  document.body.appendChild(anchor);

  anchor.click();

  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}
