import type { TaskStatus } from "../types/task.types";

export const TASK_STATUS_UI: Record<
  TaskStatus,
  { label: string; badgeClassName: string; selectClassName: string }
> = {
  pending: {
    label: "Todo",
    badgeClassName: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
    selectClassName:
      "bg-slate-50 text-slate-900 border-slate-200 focus:border-slate-300 focus:ring-slate-500/20",
  },
  in_progress: {
    label: "In Progress",
    badgeClassName: "bg-violet-50 text-violet-800 ring-1 ring-violet-200/80",
    selectClassName:
      "bg-violet-50 text-violet-900 border-violet-200 focus:border-violet-300 focus:ring-violet-500/20",
  },
  review: {
    label: "Review",
    badgeClassName: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
    selectClassName:
      "bg-amber-50 text-amber-950 border-amber-200 focus:border-amber-300 focus:ring-amber-500/20",
  },
  completed: {
    label: "Done",
    badgeClassName:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
    selectClassName:
      "bg-emerald-50 text-emerald-950 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-500/20",
  },
};

export const TASK_STATUS_OPTIONS: Array<{ label: string; value: TaskStatus }> = (
  Object.entries(TASK_STATUS_UI) as Array<[TaskStatus, (typeof TASK_STATUS_UI)[TaskStatus]]>
).map(([value, meta]) => ({ value, label: meta.label }));

export function taskStatusSelectClass(status: TaskStatus) {
  return TASK_STATUS_UI[status].selectClassName;
}

