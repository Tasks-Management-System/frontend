export type AttendanceStatus = "not_started" | "working" | "on_break" | "completed";

export type AttendanceBreak = {
  breakStart?: string;
  breakEnd?: string;
  totalBreakTime?: number;
};

export type AttendanceSegment = {
  punchInTime?: string;
  punchOutTime?: string;
  breaks?: AttendanceBreak[];
  totalTime?: number;
};

export type AttendanceRecord = {
  _id: string;
  user?: string | { _id: string; name?: string; email?: string };
  date?: string;
  status: AttendanceStatus | string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  breaks?: AttendanceBreak[];
  totalTime?: number;
  readableTotalTime?: string;
  /** Sum of completed session lengths today (ms). Resets on a new calendar day. */
  dayTotalMs?: number;
  segments?: AttendanceSegment[];
  /** Server-computed worked time today (current session + segments). */
  readableDayTotal?: string;
  dayWorkedMs?: number;
};

export type AttendanceListResponse = {
  success: boolean;
  message: string;
  attendance: AttendanceRecord[];
  /** Server anchor for the queried calendar day (ISO). Single-day query only. */
  date?: string;
  /** Inclusive range (ISO) when using `from` + `to` query params. */
  dateFrom?: string;
  dateTo?: string;
};

export type AttendanceMutationResponse = {
  success: boolean;
  message?: string;
  attendance: AttendanceRecord;
};
