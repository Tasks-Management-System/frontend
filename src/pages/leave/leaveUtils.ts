import type { LeaveRecord } from "../../types/leave.types";

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export function formatDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function leaveDurationLabel(l: LeaveRecord): string {
  if (l.subType === "halfDay") return "Half day";
  if (l.days === "single") return "1 day";
  const from = new Date(l.fromDate);
  const to = new Date(l.toDate || l.fromDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "—";
  const diff =
    Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return `${diff} days`;
}

export function applicantName(leave: LeaveRecord): string {
  const u = leave.user;
  if (typeof u === "object" && u !== null && "name" in u) {
    return (u as { name?: string }).name ?? "—";
  }
  return "—";
}
