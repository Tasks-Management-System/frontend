import toast from "react-hot-toast";
import { useUpdateLeaveStatus } from "../../apis/api/leave";
import { ApiError } from "../../apis/apiService";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Modal from "../../components/UI/Model";
import type { LeaveRecord } from "../../types/leave.types";
import { applicantName, formatDate, leaveDurationLabel } from "./leaveUtils";

interface LeaveReviewModalProps {
  reviewLeave: LeaveRecord | null;
  reviewAction: "approved" | "rejected" | null;
  adminComment: string;
  onCommentChange: (v: string) => void;
  onClose: () => void;
}

export function LeaveReviewModal({
  reviewLeave,
  reviewAction,
  adminComment,
  onCommentChange,
  onClose,
}: LeaveReviewModalProps) {
  const updateStatusMutation = useUpdateLeaveStatus();

  const submitReview = async () => {
    if (!reviewLeave || !reviewAction) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: reviewLeave._id,
        body: {
          status: reviewAction,
          adminComment: adminComment.trim() || undefined,
        },
      });
      toast.success(reviewAction === "approved" ? "Leave approved" : "Leave rejected");
      onClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not update status");
    }
  };

  const title =
    reviewAction === "approved"
      ? "Approve leave"
      : reviewAction === "rejected"
        ? "Reject leave"
        : "Review";

  return (
    <Modal
      isOpen={!!reviewLeave && !!reviewAction}
      onClose={() => {
        if (updateStatusMutation.isPending) return;
        onClose();
      }}
      title={title}
      panelClassName="max-w-md"
    >
      {reviewLeave && reviewAction && (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <p className="font-medium text-slate-900">{applicantName(reviewLeave)}</p>
            <p className="mt-1">
              {formatDate(reviewLeave.fromDate)}
              {reviewLeave.days === "multiple" &&
                reviewLeave.toDate &&
                reviewLeave.toDate !== reviewLeave.fromDate &&
                ` → ${formatDate(reviewLeave.toDate)}`}
              {" · "}
              {leaveDurationLabel(reviewLeave)}
            </p>
            <p className="mt-2 text-slate-600">{reviewLeave.reason}</p>
          </div>

          <Input
            label="Comment to employee (optional)"
            name="adminComment"
            type="textarea"
            value={adminComment}
            onChange={(e) => onCommentChange(e.target.value)}
            placeholder={
              reviewAction === "approved"
                ? "e.g. Approved — enjoy your time off."
                : "e.g. Please reschedule; team coverage needed."
            }
          />

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={updateStatusMutation.isPending}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={reviewAction === "rejected" ? "danger" : "primary"}
              loading={updateStatusMutation.isPending}
              onClick={() => void submitReview()}
            >
              {reviewAction === "approved" ? "Confirm approval" : "Confirm rejection"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
