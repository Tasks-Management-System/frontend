import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { TASK_STATUS_OPTIONS, taskStatusSelectClass } from "../../constants/taskStatus";
import type { Task, TaskStatus, TasksListResponse } from "../../types/task.types";
import { formatDue, taskAssigneeName, taskProjectName } from "./taskUtils";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

interface ListViewProps {
  tasks: Task[];
  pagination: TasksListResponse["pagination"] | undefined;
  taskListPage: number;
  taskListLimit: number;
  tableRangeLabel: string;
  updatingId: string | null;
  currentUserId?: string;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onTaskClick?: (task: Task) => void;
}

export function ListView({
  tasks,
  pagination,
  taskListLimit,
  tableRangeLabel,
  updatingId,
  currentUserId,
  onStatusChange,
  onPageChange,
  onLimitChange,
  onTaskClick,
}: ListViewProps) {
  return (
    <div className="space-y-10">
      <section className="space-y-3" aria-labelledby="tasks-list-table-title">
        <h3
          id="tasks-list-table-title"
          className="text-lg font-semibold tracking-tight text-gray-900"
        >
          Task list
        </h3>
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-4 py-3.5">Project</th>
                  <th scope="col" className="px-4 py-3.5">Task</th>
                  <th scope="col" className="px-4 py-3.5">Description</th>
                  <th scope="col" className="px-4 py-3.5">Assignee</th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Due</th>
                  <th scope="col" className="px-4 py-3.5 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">
                      No tasks on this page. Use the arrows or change rows per page.
                    </td>
                  </tr>
                ) : null}
                {tasks.map((task) => (
                  <tr
                    key={`row-${task._id}`}
                    onClick={() => onTaskClick?.(task)}
                    className="cursor-pointer transition-colors hover:bg-violet-50/40"
                  >
                    <td className="px-4 py-3 align-top">
                      <span className="font-medium text-gray-700">{taskProjectName(task)}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-semibold text-gray-900">{task.taskName}</span>
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top text-gray-600">
                      <span className="line-clamp-2">
                        {task.description?.trim() ? task.description : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-gray-700">
                      {taskAssigneeName(task, currentUserId)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 align-top text-gray-600">
                      {formatDue(task.dueDate)}
                    </td>
                    <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <label className="sr-only" htmlFor={`table-status-${task._id}`}>
                          Status for {task.taskName}
                        </label>
                        <select
                          id={`table-status-${task._id}`}
                          disabled={updatingId === task._id}
                          value={task.status}
                          onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
                          className={`min-w-[8.5rem] rounded-lg border px-2 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${taskStatusSelectClass(task.status)}`}
                        >
                          {TASK_STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {updatingId === task._id ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <span className="text-gray-500">Rows per page</span>
              <select
                value={taskListLimit}
                onChange={(e) => {
                  onLimitChange(Number(e.target.value));
                }}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                aria-label="Rows per page"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-600 tabular-nums">{tableRangeLabel}</p>
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                disabled={pagination?.previousPage == null}
                onClick={() => {
                  const prev = pagination?.previousPage;
                  if (prev != null) onPageChange(prev);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[4.5rem] px-2 text-center text-xs font-medium text-gray-500 tabular-nums">
                {pagination?.totalPages
                  ? `${pagination.currentPage} / ${pagination.totalPages}`
                  : "—"}
              </span>
              <button
                type="button"
                disabled={pagination?.nextPage == null}
                onClick={() => {
                  const next = pagination?.nextPage;
                  if (next != null) onPageChange(next);
                }}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
