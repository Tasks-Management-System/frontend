import { useMemo, useState } from "react";
import { PillTabBar } from "../../components/UI/PillTabBar";
import { Plus, Search, Users } from "lucide-react";
import { useApplicants } from "../../apis/api/hiring";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import Button from "../../components/UI/Button";
import CreateApplicantModal from "../../components/hiring/CreateApplicantModal";
import ApplicantDetailModal from "../../components/hiring/ApplicantDetailModal";
import type { Applicant, HiringStage } from "../../types/hiring.types";
import { STAGE_LABELS } from "../../types/hiring.types";
import { ApplicantCard } from "./ApplicantCard";
import { PipelineBoard } from "./PipelineBoard";
import { ALL_STAGES } from "./hiringConstants";

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
  const hiringList = data?.hiring;
  const applicants = useMemo(() => hiringList ?? [], [hiringList]);

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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, skill…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

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
