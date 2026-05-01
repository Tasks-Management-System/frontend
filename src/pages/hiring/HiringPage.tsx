import { useState, useMemo } from "react";
import { PillTabBar } from "../../components/UI/PillTabBar";
import { Plus, Search, Users, Mail, Phone, FileText } from "lucide-react";
import { useApplicants } from "../../apis/api/hiring";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import Button from "../../components/UI/Button";
import CreateApplicantModal from "../../components/hiring/CreateApplicantModal";
import ApplicantDetailModal from "../../components/hiring/ApplicantDetailModal";
import ResumePreviewModal from "../../components/hiring/ResumePreviewModal";
import type { Applicant, HiringStage } from "../../types/hiring.types";
import { STAGE_LABELS, STAGE_ORDER, STAGE_COLORS } from "../../types/hiring.types";

const ALL_STAGES: Array<HiringStage | "all"> = ["all", ...STAGE_ORDER];

function daysAgo(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  return d === 0 ? "Today" : `${d}d ago`;
}

function ApplicantCard({ applicant, onClick }: { applicant: Applicant; onClick: () => void }) {
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

function PipelineBoard({
  applicants,
  onSelect,
}: {
  applicants: Applicant[];
  onSelect: (a: Applicant) => void;
}) {
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

  const VISIBLE_STAGES: HiringStage[] = [
    "applied",
    "screening",
    "interview_scheduled",
    "offer",
    "hired",
    "rejected",
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {VISIBLE_STAGES.map((stage) => (
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

export default function HiringPage() {
  const userId = getUserId();
  const { data: me } = useUserById(userId);
  const { activeMode } = useActiveOrg();
  const roles = me?.role ?? [];
  const canManage = roles.some((r) => ["admin", "hr", "super-admin", "manager"].includes(r));

  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [stageFilter, setStageFilter] = useState<HiringStage | "all">("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Applicant | null>(null);

  const { data, isLoading } = useApplicants(1, 200, activeMode);
  const applicants = data?.hiring ?? [];

  const filtered = useMemo(() => {
    let list = applicants;
    if (stageFilter !== "all") list = list.filter((a) => a.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.skills.some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [applicants, stageFilter, search]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = { all: applicants.length };
    for (const a of applicants) {
      c[a.stage] = (c[a.stage] ?? 0) + 1;
    }
    return c;
  }, [applicants]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Recruitment</h1>
          <p className="mt-1 text-sm text-slate-500">
            {applicants.length} applicant{applicants.length !== 1 ? "s" : ""} in pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PillTabBar
            size="sm"
            items={[
              { key: "pipeline", label: "Pipeline" },
              { key: "list", label: "List" },
            ]}
            activeKey={view}
            onTabChange={(k) => setView(k as "pipeline" | "list")}
          />
          {canManage && (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Add applicant
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, skill…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Stage filter pills */}
        <PillTabBar
          size="sm"
          items={ALL_STAGES.map((s) => ({
            key: s,
            label: `${s === "all" ? "All" : STAGE_LABELS[s as HiringStage]} ${stageCounts[s] ?? 0}`,
          }))}
          activeKey={stageFilter}
          onTabChange={(k) => setStageFilter(k as HiringStage | "all")}
        />
      </div>

      {/* Content */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
            <Users className="h-10 w-10 opacity-40" />
            <p className="text-sm">
              {search ? "No applicants match your search" : "No applicants in this stage"}
            </p>
          </div>
        ) : view === "pipeline" ? (
          <PipelineBoard applicants={filtered} onSelect={setSelected} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <ApplicantCard key={a._id} applicant={a} onClick={() => setSelected(a)} />
            ))}
          </div>
        )}
      </div>

      {createOpen && (
        <CreateApplicantModal open={createOpen} onClose={() => setCreateOpen(false)} />
      )}

      {selected && <ApplicantDetailModal applicant={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
