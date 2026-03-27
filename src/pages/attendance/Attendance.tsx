import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  Loader2,
} from "lucide-react";
import { getUserById } from "../../apis/api/auth";
import { localYmd, useAttendanceList } from "../../apis/api/attendance";
import type {
  AttendanceBreak,
  AttendanceRecord,
  AttendanceSegment,
} from "../../types/attendance.types";

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function formatClock(iso?: string | null) {
  if (!iso) return "—";
  try {
    return timeFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

function formatMs(ms?: number) {
  if (ms === undefined || ms === null || Number.isNaN(ms) || ms < 0) return "—";
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h) return `${h}h ${min}m`;
  return `${min}m`;
}

function breakLine(b: AttendanceBreak, idx: number) {
  const start = formatClock(b.breakStart ?? null);
  const end = b.breakEnd ? formatClock(b.breakEnd) : "ongoing";
  const dur =
    b.totalBreakTime !== undefined && b.totalBreakTime !== null
      ? ` (${formatMs(b.totalBreakTime)})`
      : "";
  return (
    <div key={idx} className="text-xs text-slate-600">
      Break {idx + 1}: {start} – {end}
      {dur}
    </div>
  );
}

function userLabel(record: AttendanceRecord) {
  const u = record.user;
  if (typeof u === "object" && u !== null && "name" in u) {
    return (u as { name?: string }).name ?? "—";
  }
  return "—";
}

const STATUS_UI: Record<
  string,
  { label: string; className: string }
> = {
  not_started: {
    label: "Not started",
    className: "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  },
  working: {
    label: "Working",
    className: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  },
  on_break: {
    label: "On break",
    className: "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
  },
  completed: {
    label: "Completed",
    className: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/80",
  },
};

function StatusBadge({ status }: { status: string }) {
  const ui = STATUS_UI[status] ?? {
    label: status,
    className: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ui.className}`}
    >
      {ui.label}
    </span>
  );
}

function SegmentBlock({ seg, i }: { seg: AttendanceSegment; i: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm">
      <p className="font-medium text-slate-800">
        Session {i + 1}: {formatClock(seg.punchInTime ?? null)} →{" "}
        {formatClock(seg.punchOutTime ?? null)}
      </p>
      {seg.totalTime !== undefined && (
        <p className="text-xs text-slate-500">Worked: {formatMs(seg.totalTime)}</p>
      )}
      {(seg.breaks?.length ?? 0) > 0 && (
        <div className="mt-2 space-y-1 border-t border-slate-200/80 pt-2">
          {seg.breaks!.map((b, j) => breakLine(b, j))}
        </div>
      )}
    </div>
  );
}

function AttendanceRow({
  record,
  showUser,
  expanded,
  onToggle,
}: {
  record: AttendanceRecord;
  showUser: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const breaks = record.breaks ?? [];
  const segments = record.segments ?? [];
  const hasDetail =
    segments.length > 0 || breaks.length > 0 || record.punchInTime;

  return (
    <>
      <tr className="border-b border-slate-100 text-sm text-slate-800">
        {showUser && (
          <td className="py-3 pr-4 font-medium text-slate-900">
            {userLabel(record)}
          </td>
        )}
        <td className="py-3 pr-4">
          <StatusBadge status={String(record.status)} />
        </td>
        <td className="py-3 pr-4 tabular-nums">{formatClock(record.punchInTime)}</td>
        <td className="py-3 pr-4">
          <div className="max-w-xs space-y-1">
            {breaks.length === 0 ? (
              <span className="text-slate-400">—</span>
            ) : (
              breaks.map((b, idx) => breakLine(b, idx))
            )}
          </div>
        </td>
        <td className="py-3 pr-4 tabular-nums">{formatClock(record.punchOutTime)}</td>
        <td className="py-3 pr-4 font-medium tabular-nums text-slate-900">
          {record.readableDayTotal ?? formatMs(record.dayWorkedMs) ?? "—"}
        </td>
        <td className="py-3 text-right">
          {hasDetail ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
              Detail
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      </tr>
      {expanded && hasDetail && (
        <tr className="border-b border-slate-100 bg-slate-50/50">
          <td
            colSpan={showUser ? 7 : 6}
            className="px-4 py-4 text-left"
          >
            <div className="space-y-3">
              {segments.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {segments.map((seg, i) => (
                    <SegmentBlock key={i} seg={seg} i={i} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  Clock in: {formatClock(record.punchInTime)} · Clock out:{" "}
                  {formatClock(record.punchOutTime)}
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function Attendance() {
  const userId = localStorage.getItem("userId") ?? "";
  const { data: user } = getUserById(userId);
  const [date, setDate] = useState(() => localYmd());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    const roles = user?.role;
    if (!Array.isArray(roles)) return false;
    return roles.includes("admin") || roles.includes("super-admin");
  }, [user?.role]);

  const { data, isLoading, isError, error } = useAttendanceList(date, !!userId);

  const rows = data?.attendance ?? [];

  return (
    <div className="min-h-0 flex-1 space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isAdmin
              ? "All team members for the selected day."
              : "Your clock in, breaks, and clock out for the selected day."}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span className="sr-only">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </label>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading attendance…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Could not load attendance."}
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
          No attendance record for this date.
          {isAdmin
            ? " No one has clocked in yet, or records are on another day."
            : " Clock in from the header when your shift starts."}
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {isAdmin && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Clock in</th>
                <th className="px-4 py-3">Breaks</th>
                <th className="px-4 py-3">Clock out</th>
                <th className="px-4 py-3">Day total</th>
                <th className="px-4 py-3 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => (
                <AttendanceRow
                  key={record._id}
                  record={record}
                  showUser={isAdmin}
                  expanded={expandedId === record._id}
                  onToggle={() =>
                    setExpandedId((id) => (id === record._id ? null : record._id))
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
