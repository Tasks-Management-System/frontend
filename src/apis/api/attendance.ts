import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  AttendanceListResponse,
  AttendanceMutationResponse,
  AttendanceRecord,
} from "../../types/attendance.types";

/** Worked ms in the open session only (matches server break rules for live UI). */
export function clientCurrentSessionWorkedMs(
  record: AttendanceRecord | null | undefined
): number {
  if (!record?.punchInTime) return 0;
  if (record.status !== "working" && record.status !== "on_break") return 0;
  const start = new Date(record.punchInTime).getTime();
  if (Number.isNaN(start)) return 0;
  let breakMs = 0;
  for (const b of record.breaks ?? []) {
    if (b.breakStart && b.breakEnd) {
      breakMs +=
        new Date(b.breakEnd).getTime() - new Date(b.breakStart).getTime();
    } else if (b.breakStart && record.status === "on_break") {
      breakMs += Date.now() - new Date(b.breakStart).getTime();
    }
  }
  return Math.max(0, Date.now() - start - breakMs);
}

export const attendanceTodayQueryKey = ["attendance", "today"] as const;

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
  if (match) return match;
  if (attendance.length === 1) return attendance[0];
  return null;
}

export function useTodayAttendance(enabled = true) {
  return useQuery({
    queryKey: attendanceTodayQueryKey,
    enabled,
    queryFn: async () => {
      return api.get<AttendanceListResponse>(apiPath.attendance.getAttendance, {
        auth: true,
      });
    },
    /** Pick up a new calendar day (fresh `date` on server) without a full reload. */
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function usePunchIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "punchIn"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(
        apiPath.attendance.punchIn,
        {},
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceTodayQueryKey });
    },
  });
}

export function usePunchOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "punchOut"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(
        apiPath.attendance.punchOut,
        {},
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceTodayQueryKey });
    },
  });
}

export function useStartBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "startBreak"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(
        apiPath.attendance.startBreak,
        {},
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceTodayQueryKey });
    },
  });
}

export function useEndBreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["attendance", "endBreak"],
    mutationFn: () =>
      api.post<AttendanceMutationResponse>(
        apiPath.attendance.endBreak,
        {},
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: attendanceTodayQueryKey });
    },
  });
}
