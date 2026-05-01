import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useApplyLeave } from "../../apis/api/leave";
import { localYmd } from "../../apis/api/attendance";
import { ApiError } from "../../apis/apiService";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Model";
import type { LeaveDaysMode, LeaveSubType } from "../../types/leave.types";

const leaveSchema = z
  .object({
    daysMode: z.enum(["single", "multiple"]),
    subType: z.enum(["fullDay", "halfDay"]),
    fromDate: z.string().min(1, "Start date is required"),
    toDate: z.string().optional(),
    reason: z.string().min(1, "Please describe the reason for your leave.").max(1000),
  })
  .refine(
    (data) => {
      if (data.daysMode === "multiple") {
        if (!data.toDate) return false;
        return new Date(data.toDate) >= new Date(data.fromDate);
      }
      return true;
    },
    {
      message: "End date must be on or after the start date.",
      path: ["toDate"],
    }
  );

type LeaveFormValues = z.infer<typeof leaveSchema>;

interface LeaveApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveApplyModal({ isOpen, onClose }: LeaveApplyModalProps) {
  const applyMutation = useApplyLeave();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveFormValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      daysMode: "single",
      subType: "fullDay",
      fromDate: localYmd(),
      toDate: localYmd(),
      reason: "",
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch()
  const daysMode = watch("daysMode");
  const subType = watch("subType");

  const handleOpen = () => {
    if (isOpen) {
      reset({
        daysMode: "single",
        subType: "fullDay",
        fromDate: localYmd(),
        toDate: localYmd(),
        reason: "",
      });
    }
  };

  // Reset form when modal opens
  if (isOpen) void handleOpen;

  const onSubmit = async (values: LeaveFormValues) => {
    const body = {
      days: values.daysMode as LeaveDaysMode,
      subType: (values.daysMode === "single" ? values.subType : "fullDay") as LeaveSubType,
      fromDate: values.fromDate,
      ...(values.daysMode === "multiple" ? { toDate: values.toDate } : {}),
      reason: values.reason.trim(),
    };
    try {
      const res = await applyMutation.mutateAsync(body);
      toast.success(res.message ?? "Leave request submitted");
      onClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not submit leave request");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !applyMutation.isPending && onClose()}
      title="Request leave"
      panelClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-700">Duration</legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["single", "Single day"],
                ["multiple", "Multiple days"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setValue("daysMode", v);
                  if (v === "multiple") setValue("subType", "fullDay");
                }}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  daysMode === v ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        {daysMode === "single" && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-700">Day length</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["fullDay", "Full day"],
                  ["halfDay", "Half day"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setValue("subType", v)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    subType === v ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              {daysMode === "single" ? "Date" : "From"}
            </label>
            <input
              type="date"
              {...register("fromDate")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.fromDate && (
              <p className="mt-1 text-xs text-red-600">{errors.fromDate.message}</p>
            )}
          </div>
          {daysMode === "multiple" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">To</label>
              <input
                type="date"
                {...register("toDate")}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.toDate && (
                <p className="mt-1 text-xs text-red-600">{errors.toDate.message}</p>
              )}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="leave-reason" className="mb-1 block text-sm font-medium text-slate-700">
            Reason
          </label>
          <textarea
            id="leave-reason"
            rows={4}
            placeholder="e.g. Medical appointment, family event…"
            {...register("reason")}
            className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 ${
              errors.reason ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting || applyMutation.isPending}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || applyMutation.isPending}>
            Submit request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
