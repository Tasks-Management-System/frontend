import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { api } from "../apis/apiService";
import { apiPath } from "../apis/apiPath";
import type { LeaveRecord } from "../types/leave.types";
import {
  type CalendarEvent,
  type CalendarEventType,
  type CalendarSource,
  EVENT_COLORS,
} from "../types/calendar.types";

function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function overlapsRange(aStart: Date, aEnd: Date, rStart: Date, rEnd: Date) {
  return aEnd >= rStart && aStart <= rEnd;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

type ApiCalendarEvent = {
  _id?: string;
  occurrenceId?: string;
  seriesId?: string;
  title?: string;
  type?: CalendarEventType;
  start?: string;
  end?: string;
  allDay?: boolean;
  location?: string;
  description?: string;
  color?: string;
  attendees?: { userId?: string; name?: string; email?: string }[];
  createdBy?: { _id: string; name?: string; email?: string } | string;
  recurrence?: string;
  reminderMinutes?: number;
  reminderSent?: boolean;
  visibleToTeam?: boolean;
};

type TaskRow = {
  _id: string;
  taskName?: string;
  description?: string;
  dueDate?: string | null;
  priority?: string;
  status?: string;
};

type AttendanceRow = {
  _id: string;
  date?: string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  user?: { name?: string; email?: string };
};

/**
 * Maps API / merged raw rows into a single `CalendarEvent`, or `null` if out of range / invalid.
 */
export function normaliseToCalendarEvent(
  raw: unknown,
  source: CalendarSource,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent | null {
  if (source === "calendar") {
    const r = raw as ApiCalendarEvent;
    if (!r?.start || !r?.end) return null;
    const start = new Date(r.start);
    const end = new Date(r.end);
    if (!overlapsRange(start, end, rangeStart, rangeEnd)) return null;
    const t = (r.type as CalendarEventType) || "other";
    const id = String(r.occurrenceId || r._id || "");
    if (!id) return null;
    return {
      id,
      title: r.title || "Untitled",
      type: ["meeting", "schedule", "call", "deadline", "reminder", "other"].includes(t)
        ? t
        : "other",
      start,
      end,
      allDay: Boolean(r.allDay),
      location: r.location,
      description: r.description,
      color: r.color || EVENT_COLORS[t] || EVENT_COLORS.other,
      source: "calendar",
      raw: r,
      occurrenceId: r.occurrenceId,
      seriesId: r.seriesId ? String(r.seriesId) : r._id ? String(r._id) : undefined,
      attendees: r.attendees,
      createdBy: r.createdBy,
      recurrence: r.recurrence,
      reminderMinutes: r.reminderMinutes,
      reminderSent: r.reminderSent,
      visibleToTeam: r.visibleToTeam,
    };
  }

  if (source === "leave") {
    const l = raw as LeaveRecord;
    if (!l?.fromDate) return null;
    const start = startOfDay(new Date(l.fromDate));
    const end = endOfDay(new Date(l.toDate || l.fromDate));
    if (!overlapsRange(start, end, rangeStart, rangeEnd)) return null;
    return {
      id: `leave-${l._id}`,
      title: `Leave · ${l.status}`,
      type: "leave",
      start,
      end,
      allDay: true,
      description: l.reason,
      color: EVENT_COLORS.leave,
      source: "leave",
      raw: l,
    };
  }

  if (source === "task") {
    const t = raw as TaskRow;
    if (!t?.dueDate) return null;
    const day = new Date(t.dueDate);
    if (Number.isNaN(day.getTime())) return null;
    const start = new Date(day);
    start.setHours(9, 0, 0, 0);
    const end = new Date(day);
    end.setHours(10, 0, 0, 0);
    if (!overlapsRange(start, end, rangeStart, rangeEnd)) return null;
    return {
      id: `task-${t._id}`,
      title: t.taskName || "Task",
      type: "task",
      start,
      end,
      allDay: false,
      description: t.description,
      color: EVENT_COLORS.task,
      source: "task",
      raw: t,
    };
  }

  if (source === "attendance") {
    const a = raw as AttendanceRow;
    if (!a?.date) return null;
    const day = startOfDay(new Date(a.date));
    let start: Date;
    let end: Date;
    if (a.punchInTime) {
      start = new Date(a.punchInTime);
      end = a.punchOutTime
        ? new Date(a.punchOutTime)
        : new Date(start.getTime() + 8 * 60 * 60 * 1000);
    } else {
      start = new Date(day);
      start.setHours(9, 0, 0, 0);
      end = new Date(day);
      end.setHours(17, 0, 0, 0);
    }
    if (!overlapsRange(start, end, rangeStart, rangeEnd)) return null;
    const name = a.user?.name || "Attendance";
    return {
      id: `attendance-${a._id}`,
      title: `Attendance · ${name}`,
      type: "attendance",
      start,
      end,
      allDay: !a.punchInTime,
      color: EVENT_COLORS.attendance,
      source: "attendance",
      raw: a,
    };
  }

  return null;
}

export function useCalendarEvents(rangeStart: Date, rangeEnd: Date) {
  const isoStart = rangeStart.toISOString();
  const isoEnd = rangeEnd.toISOString();
  const fromYmd = formatYmd(rangeStart);
  const toYmd = formatYmd(rangeEnd);

  const results = useQueries({
    queries: [
      {
        queryKey: ["calendar-events", "events", isoStart, isoEnd],
        queryFn: async () => {
          const res = await api.get<{ success?: boolean; events?: unknown[] }>(
            apiPath.events.list,
            { query: { start: isoStart, end: isoEnd } }
          );
          return res.events ?? [];
        },
      },
      {
        queryKey: ["calendar-events", "leave", isoStart, isoEnd],
        queryFn: async () => {
          const res = await api.get<{ leaves?: LeaveRecord[] }>(apiPath.leave.history);
          return res.leaves ?? [];
        },
      },
      {
        queryKey: ["calendar-events", "task", isoStart, isoEnd],
        queryFn: async () => {
          const res = await api.get<{ tasks?: TaskRow[] }>(apiPath.tasks.list, {
            query: { limit: 100, page: 1 },
          });
          return res.tasks ?? [];
        },
      },
      {
        queryKey: ["calendar-events", "attendance", fromYmd, toYmd],
        queryFn: async () => {
          const res = await api.get<{ attendance?: AttendanceRow[] }>(
            apiPath.attendance.getAttendance,
            { query: { from: fromYmd, to: toYmd } }
          );
          return res.attendance ?? [];
        },
      },
    ],
  });

  const [evQ, leaveQ, taskQ, attQ] = results;

  const events = useMemo(() => {
    const out: CalendarEvent[] = [];
    for (const raw of evQ.data ?? []) {
      const e = normaliseToCalendarEvent(raw, "calendar", rangeStart, rangeEnd);
      if (e) out.push(e);
    }
    for (const raw of leaveQ.data ?? []) {
      const e = normaliseToCalendarEvent(raw, "leave", rangeStart, rangeEnd);
      if (e) out.push(e);
    }
    for (const raw of taskQ.data ?? []) {
      const e = normaliseToCalendarEvent(raw, "task", rangeStart, rangeEnd);
      if (e) out.push(e);
    }
    for (const raw of attQ.data ?? []) {
      const e = normaliseToCalendarEvent(raw, "attendance", rangeStart, rangeEnd);
      if (e) out.push(e);
    }
    out.sort((a, b) => a.start.getTime() - b.start.getTime());
    return out;
  }, [evQ.data, leaveQ.data, taskQ.data, attQ.data, rangeStart, rangeEnd]);

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  return { events, isLoading, isError };
}

export function useInvalidateCalendarEvents() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["calendar-events"] });
}
