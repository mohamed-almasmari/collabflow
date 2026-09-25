import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import { useState } from "react";

import type { Issue, IssueStatus } from "../../api/issues";

import type { IssueActivity } from "../../socket/socket";

import IssueCard from "./IssueCard";
import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  issues: Issue[];

  activities: IssueActivity[];

  onMoveIssue: (
    issueId: string,
    status: IssueStatus,
    position: number,
  ) => Promise<void>;

  onCommentsIssue: (issue: Issue) => void;

  onEditIssue: (issue: Issue) => void;

  onDeleteIssue: (issue: Issue) => void;

  onDragActivity: (issueId: string, active: boolean) => void;
}

const columnOrder: IssueStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function KanbanBoard({
  issues,
  activities,
  onMoveIssue,
  onCommentsIssue,
  onEditIssue,
  onDeleteIssue,
  onDragActivity,
}: KanbanBoardProps) {
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  );

  function getIssuesByStatus(status: IssueStatus) {
    return issues.filter((issue) => issue.status === status);
  }

  function handleDragStart(event: DragStartEvent) {
    const issue = issues.find(
      (currentIssue) => currentIssue.id === event.active.id,
    );

    if (!issue) {
      return;
    }

    setActiveIssue(issue);

    onDragActivity(issue.id, true);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    const draggedIssue = issues.find((issue) => issue.id === active.id);

    if (draggedIssue) {
      onDragActivity(draggedIssue.id, false);
    }

    setActiveIssue(null);

    if (!over || !draggedIssue) {
      return;
    }

    let targetStatus: IssueStatus;

    let targetPosition: number;

    const overIssue = issues.find((issue) => issue.id === over.id);

    if (overIssue) {
      targetStatus = overIssue.status;

      const targetIssues = getIssuesByStatus(targetStatus);

      const overIndex = targetIssues.findIndex(
        (issue) => issue.id === overIssue.id,
      );

      targetPosition = overIndex >= 0 ? overIndex : targetIssues.length;
    } else {
      const possibleStatus = String(over.id) as IssueStatus;

      if (!columnOrder.includes(possibleStatus)) {
        return;
      }

      targetStatus = possibleStatus;

      targetPosition = getIssuesByStatus(targetStatus).length;
    }

    const sourceIssues = getIssuesByStatus(draggedIssue.status);

    const sourceIndex = sourceIssues.findIndex(
      (issue) => issue.id === draggedIssue.id,
    );

    if (
      draggedIssue.status === targetStatus &&
      sourceIndex === targetPosition
    ) {
      return;
    }

    if (draggedIssue.status === targetStatus && sourceIndex < targetPosition) {
      targetPosition -= 1;
    }

    targetPosition = Math.max(0, targetPosition);

    await onMoveIssue(draggedIssue.id, targetStatus, targetPosition);
  }

  function handleDragCancel() {
    if (activeIssue) {
      onDragActivity(activeIssue.id, false);
    }

    setActiveIssue(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={(event) => {
        void handleDragEnd(event);
      }}
      onDragCancel={handleDragCancel}
    >
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <KanbanColumn
          title="To do"
          status="TODO"
          accent="slate"
          issues={getIssuesByStatus("TODO")}
          activities={activities}
          onCommentsIssue={onCommentsIssue}
          onEditIssue={onEditIssue}
          onDeleteIssue={onDeleteIssue}
          onDragActivity={onDragActivity}
        />

        <KanbanColumn
          title="In progress"
          status="IN_PROGRESS"
          accent="violet"
          issues={getIssuesByStatus("IN_PROGRESS")}
          activities={activities}
          onCommentsIssue={onCommentsIssue}
          onEditIssue={onEditIssue}
          onDeleteIssue={onDeleteIssue}
          onDragActivity={onDragActivity}
        />

        <KanbanColumn
          title="Done"
          status="DONE"
          accent="emerald"
          issues={getIssuesByStatus("DONE")}
          activities={activities}
          onCommentsIssue={onCommentsIssue}
          onEditIssue={onEditIssue}
          onDeleteIssue={onDeleteIssue}
          onDragActivity={onDragActivity}
        />
      </div>

      <DragOverlay>
        {activeIssue ? (
          <div className="w-[290px] rotate-1 opacity-95 shadow-2xl shadow-black/40">
            <IssueCard
              issue={activeIssue}
              activities={[]}
              onComments={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onDragActivity={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default KanbanBoard;
