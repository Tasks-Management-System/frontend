import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  ApplyLeaveBody,
  ApplyLeaveResponse,
  LeaveHistoryResponse,
  PendingLeavesResponse,
  UpdateLeaveStatusBody,
  UpdateLeaveStatusResponse,
} from "../../types/leave.types";

export const leaveHistoryQueryKey = ["leave", "history"] as const;
export const leavePendingQueryKey = ["leave", "pending"] as const;

export function useLeaveHistory(enabled = true) {
  return useQuery({
    queryKey: leaveHistoryQueryKey,
    enabled,
    queryFn: async () => {
      const res = await api.get<LeaveHistoryResponse>(apiPath.leave.history, {
        auth: true,
      });
      return res.leaves;
    },
  });
}

export function usePendingLeaveRequests(enabled = true) {
  return useQuery({
    queryKey: leavePendingQueryKey,
    enabled,
    queryFn: async () => {
      const res = await api.get<PendingLeavesResponse>(apiPath.leave.pending, {
        auth: true,
      });
      return res.leaves;
    },
  });
}

export function useApplyLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["leave", "apply"],
    mutationFn: async (body: ApplyLeaveBody) => {
      return api.post<ApplyLeaveResponse>(apiPath.leave.apply, body, {
        auth: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveHistoryQueryKey });
      qc.invalidateQueries({ queryKey: leavePendingQueryKey });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["leave", "updateStatus"],
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateLeaveStatusBody;
    }) => {
      return api.put<UpdateLeaveStatusResponse>(
        apiPath.leave.updateStatus + id,
        body,
        { auth: true }
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveHistoryQueryKey });
      qc.invalidateQueries({ queryKey: leavePendingQueryKey });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
