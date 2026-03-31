import type { CalendarEvent } from "../../types/calendar.types";

export function ymdKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function startOfWeekSunday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

/** 6 rows × 7 columns, weeks starting Sunday */
export function getMonthGrid(anchor: Date): Date[][] {
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const first = new Date(year, month, 1);
  const pad = first.getDay();
  const gridStart = new Date(year, month, 1 - pad);
  const weeks: Date[][] = [];
  let cur = new Date(gridStart);
  for (let w = 0; w < 6; w++) {
    const row: Date[] = [];
    for (let i = 0; i < 7; i++) {
      row.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

export function startOfCalendarDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfCalendarDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Events that overlap the given local calendar day */
export function eventsOnCalendarDay(day: Date, events: CalendarEvent[]): CalendarEvent[] {
  const s = startOfCalendarDay(day);
  const e = endOfCalendarDay(day);
  return events.filter((ev) => ev.end >= s && ev.start <= e);
}

export function getCalendarEventMongoId(ev: CalendarEvent): string | null {
  if (ev.source !== "calendar") return null;
  if (ev.seriesId) return ev.seriesId;
  const raw = ev.raw as { _id?: string } | undefined;
  if (raw?._id) return String(raw._id);
  const id = ev.id;
  const idx = id.indexOf("_");
  if (idx === 24) return id.slice(0, 24);
  return id.length === 24 ? id : null;
}
