import type { Label } from "../../api/labels";

import type { WorkspaceMember } from "../../api/workspaces";

export type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "DONE";

export type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type DueDateFilter =
  | "ALL"
  | "OVERDUE"
  | "TODAY"
  | "NEXT_7_DAYS"
  | "NO_DUE_DATE";

export type SortOption =
  | "BOARD"
  | "PRIORITY"
  | "DUE_DATE"
  | "UPDATED_DESC"
  | "UPDATED_ASC"
  | "TITLE";

interface BoardFiltersProps {
  searchText: string;
  statusFilter: StatusFilter;
  priorityFilter: PriorityFilter;
  dueDateFilter: DueDateFilter;
  assigneeFilter: string;
  labelFilter: string;
  sortOption: SortOption;
  myIssuesOnly: boolean;
  members: WorkspaceMember[];
  labels: Label[];
  filteredCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: StatusFilter) => void;
  onPriorityChange: (value: PriorityFilter) => void;
  onDueDateChange: (value: DueDateFilter) => void;
  onAssigneeChange: (value: string) => void;
  onLabelChange: (value: string) => void;
  onSortChange: (value: SortOption) => void;
  onMyIssuesChange: (value: boolean) => void;
  onClear: () => void;
}

const controlClasses =
  "h-9 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 text-xs text-slate-300 outline-none transition focus:border-cyan-500/60";

function BoardFilters({
  searchText,
  statusFilter,
  priorityFilter,
  dueDateFilter,
  assigneeFilter,
  labelFilter,
  sortOption,
  myIssuesOnly,
  members,
  labels,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onDueDateChange,
  onAssigneeChange,
  onLabelChange,
  onSortChange,
  onMyIssuesChange,
  onClear,
}: BoardFiltersProps) {
  const hasFilters =
    searchText.trim().length > 0 ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    dueDateFilter !== "ALL" ||
    assigneeFilter !== "ALL" ||
    labelFilter !== "ALL" ||
    sortOption !== "BOARD" ||
    myIssuesOnly;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-medium text-slate-400">{filteredCount}</span>

          <span className="text-slate-700">/</span>

          <span className="text-slate-600">{totalCount} issues</span>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="text-[10px] font-medium text-cyan-400 transition hover:text-cyan-300"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />

            <path d="m16 16 4 4" />
          </svg>

          <input
            id="issue-search"
            type="text"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search issues"
            className={`${controlClasses} w-full pl-9`}
          />
        </div>

        <select
          id="status-filter"
          value={statusFilter}
          onChange={(event) =>
            onStatusChange(event.target.value as StatusFilter)
          }
          className={`${controlClasses} w-full`}
        >
          <option value="ALL">All statuses</option>

          <option value="TODO">To do</option>

          <option value="IN_PROGRESS">In progress</option>

          <option value="DONE">Done</option>
        </select>

        <select
          id="priority-filter"
          value={priorityFilter}
          onChange={(event) =>
            onPriorityChange(event.target.value as PriorityFilter)
          }
          className={`${controlClasses} w-full`}
        >
          <option value="ALL">All priorities</option>

          <option value="LOW">Low</option>

          <option value="MEDIUM">Medium</option>

          <option value="HIGH">High</option>

          <option value="URGENT">Urgent</option>
        </select>

        <select
          id="due-date-filter"
          value={dueDateFilter}
          onChange={(event) =>
            onDueDateChange(event.target.value as DueDateFilter)
          }
          className={`${controlClasses} w-full`}
        >
          <option value="ALL">All deadlines</option>

          <option value="OVERDUE">Overdue</option>

          <option value="TODAY">Due today</option>

          <option value="NEXT_7_DAYS">Next 7 days</option>

          <option value="NO_DUE_DATE">No due date</option>
        </select>

        <select
          id="assignee-filter"
          value={assigneeFilter}
          onChange={(event) => onAssigneeChange(event.target.value)}
          className={`${controlClasses} w-full`}
        >
          <option value="ALL">All assignees</option>

          <option value="UNASSIGNED">Unassigned</option>

          {members.map((member) => (
            <option key={member.user.id} value={member.user.id}>
              {member.user.name}
            </option>
          ))}
        </select>

        <select
          id="label-filter"
          value={labelFilter}
          onChange={(event) => onLabelChange(event.target.value)}
          className={`${controlClasses} w-full`}
        >
          <option value="ALL">All labels</option>

          {labels.map((label) => (
            <option key={label.id} value={label.id}>
              {label.name}
            </option>
          ))}
        </select>

        <select
          id="sort-filter"
          value={sortOption}
          onChange={(event) => onSortChange(event.target.value as SortOption)}
          className={`${controlClasses} w-full`}
        >
          <option value="BOARD">Board order</option>

          <option value="PRIORITY">Priority</option>

          <option value="DUE_DATE">Due date</option>

          <option value="UPDATED_DESC">Recently updated</option>

          <option value="UPDATED_ASC">Oldest updated</option>

          <option value="TITLE">Title A–Z</option>
        </select>

        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/70 px-3">
          <input
            type="checkbox"
            checked={myIssuesOnly}
            onChange={(event) => onMyIssuesChange(event.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 accent-cyan-400"
          />

          <span className="text-xs text-slate-400">My issues</span>
        </label>
      </div>
    </section>
  );
}

export default BoardFilters;
