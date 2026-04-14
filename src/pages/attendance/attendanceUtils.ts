import type { AttendanceBreak, AttendanceRecord } from "../../types/attendance.types";
import { localYmd } from "../../apis/api/attendance";

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

export function formatClock(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return timeFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatMs(ms?: number): string {
  if (ms === undefined || ms === null || Number.isNaN(ms) || ms < 0) return "—";
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h) return `${h}h ${min}m`;
  return `${min}m`;
}

export function breakLineText(b: AttendanceBreak): string {
  const start = formatClock(b.breakStart ?? null);
  const end = b.breakEnd ? formatClock(b.breakEnd) : "ongoing";
  const dur =
    b.totalBreakTime !== undefined && b.totalBreakTime !== null
      ? ` (${formatMs(b.totalBreakTime)})`
      : "";
  return `${start} – ${end}${dur}`;
}

export function userLabel(record: AttendanceRecord): string {
  const u = record.user;
  if (typeof u === "object" && u !== null && "name" in u) {
    return (u as { name?: string }).name ?? "—";
  }
  return "—";
}

export function recordUserId(record: AttendanceRecord): string {
  const u = record.user;
  if (typeof u === "object" && u !== null && "_id" in u) {
    return String((u as { _id: string })._id);
  }
  if (typeof u === "string") return u;
  return "";
}

export function recordDateYmd(record: AttendanceRecord): string {
  if (!record.date) return "";
  try {
    return localYmd(new Date(record.date));
  } catch {
    return "";
  }
}

export function shortDayHeading(ymd: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d) return ymd;
  const dt = new Date(y, mo - 1, d);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dt);
}
