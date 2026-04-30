import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  AttendanceListResponse,
  AttendanceMutationResponse,
  AttendanceRecord,
} from "../../types/attendance.types";

/** Worked ms in the open session only (matches server break rules for live UI). */
export function clientCurrentSessionWorkedMs(record: AttendanceRecord | null | undefined): number {
  if (!record?.punchInTime) return 0;
  if (record.status !== "working" && record.status !== "on_break") return 0;
  const start = new Date(record.punchInTime).getTime();
  if (Number.isNaN(start)) return 0;
  let breakMs = 0;
  for (const b of record.breaks ?? []) {
    if (b.breakStart && b.breakEnd) {
      breakMs += new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime();
    } else if (b.breakStart && record.status === "on_break") {
      breakMs += Date.now() - new Date(b.breakStart).getTime();
    }
  }
  return Math.max(0, Date.now() - start - breakMs);
}

export function localYmd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function attendanceListQueryKey(date: string, orgContext?: string) {
  return ["attendance", "list", date, orgContext] as const;
}

export function attendanceRangeQueryKey(from: string, to: string, orgContext?: string) {
  return ["attendance", "range", from, to, orgContext] as const;
}

/** Monday 00:00 local for the calendar week containing `d`. */
export function startOfWeekMonday(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + diff);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Seven YYYY-MM-DD strings Mon → Sun. */
export function weekDayYmds(weekMonday: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => localYmd(addDays(weekMonday, i)));
}

export function useAttendanceRange(from: string, to: string, enabled = true, orgContext?: string) {
  return useQuery({
    queryKey: attendanceRangeQueryKey(from, to, orgContext),
    enabled: enabled && !!from && !!to,
    queryFn: async () => {
      return api.get<AttendanceListResponse>(apiPath.attendance.getAttendance, {
        auth: true,
        query: { from, to, ...(orgContext ? { orgContext } : {}) },
      });
    },
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function pickMyAttendanceRecord(
  res: AttendanceListResponse | undefined,
  myUserId: string
): AttendanceRecord | null {
  if (!res?.attendance?.length || !myUserId) return null;
  const { attendance } = res;
  const match = attendance.find((a) => {
    const u = a.user;
    if (typeof u === "object" && u !== null && "_id" in u) {
      return String((u as { _id: string })._id) === String(myUserId);
    }
    if (typeof u === "string") return u === myUserId;
    return false;
  });
  // Never fall back to attendance[0]: admins get everyone's rows for the day; a single
  // employee record would wrongly show as the logged-in user's punch state.
  return match ?? null;
}

export function useAttendanceList(date: string, enabled = true, orgContext?: string) {
  return useQuery({
    queryKey: attendanceListQueryKey(date, orgContext),
    enabled: enabled && !!date,
    queryFn: async () => {
      return api.get<AttendanceListResponse>(apiPath.attendance.getAttendance, {
        auth: true,
        query: { date, ...(orgContext ? { orgContext } : {}) },
      });
    },
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useTodayAttendance(enabled = true, orgContext?: string) {
  return useAttendanceList(localYmd(), enabled, orgContext);
}

export function usePunchIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "punchIn"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(apiPath.attendance.punchIn, {}, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function usePunchOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "punchOut"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(apiPath.attendance.punchOut, {}, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useStartBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "startBreak"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(apiPath.attendance.startBreak, {}, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useEndBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "endBreak"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(apiPath.attendance.endBreak, {}, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
