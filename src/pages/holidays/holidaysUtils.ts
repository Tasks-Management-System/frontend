import type { Holiday } from "../../types/holiday.types";

export const HOLIDAY_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatHolidayListDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
}

export function groupHolidaysByMonth(holidays: Holiday[]): Record<number, Holiday[]> {
  const map: Record<number, Holiday[]> = {};
  for (const h of holidays) {
    const m = new Date(h.date).getMonth();
    if (!map[m]) map[m] = [];
    map[m].push(h);
  }
  return map;
}
