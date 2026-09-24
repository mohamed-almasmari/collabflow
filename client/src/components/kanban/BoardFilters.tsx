import type { WorkspaceMember } from "../../api/workspaces";

type StatusFilter = "ALL" | "TODO" | "IN_PROGRESS" | "DONE";

type PriorityFilter = "ALL" | "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface BoardFiltersProps {
  searchText: string;

  statusFilter: StatusFilter;

  priorityFilter: PriorityFilter;

  assigneeFilter: string;

  members: WorkspaceMember[];

  filteredCount: number;

  totalCount: number;

  onSearchChange: (value: string) => void;

  onStatusChange: (value: StatusFilter) => void;

  onPriorityChange: (value: PriorityFilter) => void;

  onAssigneeChange: (value: string) => void;

  onClear: () => void;
}

function BoardFilters({
  searchText,
  statusFilter,
  priorityFilter,
  assigneeFilter,
  members,
  filteredCount,
  totalCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onClear,
}: BoardFiltersProps) {
  const hasFilters =
    searchText.trim().length > 0 ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL";

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
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500"
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
      </div>
    </section>
  );
}

export default BoardFilters;
