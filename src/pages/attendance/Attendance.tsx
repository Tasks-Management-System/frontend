import { getUserId } from "../../utils/session";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useUserById } from "../../apis/api/auth";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import {
  addDays,
  localYmd,
  startOfWeekMonday,
  useAttendanceList,
  useAttendanceRange,
  weekDayYmds,
} from "../../apis/api/attendance";
import { PillTabBar } from "../../components/UI/PillTabBar";
import { AttendanceDayTableSkeleton } from "../../components/UI/Skeleton";
import { AttendanceRow } from "./AttendanceRow";
import { WeeklySummaryTable } from "./WeeklySummaryTable";
import { AttendanceSummaryCards } from "./AttendanceSummaryCards";
import { RegularizationList } from "./RegularizationList";
import { AttendanceCorrectionModal } from "./AttendanceCorrectionModal";
import { RegularizationModal } from "./RegularizationModal";
import { shortDayHeading } from "./attendanceUtils";
import type { AttendanceRecord } from "../../types/attendance.types";

type ViewMode = "day" | "week" | "summary" | "requests";

export default function Attendance() {
  const userId = getUserId();
  const { data: user } = useUserById(userId);
  const { activeMode } = useActiveOrg();

  const [view, setView] = useState<ViewMode>("week");
  const [date, setDate] = useState(() => localYmd());
  const [weekMonday, setWeekMonday] = useState(() => startOfWeekMonday());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Correction / regularization modal state
  const [correctionRecord, setCorrectionRecord] = useState<AttendanceRecord | null>(null);
  const [regularizeRecord, setRegularizeRecord] = useState<AttendanceRecord | null>(null);

  // ── Role detection ───────────────────────────────────────────────────────────
  const roles: string[] = useMemo(() => {
    const r = user?.role;
    if (Array.isArray(r)) return r;
    if (typeof r === "string") return [r];
    return [];
  }, [user?.role]);

  const isSuperAdmin = roles.includes("super-admin");
  const isAdmin = roles.includes("admin") || isSuperAdmin;
  const isHr = roles.includes("hr");
  const isManager = roles.includes("manager");

  /** Can correct records and approve regularizations */
  const canManage = isAdmin || isHr;
  /** Can view team-wide data */
  const canViewTeam = canManage || isManager;

  // ── Date helpers ─────────────────────────────────────────────────────────────
  const weekFrom = localYmd(weekMonday);
  const weekTo = localYmd(addDays(weekMonday, 6));
  const weekDays = useMemo(() => weekDayYmds(weekMonday), [weekMonday]);

  const weekLabelFull = useMemo(() => {
    const a = shortDayHeading(weekFrom);
    const b = shortDayHeading(weekTo);
    const y = weekMonday.getFullYear();
    return `${a} – ${b}, ${y}`;
  }, [weekFrom, weekTo, weekMonday]);

  // ── Data fetching ────────────────────────────────────────────────────────────
  const { data, isLoading, isError, error } = useAttendanceList(
    date,
    !!userId && view === "day",
    activeMode
  );

  const {
    data: weekData,
    isLoading: weekLoading,
    isError: weekError,
    error: weekErr,
  } = useAttendanceRange(weekFrom, weekTo, !!userId && view === "week", activeMode);

  const rows = data?.attendance ?? [];
  const weekRows = weekData?.attendance ?? [];

  // ── View tab config ─────────────────────────────────────────────────────────
  const tabs = useMemo(() => {
    const base = [
      { key: "week", label: "Week" },
      { key: "day", label: "Day" },
      { key: "summary", label: "Summary" },
    ];
    if (canViewTeam) base.push({ key: "requests", label: "Requests" });
    return base;
  }, [canViewTeam]);

  const viewDescriptions: Record<ViewMode, string> = {
    week: canViewTeam
      ? "Worked time per day for everyone (Mon–Sun)."
      : "Your worked time for each day this week.",
    day: canViewTeam
      ? "All team members for the selected day."
      : "Your clock in, breaks, and clock out for the selected day.",
    summary: canViewTeam
      ? "Attendance stats for the selected period."
      : "Your attendance stats for the selected period.",
    requests: "Attendance regularization requests from team members.",
  };

  return (
    <div className="min-h-0 flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-slate-900">
            Attendance
          </h1>
          <p className="mt-1 text-sm text-slate-500">{viewDescriptions[view]}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <PillTabBar
            size="sm"
            items={tabs}
            activeKey={view}
            onTabChange={(k) => setView(k as ViewMode)}
          />

          {view === "day" && (
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
          )}

          {view === "week" && (
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

      {/* ── Week View ─────────────────────────────────────────────────────────── */}
      {view === "week" && (
        <WeeklySummaryTable
          days={weekDays}
          records={weekRows}
          isAdmin={canViewTeam}
          selfUserId={userId}
          isLoading={weekLoading}
          isError={weekError}
          error={weekErr as Error | null}
          weekLabel={weekLabelFull}
          onPrevWeek={() => setWeekMonday((m) => addDays(m, -7))}
          onNextWeek={() => setWeekMonday((m) => addDays(m, 7))}
        />
      )}

      {/* ── Day View ──────────────────────────────────────────────────────────── */}
      {view === "day" && isLoading && <AttendanceDayTableSkeleton showUser={canViewTeam} />}

      {view === "day" && isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Could not load attendance."}
        </div>
      )}

      {view === "day" && !isLoading && !isError && rows.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
          No attendance record for this date.
          {canViewTeam
            ? " No one has clocked in yet, or records are on another day."
            : " Clock in from the header when your shift starts."}
        </div>
      )}

      {view === "day" && !isLoading && !isError && rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {canViewTeam && <th className="px-4 py-3">Employee</th>}
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Breaks</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3">Day Total</th>
                <th className="px-4 py-3 text-right">Detail</th>
                {(canManage || !canViewTeam) && (
                  <th className="px-4 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((record) => {
                const recordUserId =
                  typeof record.user === "object" && record.user
                    ? String((record.user as { _id: string })._id)
                    : String(record.user ?? "");
                const isOwnRecord = recordUserId === String(userId);

                return (
                  <AttendanceRow
                    key={record._id}
                    record={record}
                    showUser={canViewTeam}
                    expanded={expandedId === record._id}
                    onToggle={() =>
                      setExpandedId((id) => (id === record._id ? null : record._id))
                    }
                    canManage={canManage}
                    canRegularize={isOwnRecord && !canManage}
                    onCorrect={(r) => setCorrectionRecord(r)}
                    onRegularize={(r) => setRegularizeRecord(r)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Summary View ──────────────────────────────────────────────────────── */}
      {view === "summary" && (
        <AttendanceSummaryCards
          orgContext={activeMode}
          canViewTeam={canViewTeam}
          selfUserId={userId}
        />
      )}

      {/* ── Requests View (admin / hr / manager) ─────────────────────────────── */}
      {view === "requests" && canViewTeam && (
        <RegularizationList orgContext={activeMode} canManage={canManage} />
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────── */}
      <AttendanceCorrectionModal
        record={correctionRecord}
        isOpen={correctionRecord !== null}
        onClose={() => setCorrectionRecord(null)}
      />

      <RegularizationModal
        record={regularizeRecord}
        isOpen={regularizeRecord !== null}
        onClose={() => setRegularizeRecord(null)}
      />
    </div>
  );
}
