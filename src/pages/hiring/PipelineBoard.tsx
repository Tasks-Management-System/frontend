import { useMemo } from "react";
import type { Applicant, HiringStage } from "../../types/hiring.types";
import { STAGE_LABELS, STAGE_COLORS } from "../../types/hiring.types";
import { ApplicantCard } from "./ApplicantCard";
import { VISIBLE_PIPELINE_STAGES } from "./hiringConstants";

type PipelineBoardProps = {
  applicants: Applicant[];
  onSelect: (a: Applicant) => void;
};

export function PipelineBoard({ applicants, onSelect }: PipelineBoardProps) {
  const byStage = useMemo(() => {
    const map: Record<HiringStage, Applicant[]> = {
      applied: [],
      screening: [],
      interview_scheduled: [],
      offer: [],
      hired: [],
      rejected: [],
    };
    for (const a of applicants) {
      map[a.stage].push(a);
    }
    return map;
  }, [applicants]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {VISIBLE_PIPELINE_STAGES.map((stage) => (
        <div key={stage} className="w-64 flex-shrink-0">
          <div className="mb-3 flex items-center justify-between">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STAGE_COLORS[stage]}`}
            >
              {STAGE_LABELS[stage]}
            </span>
            <span className="text-xs text-slate-400">{byStage[stage].length}</span>
          </div>
          <div className="space-y-2 min-h-[80px]">
            {byStage[stage].length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-100 py-6 text-center text-xs text-slate-300">
                No applicants
              </div>
            ) : (
              byStage[stage].map((a) => (
                <ApplicantCard key={a._id} applicant={a} onClick={() => onSelect(a)} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
