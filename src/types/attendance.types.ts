export type AttendanceStatus = "not_started" | "working" | "on_break" | "completed" | "holiday";

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

export type RegularizationRequest = {
  status: "pending" | "approved" | "rejected";
  reason?: string;
  requestedPunchIn?: string | null;
  requestedPunchOut?: string | null;
  requestedBy?: string | { _id: string; name?: string; email?: string } | null;
  requestedAt?: string | null;
  resolvedBy?: string | { _id: string; name?: string; email?: string } | null;
  resolvedAt?: string | null;
  resolverNote?: string;
};

export type AttendanceRecord = {
  _id: string;
  user?: string | { _id: string; name?: string; email?: string; role?: string[] };
  date?: string;
  status: AttendanceStatus | string;
  punchInTime?: string | null;
  punchOutTime?: string | null;
  breaks?: AttendanceBreak[];
  totalTime?: number;
  readableTotalTime?: string;
  dayTotalMs?: number;
  segments?: AttendanceSegment[];
  readableDayTotal?: string;
  dayWorkedMs?: number;
  // Audit / correction
  isManuallyEdited?: boolean;
  editedBy?: string | { _id: string; name?: string; email?: string } | null;
  editedAt?: string | null;
  note?: string;
  // Regularization
  regularization?: RegularizationRequest | null;
};

export type AttendanceSummary = {
  user: { _id: string; name?: string; email?: string; role?: string[] };
  period: { from: string; to: string; totalCalendarDays: number };
  presentDays: number;
  absentDays: number;
  totalMs: number;
  avgDailyMs: number;
  lateArrivals: number;
  overtimeMs: number;
  readableTotalTime: string;
  readableAvgDaily: string;
  readableOvertime: string;
};

export type AttendanceListResponse = {
  success: boolean;
  message: string;
  attendance: AttendanceRecord[];
  date?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type AttendanceSummaryResponse = {
  success: boolean;
  message: string;
  summaries: AttendanceSummary[];
  dateFrom: string;
  dateTo: string;
};

export type AttendanceMutationResponse = {
  success: boolean;
  message?: string;
  attendance: AttendanceRecord;
};

export type RegularizationListResponse = {
  success: boolean;
  message: string;
  records: AttendanceRecord[];
};
