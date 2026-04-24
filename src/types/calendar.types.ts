export type CalendarSource = "calendar" | "leave" | "task" | "attendance";

export type CalendarEventType =
  | "meeting"
  | "schedule"
  | "call"
  | "deadline"
  | "reminder"
  | "other"
  | "leave"
  | "task"
  | "attendance";

export type CalendarViewMode = "month" | "week" | "day" | "agenda";

export type EventFilters = Record<CalendarEventType, boolean>;

export type CalendarAttendee = {
  userId?: string;
  name?: string;
  email?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: CalendarEventType;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  description?: string;
  color: string;
  source: CalendarSource;
  raw?: unknown;
  occurrenceId?: string;
  seriesId?: string;
  attendees?: CalendarAttendee[];
  createdBy?: { _id: string; name?: string; email?: string } | string;
  recurrence?: string;
  reminderMinutes?: number;
  reminderSent?: boolean;
  visibleToTeam?: boolean;
};

export const EVENT_COLORS: Record<CalendarEventType, string> = {
  meeting: "#2563eb",
  schedule: "#7c3aed",
  call: "#059669",
  deadline: "#dc2626",
  reminder: "#d97706",
  other: "#64748b",
  leave: "#f97316", // orange for leave
  task: "#ef4444", // red for task deadlines
  attendance: "#14b8a6",
};

// Birthday events use purple
export const BIRTHDAY_COLOR = "#a855f7";

export const CALENDAR_TYPE_ORDER: CalendarEventType[] = [
  "meeting",
  "schedule",
  "call",
  "deadline",
  "reminder",
  "other",
  "leave",
  "task",
  "attendance",
];

export const SWATCH_COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#dc2626",
  "#d97706",
  "#64748b",
  "#0ea5e9",
  "#8b5cf6",
];
