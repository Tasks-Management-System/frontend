import { useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays,
  ClipboardList,
  Inbox,
  Info,
  Loader2,
  Plus,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserById } from "../../apis/api/auth";
import { localYmd } from "../../apis/api/attendance";
import {
  useApplyLeave,
  useLeaveHistory,
  usePendingLeaveRequests,
  useUpdateLeaveStatus,
} from "../../apis/api/leave";
import { ApiError } from "../../apis/apiService";
import { PillTabBar } from "../../components/UI/PillTabBar";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Modal from "../../components/UI/Model";
import type {
  LeaveBalanceSnapshot,
  LeaveDaysMode,
  LeaveRecord,
  LeaveStatus,
  LeaveSubType,
} from "../../types/leave.types";

const dateFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

function leaveDurationLabel(l: LeaveRecord): string {
  if (l.subType === "halfDay") return "Half day";
  if (l.days === "single") return "1 day";
  const from = new Date(l.fromDate);
  const to = new Date(l.toDate || l.fromDate);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "—";
  const diff =
    Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return `${diff} days`;
}

function applicantName(leave: LeaveRecord): string {
  const u = leave.user;
  if (typeof u === "object" && u !== null && "name" in u) {
    return (u as { name?: string }).name ?? "—";
  }
  return "—";
}

const STATUS_UI: Record<
  LeaveStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
  },
  approved: {
    label: "Approved",
    className: "bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200/80",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-900 ring-1 ring-rose-200/80",
  },
};

function StatusBadge({ status }: { status: LeaveStatus }) {
  const ui = STATUS_UI[status];
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ui.className}`}
    >
      {ui.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const paid = type === "paidLeave";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        paid
          ? "bg-violet-50 text-violet-900 ring-1 ring-violet-200/80"
          : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80"
      }`}
    >
      {paid ? "Paid" : "Unpaid"}
    </span>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function defaultBalance(): LeaveBalanceSnapshot {
  return { totalBalance: 24, paidLeave: 12, leaveTaken: 0 };
}

