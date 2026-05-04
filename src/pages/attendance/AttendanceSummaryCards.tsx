import { useMemo, useState } from "react";
import { CalendarCheck, CalendarX, Clock, TrendingUp, AlertCircle, Timer } from "lucide-react";
import {
  addDays,
  endOfMonth,
  localYmd,
  startOfMonth,
  useAttendanceSummary,
} from "../../apis/api/attendance";
import type { AttendanceSummary } from "../../types/attendance.types";
import { PillTabBar } from "@/components/UI/PillTabBar";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  colorClass: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${colorClass}`}>{value}</p>
          {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
        </div>
        <div
          className={`rounded-lg p-2 ${colorClass.replace("text-", "bg-").replace("-700", "-100").replace("-800", "-100")}`}
        >
          <Icon className={`h-5 w-5 ${colorClass}`} />
        </div>
      </div>
    </div>
  );
}

interface SummaryDisplayProps {
  summary: AttendanceSummary;
}

function SummaryDisplay({ summary }: SummaryDisplayProps) {
  const attendancePct =
    summary.period.totalCalendarDays > 0
      ? Math.round((summary.presentDays / summary.period.totalCalendarDays) * 100)
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatCard
        icon={CalendarCheck}
        label="Present Days"
        value={summary.presentDays}
        sub={`${attendancePct}% attendance`}
        colorClass="text-emerald-700"
      />
      <StatCard
        icon={CalendarX}
        label="Absent Days"
        value={summary.absentDays}
        sub={`of ${summary.period.totalCalendarDays} calendar days`}
        colorClass="text-red-700"
      />
      <StatCard
        icon={Clock}
        label="Total Hours"
        value={summary.readableTotalTime}
        sub="this period"
        colorClass="text-violet-700"
      />
      <StatCard
        icon={TrendingUp}
        label="Avg / Day"
        value={summary.readableAvgDaily}
        sub="on working days"
        colorClass="text-blue-700"
      />
      <StatCard
        icon={AlertCircle}
        label="Late Arrivals"
        value={summary.lateArrivals}
        sub="after 9:30 AM"
        colorClass="text-amber-700"
      />
      <StatCard
        icon={Timer}
        label="Overtime"
        value={summary.readableOvertime}
        sub="beyond 8h / day"
        colorClass="text-indigo-700"
      />
    </div>
  );
}

interface AttendanceSummaryCardsProps {
  orgContext?: string;
  canViewTeam: boolean;
  selfUserId?: string;
}

export function AttendanceSummaryCards({
  orgContext,
  canViewTeam,
  selfUserId,
}: AttendanceSummaryCardsProps) {
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState(() => localYmd(startOfMonth(today)));
  const [to, setTo] = useState(() => localYmd(endOfMonth(today)));

  const { data, isLoading, isError } = useAttendanceSummary(from, to, true, orgContext);

  const summaries = data?.summaries ?? [];

  // For non-team-viewers, only show their own summary
  const displaySummaries = useMemo(() => {
    if (canViewTeam) return summaries;
    return summaries.filter((s) => String(s.user._id) === String(selfUserId));
  }, [summaries, canViewTeam, selfUserId]);

  const quickRanges = useMemo(() => {
    const mo = new Date(today.getFullYear(), today.getMonth(), 1);
    const moEnd = endOfMonth(today);
    const lastMoStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMoEnd = endOfMonth(lastMoStart);
    const weekStart = (() => {
      const d = new Date(today);
      d.setHours(0, 0, 0, 0);
      const dow = d.getDay();
      d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
      return d;
    })();

    return [
      { label: "This month", from: localYmd(mo), to: localYmd(moEnd) },
      { label: "Last month", from: localYmd(lastMoStart), to: localYmd(lastMoEnd) },
      { label: "This week", from: localYmd(weekStart), to: localYmd(addDays(weekStart, 6)) },
    ];
  }, [today]);

  const periodPillItems = useMemo(
    () => quickRanges.map((r) => ({ key: r.label, label: r.label })),
    [quickRanges]
  );

  const activePeriodKey = useMemo(
    () => quickRanges.find((r) => r.from === from && r.to === to)?.label ?? "",
    [quickRanges, from, to]
  );

  return (
    <div className="space-y-4">
      {/* Period picker */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Period:</span>
        <PillTabBar
          size="sm"
          items={periodPillItems}
          activeKey={activePeriodKey}
          onTabChange={(key) => {
            const range = quickRanges.find((r) => r.label === key);
            if (!range) return;
            setFrom(range.from);
            setTo(range.to);
          }}
        />
        <div className="flex items-center gap-2 ml-auto text-sm text-slate-500">
          <input
            type="date"
            value={from}
            max={to}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-violet-500 focus:outline-none"
          />
          <span>to</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Could not load attendance summary.
        </div>
      )}

      {!isLoading && !isError && displaySummaries.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-8 text-center text-sm text-slate-500">
          No attendance data for the selected period.
        </div>
      )}

      {!isLoading &&
        !isError &&
        displaySummaries.map((summary) => (
          <div key={summary.user._id} className="space-y-3">
            {canViewTeam && displaySummaries.length > 1 && (
              <p className="text-sm font-semibold text-slate-800">
                {summary.user.name ?? summary.user.email ?? "Employee"}
              </p>
            )}
            <SummaryDisplay summary={summary} />
          </div>
        ))}
    </div>
  );
}
