import type { Issue } from "../../api/issues";

import KanbanColumn from "./KanbanColumn";

interface KanbanBoardProps {
  issues: Issue[];
}

function KanbanBoard({
  issues,
}: KanbanBoardProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <KanbanColumn
        title="To Do"
        status="TODO"
        issues={issues}
      />

      <KanbanColumn
        title="In Progress"
        status="IN_PROGRESS"
        issues={issues}
      />

      <KanbanColumn
        title="Done"
        status="DONE"
        issues={issues}
      />
    </div>
  );
}

export default KanbanBoard;