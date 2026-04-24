import { ChevronDown, ChevronRight } from "lucide-react";
import type { AttendanceRecord, AttendanceSegment } from "../../types/attendance.types";
import { breakLineText, formatClock, formatMs } from "./attendanceUtils";

const STATUS_UI: Record<string, { label: string; className: string }> = {
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

export function StatusBadge({ status }: { status: string }) {
  const ui = STATUS_UI[status] ?? {
    label: status,
    className: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ui.className}`}>
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
          {seg.breaks!.map((b, j) => (
            <div key={j} className="text-xs text-slate-600">
              Break {j + 1}: {breakLineText(b)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AttendanceRowProps {
  record: AttendanceRecord;
  showUser: boolean;
  expanded: boolean;
  onToggle: () => void;
}

export function AttendanceRow({ record, showUser, expanded, onToggle }: AttendanceRowProps) {
  const breaks = record.breaks ?? [];
  const segments = record.segments ?? [];
  const hasDetail = segments.length > 0 || breaks.length > 0 || record.punchInTime;

  return (
    <>
      <tr className="border-b border-slate-100 text-sm text-slate-800">
        {showUser && (
          <td className="py-3 pr-4 font-medium text-slate-900">
            {typeof record.user === "object" && record.user && "name" in record.user
              ? ((record.user as { name?: string }).name ?? "—")
              : "—"}
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
              breaks.map((b, idx) => (
                <div key={idx} className="text-xs text-slate-600">
                  Break {idx + 1}: {breakLineText(b)}
                </div>
              ))
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
          <td colSpan={showUser ? 7 : 6} className="px-4 py-4 text-left">
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
