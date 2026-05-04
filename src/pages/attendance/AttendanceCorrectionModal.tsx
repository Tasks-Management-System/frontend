import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { PencilLine } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import { useCorrectAttendance } from "../../apis/api/attendance";
import { ApiError } from "../../apis/apiService";
import type { AttendanceRecord } from "../../types/attendance.types";
import { formatClock } from "./attendanceUtils";

const correctionSchema = z
  .object({
    punchInTime: z.string().min(1, "Clock-in time is required"),
    punchOutTime: z.string().min(1, "Clock-out time is required"),
    note: z.string().max(500).optional(),
  })
  .refine((d) => new Date(d.punchOutTime) > new Date(d.punchInTime), {
    message: "Clock-out must be after clock-in",
    path: ["punchOutTime"],
  });

type CorrectionForm = z.infer<typeof correctionSchema>;

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

export function AttendanceCorrectionModal({ record, isOpen, onClose }: Props) {
  const correct = useCorrectAttendance();

  const userName =
    typeof record?.user === "object" && record?.user
      ? ((record.user as { name?: string }).name ?? "Employee")
      : "Employee";

  const dateLabel = record?.date
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(new Date(record.date))
    : "";

  // Default punch times: use existing segment[0].punchInTime / last segment's punchOutTime
  const defaultIn = toDatetimeLocal(record?.segments?.[0]?.punchInTime ?? record?.punchInTime);
  const defaultOut = toDatetimeLocal(
    record?.segments?.[record.segments!.length - 1]?.punchOutTime ?? record?.punchOutTime
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CorrectionForm>({
    resolver: zodResolver(correctionSchema),
    defaultValues: { punchInTime: defaultIn, punchOutTime: defaultOut, note: "" },
  });

  useEffect(() => {
    if (isOpen) {
      reset({ punchInTime: defaultIn, punchOutTime: defaultOut, note: record?.note ?? "" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, record?._id]);

  const onSubmit = async (values: CorrectionForm) => {
    if (!record) return;
    try {
      await correct.mutateAsync({
        id: record._id,
        punchInTime: new Date(values.punchInTime).toISOString(),
        punchOutTime: new Date(values.punchOutTime).toISOString(),
        note: values.note,
      });
      toast.success("Attendance corrected successfully.");
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to correct attendance.";
      toast.error(msg);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Correct Attendance" panelClassName="max-w-lg">
      <div className="space-y-4">
        <div className="rounded-lg bg-violet-50 px-4 py-3 text-sm">
          <p className="font-medium text-violet-900">{userName}</p>
          <p className="text-violet-600">{dateLabel}</p>
          {record?.punchInTime && (
            <p className="mt-1 text-xs text-violet-500">
              Current: {formatClock(record.punchInTime)} → {formatClock(record.punchOutTime)}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clock In</label>
              <input
                type="datetime-local"
                {...register("punchInTime")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              {errors.punchInTime && (
                <p className="mt-1 text-xs text-red-600">{errors.punchInTime.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Clock Out</label>
              <input
                type="datetime-local"
                {...register("punchOutTime")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              {errors.punchOutTime && (
                <p className="mt-1 text-xs text-red-600">{errors.punchOutTime.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Reason / Note <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              {...register("note")}
              rows={2}
              placeholder="e.g. Employee forgot to clock in via system"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
            />
            {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-2">
              <PencilLine className="h-4 w-4" />
              {isSubmitting ? "Saving…" : "Apply Correction"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
