import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  ApplyLeaveBody,
  ApplyLeaveResponse,
  LeaveHistoryPaginatedResponse,
  LeaveHistoryResponse,
  LeaveStatus,
  PendingLeavesResponse,
  UpdateLeaveStatusBody,
  UpdateLeaveStatusResponse,
} from "../../types/leave.types";

export const leaveHistoryQueryKey = ["leave", "history"] as const;
export const leavePendingQueryKey = ["leave", "pending"] as const;

/** Full list (no query params) — used where every row is needed at once. */
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

export type PaginatedLeaveHistoryResult = {
  leaves: LeaveHistoryPaginatedResponse["leaves"];
  pagination: LeaveHistoryPaginatedResponse["pagination"];
};

/** Paged + optional status filter (server-side). */
export function usePaginatedLeaveHistory(options: {
  page: number;
  limit?: number;
  status: "all" | LeaveStatus;
  enabled?: boolean;
}) {
  const { page, limit = 10, status, enabled = true } = options;
  return useQuery({
    queryKey: ["leave", "history", "paged", page, limit, status],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<PaginatedLeaveHistoryResult> => {
      const query: Record<string, string | number> = { page, limit };
      if (status !== "all") query.status = status;
      const res = await api.get<LeaveHistoryPaginatedResponse>(apiPath.leave.history, {
        auth: true,
        query,
      });
      if (!res.pagination) {
        throw new Error("Expected paginated leave response");
      }
      return {
        leaves: res.leaves ?? [],
        pagination: res.pagination,
      };
    },
  });
}

export function usePendingLeaveRequests(enabled = true, orgContext?: string) {
  return useQuery({
    queryKey: [...leavePendingQueryKey, orgContext],
    enabled,
    queryFn: async () => {
      const res = await api.get<PendingLeavesResponse>(apiPath.leave.pending, {
        auth: true,
        query: orgContext ? { orgContext } : undefined,
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
      qc.invalidateQueries({ queryKey: ["leave", "history"] });
      qc.invalidateQueries({ queryKey: leavePendingQueryKey });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["leave", "updateStatus"],
    mutationFn: async ({ id, body }: { id: string; body: UpdateLeaveStatusBody }) => {
      return api.put<UpdateLeaveStatusResponse>(apiPath.leave.updateStatus + id, body, {
        auth: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leave", "history"] });
      qc.invalidateQueries({ queryKey: leavePendingQueryKey });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
}
