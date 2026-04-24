import { CalendarDays, UserRound } from "lucide-react";
import { TASK_STATUS_UI } from "../../constants/taskStatus";
import type { Task } from "../../types/task.types";
import { formatDue, taskAssigneeName, taskProjectName } from "./taskUtils";

interface TaskCardProps {
  task: Task;
  onStatusChange?: (id: string, status: string) => void;
  updating?: boolean;
  currentUserId?: string;
  isDragging?: boolean;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onTaskClick?: (task: Task) => void;
}

export function TaskCard({
  task,
  currentUserId,
  isDragging,
  onDragStart,
  onDragEnd,
  onTaskClick,
}: TaskCardProps) {
  const assignee = taskAssigneeName(task, currentUserId);
  const projectName = taskProjectName(task);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => onTaskClick?.(task)}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.03] transition active:cursor-grabbing ${
        isDragging
          ? "opacity-40 shadow-none"
          : "hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/80 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">{projectName}</p>
          <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">{task.taskName}</h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TASK_STATUS_UI[task.status].badgeClassName}`}
        >
          {TASK_STATUS_UI[task.status].label}
        </span>
      </div>
      {task.description ? (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">{task.description}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-400 italic">No description</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />
          {assignee}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          {formatDue(task.dueDate)}
        </span>
      </div>
      {/* <div
        className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="sr-only" htmlFor={`status-${task._id}`}>
          Change status
        </label>
        <select
          id={`status-${task._id}`}
          disabled={updating}
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value as TaskStatus)}
          className={`w-full max-w-[200px] rounded-lg border px-2 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50 ${taskStatusSelectClass(task.status)}`}
        >
          {TASK_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {updating ? <Loader2 className="h-4 w-4 animate-spin text-violet-600" /> : null}
      </div> */}
    </article>
  );
}
