import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AttendanceRecord } from "../../types/attendance.types";
import { AttendanceWeekSkeleton } from "../../components/UI/Skeleton";
import { formatMs, recordDateYmd, recordUserId, shortDayHeading, userLabel } from "./attendanceUtils";

interface WeeklySummaryTableProps {
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
}

export function WeeklySummaryTable({
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
}: WeeklySummaryTableProps) {
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

    return rowKeys.map(({ id, name }) => {
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
  }, [records, days, isAdmin, selfUserId]);

  if (isLoading) {
    return <AttendanceWeekSkeleton isAdmin={isAdmin} dayCount={days.length} />;
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error?.message ?? "Could not load attendance."}
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
                <th className="sticky left-0 z-10 bg-slate-50/95 px-3 py-3">Employee</th>
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
              <tr key={row.id} className="border-b border-slate-100 text-slate-800">
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
                    <span title={c.rec ? String(c.rec.status) : undefined}>{c.display}</span>
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
