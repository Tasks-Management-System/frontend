export type AttendanceStatus =
  | "not_started"
  | "working"
  | "on_break"
  | "completed";

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
};

export type AttendanceMutationResponse = {
  success: boolean;
  message?: string;
  attendance: AttendanceRecord;
};
