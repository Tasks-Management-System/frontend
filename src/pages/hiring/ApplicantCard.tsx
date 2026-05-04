import { useState } from "react";
import { Mail, Phone, FileText } from "lucide-react";
import ResumePreviewModal from "../../components/hiring/ResumePreviewModal";
import type { Applicant } from "../../types/hiring.types";
import { STAGE_LABELS, STAGE_COLORS } from "../../types/hiring.types";
import { daysAgo } from "./hiringUtils";

type ApplicantCardProps = {
  applicant: Applicant;
  onClick: () => void;
};

export function ApplicantCard({ applicant, onClick }: ApplicantCardProps) {
  const [resumePreview, setResumePreview] = useState(false);

  return (
    <>
      <div
        onClick={onClick}
        className="cursor-pointer rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-slate-900">{applicant.name}</p>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{applicant.email}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
              <Phone className="h-3.5 w-3.5 flex-shrink-0" />
              {applicant.phone}
            </div>
          </div>
          <span
            className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_COLORS[applicant.stage]}`}
          >
            {STAGE_LABELS[applicant.stage]}
          </span>
        </div>

        {applicant.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {applicant.skills.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
              >
                {s}
              </span>
            ))}
            {applicant.skills.length > 3 && (
              <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] text-slate-400">
                +{applicant.skills.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{daysAgo(applicant.createdAt)}</span>
          <div className="flex gap-2">
            {applicant.resume && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setResumePreview(true);
                }}
                className="flex items-center gap-1 text-xs text-violet-600 hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Resume
              </button>
            )}
          </div>
        </div>
      </div>

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
