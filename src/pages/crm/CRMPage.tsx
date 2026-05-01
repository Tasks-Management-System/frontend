import { useState, useMemo } from "react";
import { Plus, Search, TrendingUp, ChevronRight } from "lucide-react";
import { PillTabBar } from "../../components/UI/PillTabBar";
import { useLeads, useRevenueForecast, useUpdateLeadStage } from "../../apis/api/crm";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import Button from "../../components/UI/Button";
import CreateLeadModal from "../../components/crm/CreateLeadModal";
import LeadDetailModal from "../../components/crm/LeadDetailModal";
import toast from "react-hot-toast";
import type { Client, Lead, LeadStage, ForecastItem } from "../../types/crm.types";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER, LEAD_STAGE_COLORS } from "../../types/crm.types";

type Tab = "leads" | "revenue";

function fmt(value: number, cur = "INR") {
  const symbol: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  return `${symbol[cur] ?? cur}${value.toLocaleString()}`;
}

// ─── Lead card ────────────────────────────────────────────────────────────────
function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  const client = typeof lead.client === "object" ? (lead.client as Client) : null;
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-violet-200 hover:shadow-md"
    >
      <p className="truncate text-sm font-medium text-slate-800">{lead.title}</p>
      {client && (
        <p className="mt-0.5 truncate text-xs text-slate-500">{client.company || client.name}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-emerald-700">
          {fmt(lead.value, lead.currency)}
        </span>
        <span className="text-xs text-slate-400">{lead.probability}%</span>
      </div>
    </div>
  );
}

