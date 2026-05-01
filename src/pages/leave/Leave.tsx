import { getUserId } from "../../utils/session";
import { useMemo, useState } from "react";
import { ClipboardList, Inbox, Plus } from "lucide-react";
import { useUserById } from "../../apis/api/auth";
import { usePendingLeaveRequests } from "../../apis/api/leave";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import { PillTabBar } from "../../components/UI/PillTabBar";
import Button from "../../components/UI/Button";
import { LeaveBalanceSummary, MyLeaveHistoryPanel } from "../../components/leave/MyLeaveSection";
import type { LeaveRecord } from "../../types/leave.types";
import { LeaveInboxSection } from "./LeaveInboxTable";
import { LeaveApplyModal } from "./LeaveApplyModal";
import { LeaveReviewModal } from "./LeaveReviewModal";

export default function Leave() {
  const userId = getUserId();
  const { data: user, isLoading: userLoading } = useUserById(userId);
  const roles = user?.role ?? [];
  const canReview = roles.some((r) => ["admin", "hr", "super-admin"].includes(r));
  const { activeMode } = useActiveOrg();

  const [tab, setTab] = useState<"mine" | "inbox">("inbox");
  const { data: pending = [], isLoading: pendingLoading } = usePendingLeaveRequests(
    !!userId && canReview && tab === "inbox",
    activeMode
  );

  const [applyOpen, setApplyOpen] = useState(false);
  const [reviewLeave, setReviewLeave] = useState<LeaveRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected" | null>(null);
  const [adminComment, setAdminComment] = useState("");

  const tabItems = useMemo(() => {
    const items = [
      {
        key: "inbox",
        label: "Team inbox",
        icon: <ClipboardList className="h-4 w-4" />,
      },
    ];
    if (canReview) {
      items.push({
        key: "mine",
        label: "My leave",
        icon: <Inbox className="h-4 w-4" />,
      });
    }
    return items;
  }, [canReview]);

  const handleApprove = (row: LeaveRecord) => {
    setReviewLeave(row);
    setReviewAction("approved");
    setAdminComment("");
  };

  const handleReject = (row: LeaveRecord) => {
    setReviewLeave(row);
    setReviewAction("rejected");
    setAdminComment("");
  };

  const handleReviewClose = () => {
    setReviewLeave(null);
    setReviewAction(null);
    setAdminComment("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Time off</h1>
          <p className="mt-1 text-sm text-slate-600">
            Request leave, track balances, and review pending requests.
          </p>
        </div>
        <Button
          type="button"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setApplyOpen(true)}
        >
          Request leave
        </Button>
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {canReview ? (
          <PillTabBar
            items={tabItems}
            activeKey={tab}
            onTabChange={(k) => setTab(k as "mine" | "inbox")}
          />
        ) : (
          <div />
        )}
      </div>

      <LeaveBalanceSummary user={user} userLoading={userLoading} className="mt-6" />

      {(!canReview || tab === "mine") && <MyLeaveHistoryPanel enabled={!!userId} />}

      {tab === "inbox" && canReview && (
        <LeaveInboxSection
          pending={pending}
          isLoading={pendingLoading}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <LeaveApplyModal isOpen={applyOpen} onClose={() => setApplyOpen(false)} />

      <LeaveReviewModal
        reviewLeave={reviewLeave}
        reviewAction={reviewAction}
        adminComment={adminComment}
        onCommentChange={setAdminComment}
        onClose={handleReviewClose}
      />
    </div>
  );
}
