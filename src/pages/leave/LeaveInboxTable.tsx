import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, User } from "lucide-react";
import Button from "../../components/UI/Button";
import { LeaveInboxTableSkeleton } from "../../components/UI/Skeleton";
import type { LeaveRecord } from "../../types/leave.types";
import { applicantName, formatDate, leaveDurationLabel } from "./leaveUtils";

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

interface LeaveInboxSectionProps {
  pending: LeaveRecord[];
  isLoading: boolean;
  onApprove: (row: LeaveRecord) => void;
  onReject: (row: LeaveRecord) => void;
}

export function LeaveInboxSection({
  pending,
  isLoading,
  onApprove,
  onReject,
}: LeaveInboxSectionProps) {
  const [inboxPage, setInboxPage] = useState(1);
  const inboxTotalPages = Math.max(1, Math.ceil(pending.length / INBOX_PAGE_SIZE));
  const safeInboxPage = Math.min(Math.max(1, inboxPage), inboxTotalPages);
  const inboxSliceStart = (safeInboxPage - 1) * INBOX_PAGE_SIZE;
  const visiblePending = pending.slice(inboxSliceStart, inboxSliceStart + INBOX_PAGE_SIZE);

  useEffect(() => {
    if (inboxPage > inboxTotalPages) setInboxPage(inboxTotalPages);
  }, [inboxPage, inboxTotalPages]);

  return (
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
            {isLoading ? (
              <LeaveInboxTableSkeleton rows={5} />
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <Inbox className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                  No pending requests. You&apos;re all caught up.
                </td>
              </tr>
            ) : (
              visiblePending.map((row) => (
                <tr key={row._id} className="border-b border-slate-100 text-slate-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-800">
                        <User className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-medium text-slate-900">{applicantName(row)}</div>
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
                    {row.days === "multiple" && row.toDate && row.toDate !== row.fromDate && (
                      <div className="text-xs text-slate-500">→ {formatDate(row.toDate)}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{leaveDurationLabel(row)}</td>
                  <td className="px-4 py-3">
                    <TypeBadge type={row.type} />
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-700">{row.reason}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="!text-emerald-800 ring-1 ring-emerald-200 hover:bg-emerald-50"
                        onClick={() => onApprove(row)}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="!text-rose-800 ring-1 ring-rose-200 hover:bg-rose-50"
                        onClick={() => onReject(row)}
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

      {!isLoading && pending.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 text-slate-600 sm:flex-row">
          <p className="text-sm tabular-nums">
            Showing{" "}
            <span className="font-medium text-slate-900">
              {inboxSliceStart + 1}–{Math.min(inboxSliceStart + INBOX_PAGE_SIZE, pending.length)}
            </span>{" "}
            of <span className="font-medium text-slate-900">{pending.length}</span>
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
  );
}
