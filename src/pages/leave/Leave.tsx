import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Inbox,
  Plus,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import { getUserById } from "../../apis/api/auth";
import { localYmd } from "../../apis/api/attendance";
import {
  useApplyLeave,
  usePendingLeaveRequests,
  useUpdateLeaveStatus,
} from "../../apis/api/leave";
import { ApiError } from "../../apis/apiService";
import { PillTabBar } from "../../components/UI/PillTabBar";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Modal from "../../components/UI/Model";
import {
  LeaveBalanceSummary,
  MyLeaveHistoryPanel,
} from "../../components/leave/MyLeaveSection";
import { LeaveInboxTableSkeleton } from "../../components/UI/Skeleton";
import type { LeaveDaysMode, LeaveRecord, LeaveSubType } from "../../types/leave.types";

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

const INBOX_PAGE_SIZE = 10;

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

export default function Leave() {
  const userId = localStorage.getItem("userId") ?? "";
  const { data: user, isLoading: userLoading } = getUserById(userId);
  const roles = user?.role ?? [];
  const canReview = roles.some((r) =>
    ["admin", "hr", "super-admin"].includes(r)
  );

  const [tab, setTab] = useState<"mine" | "inbox">("inbox");
  const { data: pending = [], isLoading: pendingLoading } =
    usePendingLeaveRequests(!!userId && canReview && tab === "inbox");

  const [inboxPage, setInboxPage] = useState(1);

  useEffect(() => {
    setInboxPage(1);
  }, [tab]);

  const inboxTotalPages = Math.max(
    1,
    Math.ceil(pending.length / INBOX_PAGE_SIZE)
  );
  const safeInboxPage = Math.min(
    Math.max(1, inboxPage),
    inboxTotalPages
  );
  const inboxSliceStart = (safeInboxPage - 1) * INBOX_PAGE_SIZE;
  const visiblePending = pending.slice(
    inboxSliceStart,
    inboxSliceStart + INBOX_PAGE_SIZE
  );

  useEffect(() => {
    if (inboxPage > inboxTotalPages) {
      setInboxPage(inboxTotalPages);
    }
  }, [inboxPage, inboxTotalPages]);

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

      <LeaveBalanceSummary
        user={user}
        userLoading={userLoading}
        className="mt-6"
      />

      {(!canReview || tab === "mine") && (
        <MyLeaveHistoryPanel enabled={!!userId} />
      )}

      {tab === "inbox" && canReview && (
        <div className="mt-8 space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
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
                  <LeaveInboxTableSkeleton rows={5} />
                ) : pending.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      <Inbox className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                      No pending requests. You&apos;re all caught up.
                    </td>
                  </tr>
                ) : (
                  visiblePending.map((row) => (
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

          {!pendingLoading && pending.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 text-slate-600 sm:flex-row">
              <p className="text-sm tabular-nums">
                Showing{" "}
                <span className="font-medium text-slate-900">
                  {inboxSliceStart + 1}–
                  {Math.min(
                    inboxSliceStart + INBOX_PAGE_SIZE,
                    pending.length
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-slate-900">
                  {pending.length}
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safeInboxPage <= 1}
                  onClick={() => setInboxPage(safeInboxPage - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Previous
                </button>
                <span className="min-w-20 text-center text-sm tabular-nums">
                  Page {safeInboxPage} / {inboxTotalPages}
                </span>
                <button
                  type="button"
                  disabled={safeInboxPage >= inboxTotalPages}
                  onClick={() => setInboxPage(safeInboxPage + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>
          )}
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
