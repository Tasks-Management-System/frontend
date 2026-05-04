import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { SendHorizonal } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import { useRequestRegularization } from "../../apis/api/attendance";
import { ApiError } from "../../apis/apiService";
import type { AttendanceRecord } from "../../types/attendance.types";
import { formatClock } from "./attendanceUtils";

const schema = z
  .object({
    requestedPunchIn: z.string().min(1, "Requested clock-in is required"),
    requestedPunchOut: z.string().min(1, "Requested clock-out is required"),
    reason: z.string().min(10, "Please describe the reason (min 10 characters)").max(500),
  })
  .refine((d) => new Date(d.requestedPunchOut) > new Date(d.requestedPunchIn), {
    message: "Clock-out must be after clock-in",
    path: ["requestedPunchOut"],
  });

type FormValues = z.infer<typeof schema>;

function toDatetimeLocal(iso?: string | null): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

interface Props {
  record: AttendanceRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RegularizationModal({ record, isOpen, onClose }: Props) {
  const request = useRequestRegularization();

  const dateLabel = record?.date
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(record.date))
    : "";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { requestedPunchIn: "", requestedPunchOut: "", reason: "" },
  });

  useEffect(() => {
    if (isOpen) {
      const pIn = record?.segments?.[0]?.punchInTime ?? record?.punchInTime;
      const pOut =
        record?.segments?.[record.segments!.length - 1]?.punchOutTime ?? record?.punchOutTime;
      reset({
        requestedPunchIn: toDatetimeLocal(pIn),
        requestedPunchOut: toDatetimeLocal(pOut),
        reason: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, record?._id]);

  const onSubmit = async (values: FormValues) => {
    if (!record) return;
    try {
      await request.mutateAsync({
        id: record._id,
        reason: values.reason,
        requestedPunchIn: new Date(values.requestedPunchIn).toISOString(),
        requestedPunchOut: new Date(values.requestedPunchOut).toISOString(),
      });
      toast.success("Regularization request submitted. Awaiting approval.");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit request.";
      toast.error(msg);
    }
  };

  const hasPending = record?.regularization?.status === "pending";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Attendance Correction"
      panelClassName="max-w-lg"
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm">
          <p className="font-medium text-amber-900">{dateLabel}</p>
          <p className="mt-0.5 text-amber-700 text-xs">
            Recorded: {formatClock(record?.punchInTime)} → {formatClock(record?.punchOutTime)}
          </p>
        </div>

        {hasPending ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
            <p className="font-medium">Pending request already submitted</p>
            <p className="mt-1 text-xs text-amber-600">
              Your request is awaiting approval. You cannot submit another until the current one is
              resolved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Requested Clock In
                </label>
                <input
                  type="datetime-local"
                  {...register("requestedPunchIn")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                {errors.requestedPunchIn && (
                  <p className="mt-1 text-xs text-red-600">{errors.requestedPunchIn.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Requested Clock Out
                </label>
                <input
                  type="datetime-local"
                  {...register("requestedPunchOut")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                {errors.requestedPunchOut && (
                  <p className="mt-1 text-xs text-red-600">{errors.requestedPunchOut.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Reason</label>
              <textarea
                {...register("reason")}
                rows={3}
                placeholder="e.g. Forgot to punch in — was working from 9 AM"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                <SendHorizonal className="h-4 w-4" />
                {isSubmitting ? "Submitting…" : "Submit Request"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
