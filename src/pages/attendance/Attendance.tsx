import { getUserId } from "../../utils/auth";
import { useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { useUserById } from "../../apis/api/auth";
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
import { shortDayHeading } from "./attendanceUtils";

type ViewMode = "day" | "week";

export default function Attendance() {
  const userId = getUserId();
  const { data: user } = useUserById(userId);
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

  const { data, isLoading, isError, error } = useAttendanceList(date, !!userId && view === "day");

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
          onPrevWeek={() => setWeekMonday((m) => addDays(m, -7))}
          onNextWeek={() => setWeekMonday((m) => addDays(m, 7))}
        />
      )}

      {view === "day" && isLoading && <AttendanceDayTableSkeleton showUser={isAdmin} />}

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
                  onToggle={() => setExpandedId((id) => (id === record._id ? null : record._id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
