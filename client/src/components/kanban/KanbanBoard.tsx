import {
  DndContext,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";

import type { Issue, IssueStatus } from "../../api/issues";

import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  issues: Issue[];

  onMoveIssue: (
    issueId: string,
    status: IssueStatus,
    position: number,
  ) => Promise<void>;

  onEditIssue: (issue: Issue) => void;
}

const statuses: IssueStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function KanbanBoard({ issues, onMoveIssue, onEditIssue }: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      return;
    }

    const issueId = String(active.id);

    const issue = issues.find((item) => item.id === issueId);

    if (!issue) {
      return;
    }

    let targetStatus: IssueStatus;
    let targetPosition: number;

    const overId = String(over.id);

    if (statuses.includes(overId as IssueStatus)) {
      targetStatus = overId as IssueStatus;

      const targetIssues = issues
        .filter((item) => item.status === targetStatus && item.id !== issueId)
        .sort((a, b) => a.position - b.position);

      targetPosition = targetIssues.length;
    } else {
      const overIssue = issues.find((item) => item.id === overId);

      if (!overIssue) {
        return;
      }

      targetStatus = overIssue.status;

      const targetIssues = issues
        .filter((item) => item.status === targetStatus && item.id !== issueId)
        .sort((a, b) => a.position - b.position);

      const index = targetIssues.findIndex((item) => item.id === overIssue.id);

      targetPosition = index >= 0 ? index : targetIssues.length;
    }

    if (issue.status === targetStatus && issue.position === targetPosition) {
      return;
    }

    await onMoveIssue(issueId, targetStatus, targetPosition);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
    >
      <div className="grid gap-5 lg:grid-cols-3">
        <KanbanColumn
          title="To Do"
          status="TODO"
          issues={issues}
          onEditIssue={onEditIssue}
        />

        <KanbanColumn
          title="In Progress"
          status="IN_PROGRESS"
          issues={issues}
          onEditIssue={onEditIssue}
        />

        <KanbanColumn
          title="Done"
          status="DONE"
          issues={issues}
          onEditIssue={onEditIssue}
        />
      </div>
    </DndContext>
  );
}

export default KanbanBoard;
