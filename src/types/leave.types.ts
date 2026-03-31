export type LeaveDaysMode = "single" | "multiple";
export type LeaveSubType = "halfDay" | "fullDay";
export type LeaveType = "paidLeave" | "unpaidLeave";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface LeaveBalanceSnapshot {
  totalBalance: number;
  paidLeave: number;
  leaveTaken: number;
}

export interface LeaveUserSummary {
  _id: string;
  name: string;
  email?: string;
}

export interface LeaveRecord {
  _id: string;
  user: string | LeaveUserSummary;
  type: LeaveType;
  days: LeaveDaysMode;
  subType: LeaveSubType;
  fromDate: string;
  toDate?: string;
  reason: string;
  status: LeaveStatus;
  adminComment?: string;
  deductedFromPaid?: number;
  deductedFromAnnual?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApplyLeaveBody {
  days: LeaveDaysMode;
  subType?: LeaveSubType;
  fromDate: string;
  toDate?: string;
  reason: string;
}

export interface ApplyLeaveResponse {
  success: boolean;
  message: string;
  leave: LeaveRecord;
  updatedBalance: LeaveBalanceSnapshot;
}

export interface LeaveHistoryResponse {
  success: boolean;
  message: string;
  leaves: LeaveRecord[];
}

/** Present when GET /leave is called with `page` or `limit`. */
export interface LeaveHistoryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface LeaveHistoryPaginatedResponse extends LeaveHistoryResponse {
  pagination: LeaveHistoryPagination;
}

export interface PendingLeavesResponse {
  success: boolean;
  message: string;
  leaves: LeaveRecord[];
}

export interface UpdateLeaveStatusBody {
  status: "approved" | "rejected";
  adminComment?: string;
}

export interface UpdateLeaveStatusResponse {
  success: boolean;
  message: string;
  leave: LeaveRecord;
}
