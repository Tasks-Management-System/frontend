import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Info, Plus } from "lucide-react";
import type { User } from "../../types/user.types";
import type { LeaveBalanceSnapshot, LeaveRecord, LeaveStatus } from "../../types/leave.types";
import { usePaginatedLeaveHistory } from "../../apis/api/leave";
import { LeaveHistoryTable } from "./LeaveHistoryTable";
import { Skeleton } from "../UI/Skeleton";

function defaultBalance(): LeaveBalanceSnapshot {
  return { totalBalance: 24, paidLeave: 12, leaveTaken: 0 };
}

function StatCard({ title, value, hint }: { title: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function balanceFromUser(user: User | undefined): LeaveBalanceSnapshot {
  const row = user?.leaves?.[0];
  if (row && typeof row === "object") {
    return {
      totalBalance: Number((row as LeaveBalanceSnapshot).totalBalance ?? 24),
      paidLeave: Number((row as LeaveBalanceSnapshot).paidLeave ?? 12),
      leaveTaken: Number((row as LeaveBalanceSnapshot).leaveTaken ?? 0),
    };
  }
  return defaultBalance();
}

/** Three stat cards + “How it works” (matches Time off page). */
export function LeaveBalanceSummary({
  user,
  userLoading,
  className = "",
}: {
  user: User | undefined;
  userLoading: boolean;
  className?: string;
}) {
  const balance = useMemo(() => balanceFromUser(user), [user]);

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Annual balance"
          value={
            userLoading ? (
              <Skeleton className="inline-block h-8 w-14 rounded-md" />
            ) : (
              String(balance.totalBalance)
            )
          }
          hint="Days remaining in your general pool"
        />
        <StatCard
          title="Paid leave (month)"
          value={
            userLoading ? (
              <Skeleton className="inline-block h-8 w-14 rounded-md" />
            ) : (
              String(balance.paidLeave)
            )
          }
          hint="First request each month may use paid days when available"
        />
        <StatCard
          title="Taken (tracked)"
          value={
            userLoading ? (
              <Skeleton className="inline-block h-8 w-14 rounded-md" />
            ) : (
              String(balance.leaveTaken)
            )
          }
          hint="Approved leave days only (pending and rejected do not count)"
        />
      </div>

      <div className="mt-4 flex gap-2 rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sm text-sky-950">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
        <p>
          <span className="font-medium">How it works:</span> Each calendar month, your first pending
          or approved request can draw from paid leave when you have paid days left. Additional days
          in that month use your annual balance or are marked unpaid if the pool is insufficient.
          Balances are reserved when you submit; if HR rejects, those days are returned.
          &quot;Taken&quot; increases only after approval. HR is notified by email when you submit;
          you receive email when a decision is made.
        </p>
      </div>
    </div>
  );
}

const STATUS_FILTERS: readonly { key: "all" | LeaveStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const PAGE_SIZE = 10;

/** Status chips + leave history table (server-paginated GET /leave). */
export function MyLeaveHistoryPanel({
  filtersClassName = "mt-8",
  tableClassName = "mt-4",
  enabled = true,
}: {
  filtersClassName?: string;
  tableClassName?: string;
  /** When false, skips fetching (e.g. tab not visible). */
  enabled?: boolean;
}) {
  const [statusFilter, setStatusFilter] = useState<"all" | LeaveStatus>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [statusFilter]);

  const { data, isLoading } = usePaginatedLeaveHistory({
    page,
    limit: PAGE_SIZE,
    status: statusFilter,
    enabled,
  });

  const leaves: LeaveRecord[] = data?.leaves ?? [];
  const pagination = data?.pagination;

  useEffect(() => {
    if (!pagination || pagination.total === 0) return;
    if (page > pagination.totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const tableLoading = isLoading && !data;
  const emptyFilter =
    !tableLoading && pagination && pagination.total === 0 && statusFilter !== "all";

  return (
    <>
      <div className={`flex flex-wrap items-center gap-2 ${filtersClassName}`}>
        <span className="text-sm font-medium text-slate-700">Filter:</span>
        {STATUS_FILTERS.map(({ key, label }) => (
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

      <div className={tableClassName}>
        <LeaveHistoryTable
          leaves={leaves}
          isLoading={tableLoading}
          showSectionHeader={false}
          showRequestLink={false}
          variant="slate"
          pageSize={0}
          serverPagination={
            pagination
              ? {
                  total: pagination.total,
                  page: pagination.page,
                  pageSize: pagination.limit,
                  onPageChange: setPage,
                }
              : undefined
          }
          emptyDescription={
            emptyFilter
              ? "No leave requests match this filter."
              : "No leave requests yet. Use Request leave above to add one."
          }
        />
      </div>
    </>
  );
}

/** Profile (and similar): title, link to /leave, balances, explainer, table. */
export function ProfileLeaveDashboard({
  user,
  userLoading,
}: {
  user: User | undefined;
  userLoading: boolean;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Time off</h2>
          <p className="mt-1 text-sm text-slate-600">
            Request leave, track balances, and review pending requests.
          </p>
        </div>
        <Link
          to="/leave"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Request leave
        </Link>
      </div>

      <LeaveBalanceSummary user={user} userLoading={userLoading} />

      <MyLeaveHistoryPanel filtersClassName="mt-8" tableClassName="mt-4" />
    </div>
  );
}
