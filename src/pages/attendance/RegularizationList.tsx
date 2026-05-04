import { useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRegularizations, useResolveRegularization } from "../../apis/api/attendance";
import { ApiError } from "../../apis/apiService";
import type { AttendanceRecord } from "../../types/attendance.types";
import { formatClock } from "./attendanceUtils";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";

const STATUS_UI = {
  pending: { icon: Clock, label: "Pending", className: "text-amber-700 bg-amber-50 ring-amber-200" },
  approved: { icon: CheckCircle, label: "Approved", className: "text-emerald-700 bg-emerald-50 ring-emerald-200" },
  rejected: { icon: XCircle, label: "Rejected", className: "text-red-700 bg-red-50 ring-red-200" },
};

interface ResolveModalState {
  record: AttendanceRecord;
  action: "approve" | "reject";
}

function ResolveModal({
  state,
  onClose,
}: {
  state: ResolveModalState;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const resolve = useResolveRegularization();
  const reg = state.record.regularization!;
  const isApprove = state.action === "approve";

  const userName =
    typeof state.record.user === "object" && state.record.user
      ? (state.record.user as { name?: string }).name ?? "Employee"
      : "Employee";

  const dateLabel = state.record.date
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(state.record.date))
    : "";

  const handleResolve = async () => {
    try {
      await resolve.mutateAsync({ id: state.record._id, action: state.action, resolverNote: note });
      toast.success(isApprove ? "Regularization approved and applied." : "Regularization rejected.");
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action failed.");
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isApprove ? "Approve Regularization" : "Reject Regularization"}
      panelClassName="max-w-md"
    >
      <div className="space-y-4">
        <div className={`rounded-lg px-4 py-3 text-sm ${isApprove ? "bg-emerald-50" : "bg-red-50"}`}>
          <p className={`font-medium ${isApprove ? "text-emerald-900" : "text-red-900"}`}>{userName}</p>
          <p className={`text-xs ${isApprove ? "text-emerald-600" : "text-red-600"}`}>{dateLabel}</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Requested times</p>
          <p className="text-slate-800">
            {formatClock(reg.requestedPunchIn as string)} → {formatClock(reg.requestedPunchOut as string)}
          </p>
          {reg.reason && <p className="text-xs text-slate-600 mt-1">Reason: {reg.reason}</p>}
        </div>

        {isApprove && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Approving will replace the existing attendance record with the requested times.
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Note <span className="text-slate-400">(optional)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
            placeholder={isApprove ? "Approved — times verified." : "Reason for rejection"}
          />
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="ghost" onClick={onClose} disabled={resolve.isPending}>
            Cancel
          </Button>
          <Button
            variant={isApprove ? "primary" : "danger"}
            onClick={handleResolve}
            disabled={resolve.isPending}
          >
            {resolve.isPending ? "Processing…" : isApprove ? "Approve" : "Reject"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface RegularizationListProps {
  orgContext?: string;
  canManage: boolean;
}

export function RegularizationList({ orgContext, canManage }: RegularizationListProps) {
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [resolveState, setResolveState] = useState<ResolveModalState | null>(null);

  const { data, isLoading, isError, error } = useRegularizations(statusFilter, orgContext, true);
  const records = data?.records ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-slate-700">Filter:</span>
        {(["pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Could not load regularization requests."}
        </div>
      )}

      {!isLoading && !isError && records.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center text-sm text-slate-500">
          No {statusFilter} regularization requests.
        </div>
      )}

      {!isLoading && !isError && records.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Requested Times</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Status</th>
                {canManage && statusFilter === "pending" && (
                  <th className="px-4 py-3 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const reg = record.regularization!;
                const status = reg?.status ?? "pending";
                const statusUi = STATUS_UI[status] ?? STATUS_UI.pending;
                const StatusIcon = statusUi.icon;
                const userName =
                  typeof record.user === "object" && record.user
                    ? (record.user as { name?: string }).name ?? "—"
                    : "—";
                const dateLabel = record.date
                  ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
                      new Date(record.date)
                    )
                  : "—";

                return (
                  <tr key={record._id} className="border-b border-slate-100 text-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-900">{userName}</td>
                    <td className="px-4 py-3 text-slate-600">{dateLabel}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatClock(reg?.requestedPunchIn as string)} →{" "}
                      {formatClock(reg?.requestedPunchOut as string)}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="truncate text-slate-600" title={reg?.reason}>
                        {reg?.reason ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${statusUi.className}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusUi.label}
                      </span>
                      {reg?.resolverNote && (
                        <p className="mt-1 text-xs text-slate-400 max-w-[160px] truncate" title={reg.resolverNote}>
                          Note: {reg.resolverNote}
                        </p>
                      )}
                    </td>
                    {canManage && statusFilter === "pending" && (
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setResolveState({ record, action: "approve" })}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setResolveState({ record, action: "reject" })}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pending regularization count badge */}
      {!isLoading && records.length > 0 && statusFilter === "pending" && (
        <div className="flex items-center gap-2 text-xs text-amber-700">
          <AlertCircle className="h-4 w-4" />
          {records.length} pending request{records.length !== 1 ? "s" : ""} awaiting review
        </div>
      )}

      {resolveState && (
        <ResolveModal state={resolveState} onClose={() => setResolveState(null)} />
      )}
    </div>
  );
}