// ─── Pipeline board ───────────────────────────────────────────────────────────
function PipelineBoard({
  leads,
  onSelect,
  orgContext,
}: {
  leads: Lead[];
  onSelect: (l: Lead) => void;
  orgContext?: string;
}) {
  const updateStage = useUpdateLeadStage(orgContext);

  const byStage = useMemo(() => {
    const map = Object.fromEntries(LEAD_STAGE_ORDER.map((s) => [s, [] as Lead[]])) as Record<
      LeadStage,
      Lead[]
    >;
    for (const l of leads) map[l.stage].push(l);
    return map;
  }, [leads]);

  const handleDrop = async (e: React.DragEvent, stage: LeadStage) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("leadId");
    if (!id) return;
    try {
      await updateStage.mutateAsync({ id, stage });
    } catch {
      toast.error("Could not update stage");
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {LEAD_STAGE_ORDER.map((stage) => (
        <div
          key={stage}
          className="w-56 flex-shrink-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleDrop(e, stage)}
        >
          <div className="mb-3 flex items-center justify-between">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEAD_STAGE_COLORS[stage]}`}
            >
              {LEAD_STAGE_LABELS[stage]}
            </span>
            <span className="text-xs text-slate-400">{byStage[stage].length}</span>
          </div>
          <div className="min-h-[80px] space-y-2">
            {byStage[stage].length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-slate-100 py-6 text-center text-xs text-slate-300">
                Empty
              </div>
            ) : (
              byStage[stage].map((l) => (
                <div
                  key={l._id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("leadId", l._id)}
                >
                  <LeadCard lead={l} onClick={() => onSelect(l)} />
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Leads tab ────────────────────────────────────────────────────────────────
function LeadsTab({ canManage, orgContext }: { canManage: boolean; orgContext?: string }) {
  const [view, setView] = useState<"pipeline" | "list">("pipeline");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Lead | null>(null);

  const { data: res, isLoading } = useLeads(orgContext);
  const allLeads = res?.data ?? [];

  const filtered = useMemo(() => {
    let list = allLeads;
    if (stageFilter !== "all") list = list.filter((l) => l.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) => {
        const client = typeof l.client === "object" ? (l.client as Client) : null;
        return (
          l.title.toLowerCase().includes(q) ||
          client?.name.toLowerCase().includes(q) ||
          client?.company?.toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [allLeads, stageFilter, search]);

  const stageCounts = useMemo(() => {
    const c: Record<string, number> = { all: allLeads.length };
    for (const l of allLeads) c[l.stage] = (c[l.stage] ?? 0) + 1;
    return c;
  }, [allLeads]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads…"
              className="rounded-lg border border-slate-200 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
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
              New lead
            </Button>
          )}
        </div>
      </div>

      {/* Stage filter pills */}
      <div className="mb-4">
        <PillTabBar
          size="sm"
          items={(["all", ...LEAD_STAGE_ORDER] as Array<LeadStage | "all">).map((s) => ({
            key: s,
            label: `${s === "all" ? "All" : LEAD_STAGE_LABELS[s as LeadStage]} ${stageCounts[s] ?? 0}`,
          }))}
          activeKey={stageFilter}
          onTabChange={(k) => setStageFilter(k as LeadStage | "all")}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-slate-400">
          <TrendingUp className="h-10 w-10 opacity-40" />
          <p className="text-sm">
            {search ? "No leads match your search" : "No leads in this stage"}
          </p>
        </div>
      ) : view === "pipeline" ? (
        <PipelineBoard leads={filtered} onSelect={setSelected} orgContext={orgContext} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <LeadCard key={l._id} lead={l} onClick={() => setSelected(l)} />
          ))}
        </div>
      )}

      {createOpen && (
        <CreateLeadModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          orgContext={orgContext}
        />
      )}
      {selected && (
        <LeadDetailModal
          lead={selected}
          onClose={() => setSelected(null)}
          canManage={canManage}
          orgContext={orgContext}
        />
      )}
    </div>
  );
}

// ─── Revenue tab ──────────────────────────────────────────────────────────────
function RevenueTab({ orgContext }: { orgContext?: string }) {
  const { data, isLoading } = useRevenueForecast(orgContext);
  const items = data?.data ?? [];
  const totalWeighted = data?.totalWeighted ?? 0;
  const totalValue = data?.totalValue ?? 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total pipeline",
            value: fmt(totalValue),
            color: "bg-violet-50 text-violet-700",
          },
          {
            label: "Weighted forecast",
            value: fmt(totalWeighted),
            color: "bg-emerald-50 text-emerald-700",
          },
          { label: "Active deals", value: String(items.length), color: "bg-sky-50 text-sky-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-xs font-medium opacity-70">{s.label}</p>
            <p className="mt-1 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
          <TrendingUp className="h-10 w-10 opacity-40" />
          <p className="text-sm">No active leads to forecast</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Deal</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Stage</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Prob %</th>
                <th className="px-4 py-3 text-right">Weighted</th>
                <th className="px-4 py-3 text-left">Close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map((item: ForecastItem) => {
                const client = typeof item.client === "object" ? item.client : null;
                return (
                  <tr key={item._id} className="bg-white hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{item.title}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {client?.company || client?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${LEAD_STAGE_COLORS[item.stage]}`}
                      >
                        {LEAD_STAGE_LABELS[item.stage]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {fmt(item.value, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">{item.probability}%</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {fmt(item.weightedValue, item.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.expectedCloseDate
                        ? new Date(item.expectedCloseDate).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })
                        : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-3 text-xs uppercase tracking-wide text-slate-500"
                >
                  Total
                </td>
                <td className="px-4 py-3 text-right">{fmt(totalValue)}</td>
                <td />
                <td className="px-4 py-3 text-right text-emerald-700">{fmt(totalWeighted)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CRMPage() {
  const userId = getUserId();
  const { data: me } = useUserById(userId);
  const { activeMode } = useActiveOrg();
  const roles = me?.role ?? [];
  const canManage = roles.some((r) => ["admin", "hr", "super-admin", "manager"].includes(r));

  const [tab, setTab] = useState<Tab>("leads");

  const { data: leadsRes } = useLeads(activeMode);
  const totalLeads = leadsRes?.total ?? 0;

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "leads", label: "Leads" },
    { id: "revenue", label: "Forecast" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Leads</h1>
        <p className="mt-1 text-sm text-slate-500">
          {totalLeads} deal{totalLeads !== 1 ? "s" : ""} in pipeline
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-slate-100">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 pb-3 pr-4 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-b-2 border-violet-600 text-violet-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "leads" && <LeadsTab canManage={canManage} orgContext={activeMode} />}
      {tab === "revenue" && <RevenueTab orgContext={activeMode} />}
    </div>
  );
}
