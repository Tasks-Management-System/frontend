/** Completed tasks older than this are treated as hidden from default lists. */
export const HIDE_COMPLETED_AFTER_MS = 24 * 60 * 60 * 1000;

type TaskLike = {
  status?: string;
  updatedAt?: string | null;
};

/** True if this row looks like a completed task and was last updated ≥24h ago. */
export function isStaleCompletedTask(row: TaskLike, now = Date.now()): boolean {
  if (row.status !== "completed") return false;
  if (!row.updatedAt) return false;
  const t = new Date(row.updatedAt).getTime();
  if (Number.isNaN(t)) return false;
  return now - t >= HIDE_COMPLETED_AFTER_MS;
}

/** Drops completed tasks whose `updatedAt` is at least 24h ago (e.g. after marking Done). */
export function withoutStaleCompletedTasks<T extends TaskLike>(rows: T[]): T[] {
  return rows.filter((r) => !isStaleCompletedTask(r));
}
