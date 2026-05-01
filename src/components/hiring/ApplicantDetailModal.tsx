import { useState } from "react";
import {
  FileText,
  Github,
  Linkedin,
  Mail,
  Phone,
  Star,
  Calendar,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import ResumePreviewModal from "./ResumePreviewModal";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import ScheduleInterviewModal from "./ScheduleInterviewModal";
import FeedbackModal from "./FeedbackModal";
import {
  useInterviews,
  useUpdateApplicantStage,
  useSetInterviewResult,
  useConvertToUser,
} from "../../apis/api/hiring";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import type { Applicant, HiringStage, Interview } from "../../types/hiring.types";
import { STAGE_LABELS, STAGE_ORDER, STAGE_COLORS } from "../../types/hiring.types";

interface Props {
  applicant: Applicant;
  onClose: () => void;
}

function StagePill({ stage }: { stage: HiringStage }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[stage]}`}>
      {STAGE_LABELS[stage]}
    </span>
  );
}

function InterviewCard({
  interview,
  canManage,
  onFeedback,
}: {
  interview: Interview;
  canManage: boolean;
  onFeedback: (iv: Interview) => void;
}) {
  const setResult = useSetInterviewResult();
  const scheduledDate = new Date(interview.scheduledAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const avgRating =
    interview.feedback.length > 0
      ? (interview.feedback.reduce((s, f) => s + (f.rating ?? 0), 0) / interview.feedback.length).toFixed(1)
      : null;

  const handleResult = async (result: "passed" | "failed") => {
    try {
      await setResult.mutateAsync({ id: interview._id, result });
      toast.success(result === "passed" ? "Moved to offer stage" : "Marked as rejected");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-800">{scheduledDate}</span>
          </div>
          {interview.interviewers.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Interviewers: {interview.interviewers.map((u) => u.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {avgRating && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              interview.result === "passed"
                ? "bg-emerald-100 text-emerald-700"
                : interview.result === "failed"
                ? "bg-red-100 text-red-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {interview.result === "pending" ? "Pending" : interview.result === "passed" ? "Passed" : "Failed"}
          </span>
        </div>
      </div>

      {/* Feedback list */}
      {interview.feedback.length > 0 && (
        <div className="mt-3 space-y-2">
          {interview.feedback.map((fb) => (
            <div key={fb._id} className="rounded-lg bg-slate-50 px-3 py-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">{fb.interviewer.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  fb.recommendation === "proceed" ? "bg-emerald-100 text-emerald-700" :
                  fb.recommendation === "reject" ? "bg-red-100 text-red-700" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {fb.recommendation}
                </span>
              </div>
              {fb.notes && <p className="mt-1 text-slate-500">{fb.notes}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onFeedback(interview)}>
          Add feedback
        </Button>
        {canManage && interview.result === "pending" && (
          <>
            <Button size="sm" onClick={() => handleResult("passed")} disabled={setResult.isPending}>
              Mark passed
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleResult("failed")} disabled={setResult.isPending}>
              Mark failed
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ApplicantDetailModal({ applicant, onClose }: Props) {
  const userId = getUserId();
  const { data: me } = useUserById(userId);
  const roles = me?.role ?? [];
  const canManage = roles.some((r) => ["admin", "hr", "super-admin"].includes(r));

  const [activeTab, setActiveTab] = useState<"profile" | "interviews">("profile");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [resumePreview, setResumePreview] = useState(false);
  const [currentStage, setCurrentStage] = useState<HiringStage>(applicant.stage);

  const { data: interviews = [] } = useInterviews(applicant._id);
  const updateStage = useUpdateApplicantStage();
  const convertToUser = useConvertToUser();

  const handleStageChange = async (stage: HiringStage) => {
    try {
      await updateStage.mutateAsync({ id: applicant._id, stage });
      setCurrentStage(stage);
      toast.success(`Stage updated to ${STAGE_LABELS[stage]}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleConvert = async () => {
    if (!confirm(`Create an employee account for ${applicant.name}? A welcome email with a temp password will be sent.`)) return;
    try {
      await convertToUser.mutateAsync(applicant._id);
      toast.success("Employee account created — welcome email sent");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const daysAgo = Math.floor(
    (Date.now() - new Date(applicant.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <>
      <Modal
        isOpen={true}
        onClose={onClose}
        title={applicant.name}
        panelClassName="max-w-2xl"
      >
        {/* Stage pipeline */}
        <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
          {STAGE_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />}
              <button
                onClick={() => canManage && handleStageChange(s)}
                disabled={!canManage || s === currentStage}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  s === currentStage
                    ? STAGE_COLORS[s] + " ring-2 ring-offset-1 ring-current"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                } disabled:cursor-default`}
                title={canManage ? `Move to ${STAGE_LABELS[s]}` : STAGE_LABELS[s]}
              >
                {STAGE_LABELS[s]}
              </button>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-4 border-b border-slate-100">
          {(["profile", "interviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-violet-600 text-violet-700"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab}
              {tab === "interviews" && interviews.length > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">
                  {interviews.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${applicant.email}`} className="hover:text-violet-600 truncate">
                  {applicant.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                {applicant.phone}
              </div>
              {applicant.linkedInProfile && (
                <a
                  href={applicant.linkedInProfile}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {applicant.gitHubLink && (
                <a
                  href={applicant.gitHubLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-slate-700 hover:underline"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
            </div>

            {applicant.skills.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {applicant.skills.map((s) => (
                    <span key={s} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs text-slate-500">Experience</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{applicant.experience || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Notice period</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">{applicant.noticePeriod || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Applied</p>
                <p className="mt-0.5 text-sm font-medium text-slate-800">
                  {daysAgo === 0 ? "Today" : `${daysAgo}d ago`}
                </p>
              </div>
              {applicant.currentSalary != null && (
                <div>
                  <p className="text-xs text-slate-500">Current CTC</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    ₹{applicant.currentSalary.toLocaleString()}
                  </p>
                </div>
              )}
              {applicant.expectedSalary != null && (
                <div>
                  <p className="text-xs text-slate-500">Expected CTC</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">
                    ₹{applicant.expectedSalary.toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {applicant.resume && (
              <button
                onClick={() => setResumePreview(true)}
                className="flex items-center gap-2 text-sm font-medium text-violet-600 hover:underline"
              >
                <FileText className="h-4 w-4" />
                View resume
              </button>
            )}

            {applicant.note && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {applicant.note}
              </div>
            )}
          </div>
        )}

        {/* Interviews tab */}
        {activeTab === "interviews" && (
          <div className="space-y-3">
            {interviews.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No interviews scheduled yet.</p>
            ) : (
              interviews.map((iv) => (
                <InterviewCard
                  key={iv._id}
                  interview={iv}
                  canManage={canManage}
                  onFeedback={setFeedbackInterview}
                />
              ))
            )}
          </div>
        )}

        {/* Action bar */}
        <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Calendar className="h-4 w-4" />}
              onClick={() => setScheduleOpen(true)}
            >
              Schedule interview
            </Button>
          )}
          {canManage && currentStage === "hired" && (
            <Button
              size="sm"
              leftIcon={<UserCheck className="h-4 w-4" />}
              onClick={handleConvert}
              disabled={convertToUser.isPending}
            >
              {convertToUser.isPending ? "Creating…" : "Create employee account"}
            </Button>
          )}
          <StagePill stage={currentStage} />
        </div>
      </Modal>

      {scheduleOpen && (
        <ScheduleInterviewModal
          open={scheduleOpen}
          onClose={() => setScheduleOpen(false)}
          applicant={applicant}
        />
      )}

      {feedbackInterview && (
        <FeedbackModal
          open={!!feedbackInterview}
          onClose={() => setFeedbackInterview(null)}
          interview={feedbackInterview}
        />
      )}

      {resumePreview && applicant.resume && (
        <ResumePreviewModal
          url={applicant.resume}
          name={applicant.name}
          onClose={() => setResumePreview(false)}
        />
      )}
    </>
  );
}
