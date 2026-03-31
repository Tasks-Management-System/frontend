import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { LeaveRecord, LeaveStatus, LeaveType } from "../../types/leave.types";
import { LeaveTableSkeleton } from "../UI/Skeleton";

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

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

function TypeBadge({ type }: { type: LeaveType }) {
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

export type LeaveHistoryTableProps = {
  leaves: LeaveRecord[];
  isLoading: boolean;
  showRequestLink?: boolean;
  /** Title + subtitle row (e.g. Profile). Hide on Leave page. */
  showSectionHeader?: boolean;
  /** Match Time off page styling */
  variant?: "default" | "slate";
  /** Replaces default empty copy (icon still shown). */
  emptyDescription?: string;
  /** Rows per page; set to 0 to show all (no client pager). Use with `serverPagination` for API paging. */
  pageSize?: number;
  /** Current `leaves` are one server page; totals and navigation come from the API. */
  serverPagination?: {
    total: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
};

/**
 * Read-only leave history for the signed-in user (same data as GET /leave).
 */
export function LeaveHistoryTable({
  leaves,
  isLoading,
  showRequestLink = true,
  showSectionHeader = true,
  variant = "default",
  emptyDescription,
  pageSize: pageSizeProp = 10,
  serverPagination,
}: LeaveHistoryTableProps) {
  const slate = variant === "slate";
  const server = serverPagination;
  const clientPaginate = !server && pageSizeProp > 0;
  const pageSize = clientPaginate
    ? pageSizeProp
    : server
      ? server.pageSize
      : leaves.length || 1;

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!server) setPage(1);
  }, [server, leaves]);

  const totalPagesClient = useMemo(
    () =>
      clientPaginate ? Math.max(1, Math.ceil(leaves.length / pageSize)) : 1,
    [leaves.length, pageSize, clientPaginate]
  );

  const safePageClient = Math.min(Math.max(1, page), totalPagesClient);
  const sliceStart = clientPaginate ? (safePageClient - 1) * pageSize : 0;
  const visibleLeaves = clientPaginate
    ? leaves.slice(sliceStart, sliceStart + pageSize)
    : leaves;

  const totalPagesServer = server
    ? Math.max(1, Math.ceil(server.total / server.pageSize))
    : 1;
  const safePageServer = server
    ? Math.min(Math.max(1, server.page), totalPagesServer)
    : 1;
  const sliceStartServer = server
    ? (safePageServer - 1) * server.pageSize
    : 0;

  /** Out-of-range page or refetch gap: avoid flashing “empty” while totals say otherwise. */
  const bodySkeleton =
    isLoading ||
    Boolean(
      server &&
        server.total > 0 &&
        leaves.length === 0
    );

  const showEmptyRow =
    !bodySkeleton &&
    (server ? server.total === 0 : leaves.length === 0);

  const wrap = slate
    ? "overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]"
    : "overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm";

  const thead = slate
    ? "border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500"
    : "border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500";

  const rowClass = slate
    ? "border-b border-slate-100 text-slate-800"
    : "border-b border-gray-100 text-gray-800 last:border-0";

  const datePrimary = slate ? "text-slate-900" : "text-gray-900";
  const dateSecondary = slate ? "text-slate-500" : "text-gray-500";
  const reasonCls = slate ? "text-slate-700" : "text-gray-700";
  const noteCls = slate ? "text-slate-500" : "text-gray-500";
  const emptyWrap = slate ? "text-slate-500" : "text-gray-500";
  const emptyIcon = slate ? "text-slate-300" : "text-gray-300";

  const renderEmpty = () => {
    if (emptyDescription) {
      return (
        <>
          <CalendarDays
            className={`mx-auto mb-2 h-10 w-10 ${emptyIcon}`}
            aria-hidden
          />
          <p className="text-sm">{emptyDescription}</p>
        </>
      );
    }
    return (
      <>
        <CalendarDays
          className={`mx-auto mb-2 h-10 w-10 ${emptyIcon}`}
          aria-hidden
        />
        <p className="text-sm">
          No leave requests yet.
          {showRequestLink && (
            <>
              {" "}
              <Link
                to="/leave"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Submit one from Time off
              </Link>
              .
            </>
          )}
        </p>
      </>
    );
  };

  return (
    <div className="space-y-4">
      {showSectionHeader && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Leave history
            </h2>
            <p className="text-sm text-gray-500">
              Your submitted requests and their status.
            </p>
          </div>
          {showRequestLink && (
            <Link
              to="/leave"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              Request leave
            </Link>
          )}
        </div>
      )}

      <div className={wrap}>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className={thead}>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {bodySkeleton ? (
              <LeaveTableSkeleton rows={6} />
            ) : showEmptyRow ? (
              <tr>
                <td
                  colSpan={6}
                  className={`px-4 py-12 text-center ${emptyWrap}`}
                >
                  {renderEmpty()}
                </td>
              </tr>
            ) : (
              visibleLeaves.map((row) => (
                <tr key={row._id} className={rowClass}>
                  <td className="px-4 py-3 align-top">
                    <div className={`font-medium ${datePrimary}`}>
                      {formatDate(row.fromDate)}
                    </div>
                    {row.days === "multiple" &&
                      row.toDate &&
                      row.toDate !== row.fromDate && (
                        <div className={`text-xs ${dateSecondary}`}>
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
                  <td className={`max-w-xs px-4 py-3 align-top ${reasonCls}`}>
                    {row.reason}
                  </td>
                  <td
                    className={`max-w-[200px] px-4 py-3 align-top text-xs ${noteCls}`}
                  >
                    {row.adminComment?.trim() || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {server &&
        !bodySkeleton &&
        !isLoading &&
        server.total > 0 && (
          <div
            className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${
              slate ? "text-slate-600" : "text-gray-600"
            }`}
          >
            <p className="text-sm tabular-nums">
              Showing{" "}
              <span
                className={`font-medium ${slate ? "text-slate-900" : "text-gray-900"}`}
              >
                {sliceStartServer + 1}–
                {Math.min(
                  safePageServer * server.pageSize,
                  server.total
                )}
              </span>{" "}
              of{" "}
              <span
                className={`font-medium ${slate ? "text-slate-900" : "text-gray-900"}`}
              >
                {server.total}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePageServer <= 1}
                onClick={() =>
                  server.onPageChange(Math.max(1, safePageServer - 1))
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  slate
                    ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </button>
              <span className="min-w-[5rem] text-center text-sm tabular-nums">
                Page {safePageServer} / {totalPagesServer}
              </span>
              <button
                type="button"
                disabled={safePageServer >= totalPagesServer}
                onClick={() =>
                  server.onPageChange(
                    Math.min(totalPagesServer, safePageServer + 1)
                  )
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  slate
                    ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}

      {clientPaginate && !isLoading && leaves.length > 0 && (
          <div
            className={`flex flex-col items-center justify-between gap-3 sm:flex-row ${
              slate ? "text-slate-600" : "text-gray-600"
            }`}
          >
            <p className="text-sm tabular-nums">
              Showing{" "}
              <span className="font-medium text-slate-900">
                {sliceStart + 1}–
                {Math.min(sliceStart + pageSize, leaves.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-slate-900">
                {leaves.length}
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePageClient <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  slate
                    ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </button>
              <span className="min-w-[5rem] text-center text-sm tabular-nums">
                Page {safePageClient} / {totalPagesClient}
              </span>
              <button
                type="button"
                disabled={safePageClient >= totalPagesClient}
                onClick={() =>
                  setPage((p) => Math.min(totalPagesClient, p + 1))
                }
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  slate
                    ? "border-slate-200 bg-white text-slate-800 hover:bg-slate-50"
                    : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
                }`}
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
