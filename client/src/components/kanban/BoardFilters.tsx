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
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Board Filters</h2>

          <p className="mt-1 text-sm text-slate-500">
            Showing{" "}
            <span className="font-medium text-slate-300">{filteredCount}</span>{" "}
            of <span className="font-medium text-slate-300">{totalCount}</span>{" "}
            issues
          </p>
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label
            htmlFor="issue-search"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Search
          </label>

          <input
            id="issue-search"
            type="search"
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search issues..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
          />
        </div>

        <div>
          <label
            htmlFor="status-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Status
          </label>

          <select
            id="status-filter"
            value={statusFilter}
            onChange={(event) =>
              onStatusChange(event.target.value as StatusFilter)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">All statuses</option>

            <option value="TODO">To Do</option>

            <option value="IN_PROGRESS">In Progress</option>

            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="priority-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Priority
          </label>

          <select
            id="priority-filter"
            value={priorityFilter}
            onChange={(event) =>
              onPriorityChange(event.target.value as PriorityFilter)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">All priorities</option>

            <option value="LOW">Low</option>

            <option value="MEDIUM">Medium</option>

            <option value="HIGH">High</option>

            <option value="URGENT">Urgent</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="due-date-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Deadline
          </label>

          <select
            id="due-date-filter"
            value={dueDateFilter}
            onChange={(event) =>
              onDueDateChange(event.target.value as DueDateFilter)
            }
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">All deadlines</option>

            <option value="OVERDUE">Overdue</option>

            <option value="TODAY">Due today</option>

            <option value="NEXT_7_DAYS">Due next 7 days</option>

            <option value="NO_DUE_DATE">No due date</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="assignee-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Assignee
          </label>

          <select
            id="assignee-filter"
            value={assigneeFilter}
            onChange={(event) => onAssigneeChange(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">All assignees</option>

            <option value="UNASSIGNED">Unassigned</option>

            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="label-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Label
          </label>

          <select
            id="label-filter"
            value={labelFilter}
            onChange={(event) => onLabelChange(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="ALL">All labels</option>

            {labels.map((label) => (
              <option key={label.id} value={label.id}>
                {label.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="sort-filter"
            className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            Sort
          </label>

          <select
            id="sort-filter"
            value={sortOption}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
          >
            <option value="BOARD">Board order</option>

            <option value="PRIORITY">Priority</option>

            <option value="DUE_DATE">Due date</option>

            <option value="UPDATED_DESC">Recently updated</option>

            <option value="UPDATED_ASC">Oldest updated</option>

            <option value="TITLE">Title A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-4 border-t border-slate-800 pt-4">
        <label className="inline-flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={myIssuesOnly}
            onChange={(event) => onMyIssuesChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-950"
          />

          <div>
            <span className="text-sm font-medium text-slate-200">
              My Issues
            </span>

            <p className="text-xs text-slate-500">
              Only show issues assigned to me
            </p>
          </div>
        </label>
      </div>
    </section>
  );
}

export default BoardFilters;
