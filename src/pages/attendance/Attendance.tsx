import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getUserById } from "../../apis/api/auth";
import {
  addDays,
  localYmd,
  startOfWeekMonday,
  useAttendanceList,
  useAttendanceRange,
  weekDayYmds,
} from "../../apis/api/attendance";
import { PillTabBar } from "../../components/UI/PillTabBar";
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

function recordUserId(record: AttendanceRecord): string {
  const u = record.user;
  if (typeof u === "object" && u !== null && "_id" in u) {
    return String((u as { _id: string })._id);
  }
  if (typeof u === "string") return u;
  return "";
}

function recordDateYmd(record: AttendanceRecord): string {
  if (!record.date) return "";
  try {
    return localYmd(new Date(record.date));
  } catch {
    return "";
  }
}

function shortDayHeading(ymd: string): string {
  const [y, mo, d] = ymd.split("-").map(Number);
  if (!y || !mo || !d) return ymd;
  const dt = new Date(y, mo - 1, d);
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dt);
}

type ViewMode = "day" | "week";

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

function WeeklySummaryTable({
  days,
  records,
  isAdmin,
  selfUserId,
  isLoading,
  isError,
  error,
  weekLabel,
  onPrevWeek,
  onNextWeek,
}: {
  days: string[];
  records: AttendanceRecord[];
  isAdmin: boolean;
  selfUserId: string;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const matrix = useMemo(() => {
    const byUserAndDay = new Map<string, Map<string, AttendanceRecord>>();
    for (const r of records) {
      const uid = recordUserId(r);
      if (!uid) continue;
      const ymd = recordDateYmd(r);
      if (!ymd) continue;
      if (!byUserAndDay.has(uid)) byUserAndDay.set(uid, new Map());
      byUserAndDay.get(uid)!.set(ymd, r);
    }

    let rowKeys: { id: string; name: string }[] = [];
    if (isAdmin) {
      const seen = new Map<string, string>();
      for (const r of records) {
        const id = recordUserId(r);
        if (!id) continue;
        if (!seen.has(id)) seen.set(id, userLabel(r));
      }
      rowKeys = [...seen.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const uid =
        (records.length > 0 ? recordUserId(records[0]) : "") || selfUserId;
      rowKeys = [{ id: uid || "me", name: "Your hours" }];
    }

    const rows = rowKeys.map(({ id, name }) => {
      const dayMap = byUserAndDay.get(id) ?? new Map();
      let weekMs = 0;
      const cells = days.map((ymd) => {
        const rec = dayMap.get(ymd);
        const ms = rec?.dayWorkedMs ?? 0;
        weekMs += ms;
        return {
          ymd,
          rec,
          ms,
          display:
            rec && (ms > 0 || rec.status === "working" || rec.status === "on_break")
              ? rec.readableDayTotal ?? formatMs(ms)
              : "—",
        };
      });
      return { id, name, cells, weekMs };
    });

    return rows;
  }, [records, days, isAdmin, selfUserId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading week…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {(error as Error)?.message ?? "Could not load attendance."}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
        No attendance in this week yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-700">{weekLabel}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {isAdmin && (
                <th className="sticky left-0 z-10 bg-slate-50/95 px-3 py-3">
                  Employee
                </th>
              )}
              {days.map((ymd) => (
                <th key={ymd} className="px-2 py-3 text-center">
                  {shortDayHeading(ymd)}
                </th>
              ))}
              <th className="px-3 py-3 text-center">Week total</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-100 text-slate-800"
              >
                {isAdmin && (
                  <td className="sticky left-0 z-10 bg-white px-3 py-3 font-medium text-slate-900">
                    {row.name}
                  </td>
                )}
                {row.cells.map((c) => (
                  <td
                    key={c.ymd}
                    className="px-2 py-3 text-center tabular-nums text-slate-700"
                  >
                    <span title={c.rec ? String(c.rec.status) : undefined}>
                      {c.display}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-3 text-center font-semibold tabular-nums text-slate-900">
                  {formatMs(row.weekMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Attendance() {
  const userId = localStorage.getItem("userId") ?? "";
  const { data: user } = getUserById(userId);
  const [view, setView] = useState<ViewMode>("day");
  const [date, setDate] = useState(() => localYmd());
  const [weekMonday, setWeekMonday] = useState(() => startOfWeekMonday());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    const roles = user?.role;
    if (!Array.isArray(roles)) return false;
    return roles.includes("admin") || roles.includes("super-admin");
  }, [user?.role]);

  const weekFrom = localYmd(weekMonday);
  const weekTo = localYmd(addDays(weekMonday, 6));
  const weekDays = useMemo(() => weekDayYmds(weekMonday), [weekMonday]);

  const weekLabelFull = useMemo(() => {
    const a = shortDayHeading(weekFrom);
    const b = shortDayHeading(weekTo);
    const y = weekMonday.getFullYear();
    return `${a} – ${b}, ${y}`;
  }, [weekFrom, weekTo, weekMonday]);

  const { data, isLoading, isError, error } = useAttendanceList(
    date,
    !!userId && view === "day"
  );

  const {
    data: weekData,
    isLoading: weekLoading,
    isError: weekError,
    error: weekErr,
  } = useAttendanceRange(weekFrom, weekTo, !!userId && view === "week");

  const rows = data?.attendance ?? [];
  const weekRows = weekData?.attendance ?? [];

  return (
    <div className="min-h-0 flex-1 space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {view === "day"
              ? isAdmin
                ? "All team members for the selected day."
                : "Your clock in, breaks, and clock out for the selected day."
              : isAdmin
                ? "Worked time per day for everyone (Mon–Sun)."
                : "Your worked time for each day this week."}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <PillTabBar
            size="sm"
            items={[
              { key: "day", label: "Day" },
              { key: "week", label: "Week" },
            ]}
            activeKey={view}
            onTabChange={(k) => setView(k as ViewMode)}
          />
          {view === "day" ? (
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
          ) : (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              <span className="sr-only">Jump to week</span>
              <input
                type="date"
                value={localYmd(weekMonday)}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) return;
                  const [y, m, d] = v.split("-").map(Number);
                  setWeekMonday(startOfWeekMonday(new Date(y, m - 1, d)));
                }}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </label>
          )}
        </div>
      </div>

      {view === "week" && (
        <WeeklySummaryTable
          days={weekDays}
          records={weekRows}
          isAdmin={isAdmin}
          selfUserId={userId}
          isLoading={weekLoading}
          isError={weekError}
          error={weekErr as Error | null}
          weekLabel={weekLabelFull}
          onPrevWeek={() =>
            setWeekMonday((m) => addDays(m, -7))
          }
          onNextWeek={() =>
            setWeekMonday((m) => addDays(m, 7))
          }
        />
      )}

      {view === "day" && isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading attendance…
        </div>
      )}

      {view === "day" && isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Could not load attendance."}
        </div>
      )}

      {view === "day" && !isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
          No attendance record for this date.
          {isAdmin
            ? " No one has clocked in yet, or records are on another day."
            : " Clock in from the header when your shift starts."}
        </div>
      )}

      {view === "day" && !isLoading && !isError && rows.length > 0 && (
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
