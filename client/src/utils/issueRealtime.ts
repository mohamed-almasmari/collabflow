import type {
  Issue,
  IssueStatus,
} from "../api/issues";

function normalizeColumn(
  issues: Issue[],
  status: IssueStatus,
): Issue[] {
  const columnIssues = issues
    .filter(
      (issue) =>
        issue.status === status,
    )
    .sort(
      (a, b) =>
        a.position - b.position,
    )
    .map(
      (issue, index) => ({
        ...issue,
        position: index,
      }),
    );

  const otherIssues =
    issues.filter(
      (issue) =>
        issue.status !== status,
    );

  return [
    ...otherIssues,
    ...columnIssues,
  ];
}

export function addRealtimeIssue(
  issues: Issue[],
  newIssue: Issue,
): Issue[] {
  const exists =
    issues.some(
      (issue) =>
        issue.id === newIssue.id,
    );

  if (exists) {
    return issues.map(
      (issue) =>
        issue.id === newIssue.id
          ? newIssue
          : issue,
    );
  }

  return normalizeColumn(
    [
      ...issues,
      newIssue,
    ],
    newIssue.status,
  );
}

export function updateRealtimeIssue(
  issues: Issue[],
  updatedIssue: Issue,
): Issue[] {
  const currentIssue =
    issues.find(
      (issue) =>
        issue.id ===
        updatedIssue.id,
    );

  if (!currentIssue) {
    return addRealtimeIssue(
      issues,
      updatedIssue,
    );
  }

  if (
    currentIssue.status !==
    updatedIssue.status
  ) {
    return moveRealtimeIssue(
      issues,
      updatedIssue,
    );
  }

  return issues.map(
    (issue) =>
      issue.id ===
      updatedIssue.id
        ? updatedIssue
        : issue,
  );
}

export function moveRealtimeIssue(
  issues: Issue[],
  movedIssue: Issue,
): Issue[] {
  const currentIssue =
    issues.find(
      (issue) =>
        issue.id ===
        movedIssue.id,
    );

  const withoutMoved =
    issues.filter(
      (issue) =>
        issue.id !==
        movedIssue.id,
    );

  if (!currentIssue) {
    return addRealtimeIssue(
      issues,
      movedIssue,
    );
  }

  const oldStatus =
    currentIssue.status;

  const newStatus =
    movedIssue.status;

  let workingIssues =
    normalizeColumn(
      withoutMoved,
      oldStatus,
    );

  const targetColumn =
    workingIssues
      .filter(
        (issue) =>
          issue.status ===
          newStatus,
      )
      .sort(
        (a, b) =>
          a.position -
          b.position,
      );

  const otherIssues =
    workingIssues.filter(
      (issue) =>
        issue.status !==
        newStatus,
    );

  const targetPosition =
    Math.max(
      0,
      Math.min(
        movedIssue.position,
        targetColumn.length,
      ),
    );

  targetColumn.splice(
    targetPosition,
    0,
    movedIssue,
  );

  const normalizedTargetColumn =
    targetColumn.map(
      (issue, index) => ({
        ...issue,
        position: index,
      }),
    );

  workingIssues = [
    ...otherIssues,
    ...normalizedTargetColumn,
  ];

  if (
    oldStatus === newStatus
  ) {
    return normalizeColumn(
      workingIssues,
      newStatus,
    );
  }

  return normalizeColumn(
    normalizeColumn(
      workingIssues,
      oldStatus,
    ),
    newStatus,
  );
}

export function deleteRealtimeIssue(
  issues: Issue[],
  issueId: string,
): Issue[] {
  const deletedIssue =
    issues.find(
      (issue) =>
        issue.id === issueId,
    );

  if (!deletedIssue) {
    return issues;
  }

  return normalizeColumn(
    issues.filter(
      (issue) =>
        issue.id !== issueId,
    ),
    deletedIssue.status,
  );
}