export default function Leave() {
  const userId = localStorage.getItem("userId") ?? "";
  const { data: user, isLoading: userLoading } = getUserById(userId);
  const { data: history = [], isLoading: historyLoading } = useLeaveHistory(
    !!userId
  );

  const roles = user?.role ?? [];
  const canReview = roles.some((r) =>
    ["admin", "hr", "super-admin"].includes(r)
  );

  const [tab, setTab] = useState<"mine" | "inbox">("inbox");
  const { data: pending = [], isLoading: pendingLoading } =
    usePendingLeaveRequests(!!userId && canReview && tab === "inbox");

  const [statusFilter, setStatusFilter] = useState<
    "all" | LeaveStatus
  >("all");

  const filteredHistory = useMemo(() => {
    if (statusFilter === "all") return history;
    return history.filter((l) => l.status === statusFilter);
  }, [history, statusFilter]);

  const balance: LeaveBalanceSnapshot =
    user?.leaves?.[0] && typeof user.leaves[0] === "object"
      ? {
          totalBalance: Number(
            (user.leaves[0] as LeaveBalanceSnapshot).totalBalance ?? 24
          ),
          paidLeave: Number(
            (user.leaves[0] as LeaveBalanceSnapshot).paidLeave ?? 12
          ),
          leaveTaken: Number(
            (user.leaves[0] as LeaveBalanceSnapshot).leaveTaken ?? 0
          ),
        }
      : defaultBalance();

  const [applyOpen, setApplyOpen] = useState(false);
  const [daysMode, setDaysMode] = useState<LeaveDaysMode>("single");
  const [subType, setSubType] = useState<LeaveSubType>("fullDay");
  const [fromDate, setFromDate] = useState(() => localYmd());
  const [toDate, setToDate] = useState(() => localYmd());
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const applyMutation = useApplyLeave();
  const updateStatusMutation = useUpdateLeaveStatus();

  const [reviewLeave, setReviewLeave] = useState<LeaveRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(
    null
  );
  const [adminComment, setAdminComment] = useState("");

  const openApply = () => {
    setDaysMode("single");
    setSubType("fullDay");
    setFromDate(localYmd());
    setToDate(localYmd());
    setReason("");
    setFormError(null);
    setApplyOpen(true);
  };

  const handleApply = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const r = reason.trim();
    if (!r) {
      setFormError("Please describe the reason for your leave.");
      return;
    }
    if (daysMode === "multiple") {
      if (!fromDate || !toDate) {
        setFormError("Start and end dates are required for a multi-day request.");
        return;
      }
      if (new Date(toDate) < new Date(fromDate)) {
        setFormError("End date must be on or after the start date.");
        return;
      }
    }

    const body = {
      days: daysMode,
      subType: daysMode === "single" ? subType : "fullDay",
      fromDate,
      ...(daysMode === "multiple" ? { toDate } : {}),
      reason: r,
    };

    try {
      const res = await applyMutation.mutateAsync(body);
      toast.success(res.message ?? "Leave request submitted");
      setApplyOpen(false);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not submit leave request");
    }
  };

  const submitReview = async () => {
    if (!reviewLeave || !reviewAction) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: reviewLeave._id,
        body: {
          status: reviewAction,
          adminComment: adminComment.trim() || undefined,
        },
      });
      toast.success(
        reviewAction === "approved" ? "Leave approved" : "Leave rejected"
      );
      setReviewLeave(null);
      setReviewAction(null);
      setAdminComment("");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not update status");
    }
  };

  const tabItems = useMemo(() => {
    const items = [
      {
        key: "inbox",
        label: "Team inbox",
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ];
    if (canReview) {
      items.push({
        key: "mine",
        label: "My leave",
        icon: <Inbox className="h-4 w-4" />,
      });
    }
    return items;
  }, [canReview]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Time off
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Request leave, track balances, and review pending requests.
          </p>
        </div>
        <Button
          type="button"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={openApply}
        >
          Request leave
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {canReview ? (
          <PillTabBar items={tabItems} activeKey={tab} onTabChange={(k) => setTab(k as "mine" | "inbox")} />
        ) : (
          <div />
        )}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Annual balance"
          value={userLoading ? "…" : String(balance.totalBalance)}
          hint="Days remaining in your general pool"
        />
        <StatCard
          title="Paid leave (month)"
          value={userLoading ? "…" : String(balance.paidLeave)}
          hint="First request each month may use paid days when available"
        />
        <StatCard
          title="Taken (tracked)"
          value={userLoading ? "…" : String(balance.leaveTaken)}
          hint="Includes pending and approved days"
        />
      </div>

      <div className="mt-4 flex gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sm text-sky-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
        <p>
          <span className="font-medium">How it works:</span> Each calendar month,
          your first pending or approved request can draw from paid leave when you
          have paid days left. Additional days in that month use your annual
          balance or are marked unpaid if the pool is insufficient. HR is notified
          by email when you submit; you receive email when a decision is made.
        </p>
      </div>

      {tab === "mine" && (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Filter:</span>
            {(
              [
                ["all", "All"],
                ["pending", "Pending"],
                ["approved", "Approved"],
                ["rejected", "Rejected"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  statusFilter === key
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Note</th>
                </tr>
              </thead>
              <tbody>
                {historyLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
                    </td>
                  </tr>
                ) : filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                      <CalendarDays className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                      No leave requests match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row) => (
                    <tr
                      key={row._id}
                      className="border-b border-slate-100 text-slate-800"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">
                          {formatDate(row.fromDate)}
                        </div>
                        {row.days === "multiple" &&
                          row.toDate &&
                          row.toDate !== row.fromDate && (
                            <div className="text-xs text-slate-500">
                              → {formatDate(row.toDate)}
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-3 align-top tabular-nums">
                        {leaveDurationLabel(row)}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <TypeBadge type={row.type} />
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="max-w-xs px-4 py-3 align-top text-slate-700">
                        {row.reason}
                      </td>
                      <td className="max-w-[200px] px-4 py-3 align-top text-xs text-slate-500">
                        {row.adminComment?.trim() || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "inbox" && canReview && (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-violet-600" />
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Inbox className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                    No pending requests. You&apos;re all caught up.
                  </td>
                </tr>
              ) : (
                pending.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-slate-100 text-slate-800"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-800">
                          <User className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-medium text-slate-900">
                            {applicantName(row)}
                          </div>
                          {typeof row.user === "object" &&
                            row.user &&
                            "email" in row.user &&
                            (row.user as { email?: string }).email && (
                              <div className="text-xs text-slate-500">
                                {(row.user as { email: string }).email}
                              </div>
                            )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{formatDate(row.fromDate)}</div>
                      {row.days === "multiple" &&
                        row.toDate &&
                        row.toDate !== row.fromDate && (
                          <div className="text-xs text-slate-500">
                            → {formatDate(row.toDate)}
                          </div>
                        )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {leaveDurationLabel(row)}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={row.type} />
                    </td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">
                      {row.reason}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="!text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                          onClick={() => {
                            setReviewLeave(row);
                            setReviewAction("approved");
                            setAdminComment("");
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="!text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50"
                          onClick={() => {
                            setReviewLeave(row);
                            setReviewAction("rejected");
                            setAdminComment("");
                          }}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={applyOpen}
        onClose={() => !applyMutation.isPending && setApplyOpen(false)}
        title="Request leave"
        panelClassName="max-w-lg"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">
              Duration
            </legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["single", "Single day"],
                  ["multiple", "Multiple days"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setDaysMode(v);
                    if (v === "multiple") setSubType("fullDay");
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    daysMode === v
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {daysMode === "single" && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-slate-700">
                Day length
              </legend>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["fullDay", "Full day"],
                    ["halfDay", "Half day"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setSubType(v)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      subType === v
                        ? "bg-violet-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {daysMode === "single" ? "Date" : "From"}
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            {daysMode === "multiple" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  To
                </label>
                <input
                  type="date"
                  value={toDate}
                  min={fromDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}
          </div>

          <Input
            label="Reason"
            name="reason"
            type="textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Medical appointment, family event…"
          />

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={applyMutation.isPending}
              onClick={() => setApplyOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={applyMutation.isPending}>
              Submit request
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!reviewLeave && !!reviewAction}
        onClose={() => {
          if (updateStatusMutation.isPending) return;
          setReviewLeave(null);
          setReviewAction(null);
          setAdminComment("");
        }}
        title={
          reviewAction === "approved"
            ? "Approve leave"
            : reviewAction === "rejected"
              ? "Reject leave"
              : "Review"
        }
        panelClassName="max-w-md"
      >
        {reviewLeave && reviewAction && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">
                {applicantName(reviewLeave)}
              </p>
              <p className="mt-1">
                {formatDate(reviewLeave.fromDate)}
                {reviewLeave.days === "multiple" &&
                  reviewLeave.toDate &&
                  reviewLeave.toDate !== reviewLeave.fromDate &&
                  ` → ${formatDate(reviewLeave.toDate)}`}
                {" · "}
                {leaveDurationLabel(reviewLeave)}
              </p>
              <p className="mt-2 text-slate-600">{reviewLeave.reason}</p>
            </div>

            <Input
              label="Comment to employee (optional)"
              name="adminComment"
              type="textarea"
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
              placeholder={
                reviewAction === "approved"
                  ? "e.g. Approved — enjoy your time off."
                  : "e.g. Please reschedule; team coverage needed."
              }
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateStatusMutation.isPending}
                onClick={() => {
                  setReviewLeave(null);
                  setReviewAction(null);
                  setAdminComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={reviewAction === "rejected" ? "danger" : "primary"}
                loading={updateStatusMutation.isPending}
                onClick={() => void submitReview()}
              >
                {reviewAction === "approved" ? "Confirm approval" : "Confirm rejection"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
