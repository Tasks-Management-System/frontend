import { ChevronDown, ChevronRight, PencilLine, SendHorizonal, ShieldAlert, Clock } from "lucide-react";
import type { AttendanceRecord, AttendanceSegment } from "../../types/attendance.types";
import { breakLineText, formatClock, formatMs } from "./attendanceUtils";

export const STATUS_UI: Record<string, { label: string; className: string }> = {
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
  holiday: {
    label: "Holiday",
    className: "bg-purple-50 text-purple-800 ring-1 ring-purple-200/80",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const ui = STATUS_UI[status] ?? { label: status, className: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80" };
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
  /** Admin/HR can correct this record */
  canManage?: boolean;
  /** Employee (or manager) can request regularization on this specific record */
  canRegularize?: boolean;
  onCorrect?: (record: AttendanceRecord) => void;
  onRegularize?: (record: AttendanceRecord) => void;
}

export function AttendanceRow({
  record,
  showUser,
  expanded,
  onToggle,
  canManage = false,
  canRegularize = false,
  onCorrect,
  onRegularize,
}: AttendanceRowProps) {
  const breaks = record.breaks ?? [];
  const segments = record.segments ?? [];
  const hasDetail = segments.length > 0 || breaks.length > 0 || record.punchInTime;

  const regStatus = record.regularization?.status;
  const hasPendingReg = regStatus === "pending";

  // Total columns: user(optional) + status + clockIn + breaks + clockOut + dayTotal + actions
  const colSpan = (showUser ? 7 : 6) + (canManage || canRegularize ? 1 : 0);

  return (
    <>
      <tr className="border-b border-slate-100 text-sm text-slate-800">
        {showUser && (
          <td className="py-3 px-4 font-medium text-slate-900">
            <div className="flex flex-col">
              <span className="max-w-[120px] truncate">
                {typeof record.user === "object" && record.user && "name" in record.user
                  ? ((record.user as { name?: string }).name ?? "—")
                  : "—"}
              </span>
              {record.isManuallyEdited && (
                <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] text-violet-500">
                  <ShieldAlert className="h-2.5 w-2.5" />
                  Corrected
                </span>
              )}
            </div>
          </td>
        )}
        <td className="py-3 pr-4">
          <div className="flex flex-col gap-1">
            <StatusBadge status={String(record.status)} />
            {hasPendingReg && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600">
                <Clock className="h-2.5 w-2.5" />
                Reg. pending
              </span>
            )}
            {regStatus === "approved" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                Reg. approved
              </span>
            )}
          </div>
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
          {record.note && (
            <p className="mt-0.5 max-w-[120px] truncate text-[10px] text-slate-400" title={record.note}>
              {record.note}
            </p>
          )}
        </td>

        {/* Detail expand */}
        <td className="py-3 text-right pr-2">
          {hasDetail ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              Detail
            </button>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>

        {/* Action buttons column */}
        {(canManage || canRegularize) && (
          <td className="py-3 pr-4 text-right">
            <div className="flex items-center justify-end gap-1">
              {canManage && onCorrect && (
                <button
                  type="button"
                  onClick={() => onCorrect(record)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                  title="Correct attendance"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              {canRegularize && onRegularize && !hasPendingReg && (
                <button
                  type="button"
                  onClick={() => onRegularize(record)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                  title="Request attendance correction"
                >
                  <SendHorizonal className="h-3.5 w-3.5" />
                  Request
                </button>
              )}
            </div>
          </td>
        )}
      </tr>

      {expanded && hasDetail && (
        <tr className="border-b border-slate-100 bg-slate-50/50">
          <td colSpan={colSpan} className="px-4 py-4 text-left">
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
              {record.regularization && (
                <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <p className="font-medium text-slate-700">Regularization Request</p>
                  <p>Status: <span className="font-medium">{record.regularization.status}</span></p>
                  {record.regularization.reason && <p>Reason: {record.regularization.reason}</p>}
                  {record.regularization.requestedPunchIn && (
                    <p>
                      Requested: {formatClock(record.regularization.requestedPunchIn as string)} →{" "}
                      {formatClock(record.regularization.requestedPunchOut as string)}
                    </p>
                  )}
                  {record.regularization.resolverNote && (
                    <p>Resolver note: {record.regularization.resolverNote}</p>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
