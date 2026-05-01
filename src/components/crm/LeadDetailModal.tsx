import { useState } from "react";
import { ChevronRight, Pencil, Trash2, Plus, Phone as CallIcon, AtSign, Users, FileText, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import CreateLeadModal from "./CreateLeadModal";
import AddContactLogModal from "./AddContactLogModal";
import { useContactLogs, useDeleteLead, useDeleteContactLog, useUpdateLeadStage } from "../../apis/api/crm";
import type { Client, Lead, ContactLogType } from "../../types/crm.types";
import {
  LEAD_STAGE_LABELS,
  LEAD_STAGE_ORDER,
  LEAD_STAGE_COLORS,
  CONTACT_LOG_LABELS,
} from "../../types/crm.types";

interface Props {
  lead: Lead;
  onClose: () => void;
  canManage: boolean;
  orgContext?: string;
}

const TYPE_ICON: Record<ContactLogType, typeof CallIcon> = {
  call: CallIcon,
  email: AtSign,
  meeting: Users,
  note: FileText,
};

const TYPE_COLOR: Record<ContactLogType, string> = {
  call: "bg-sky-100 text-sky-700",
  email: "bg-violet-100 text-violet-700",
  meeting: "bg-amber-100 text-amber-700",
  note: "bg-slate-100 text-slate-600",
};

function currency(value: number, cur: string) {
  const symbol: Record<string, string> = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };
  return `${symbol[cur] ?? cur}${value.toLocaleString()}`;
}

export default function LeadDetailModal({ lead, onClose, canManage, orgContext }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [currentStage, setCurrentStage] = useState(lead.stage);
  const deleteLead = useDeleteLead(orgContext);
  const deleteLog = useDeleteContactLog(orgContext);
  const updateStage = useUpdateLeadStage(orgContext);

  const clientObj = typeof lead.client === "object" ? lead.client as Client : null;
  const clientId = clientObj?._id ?? (lead.client as string);

  const { data: logsRes } = useContactLogs(clientId, lead._id, orgContext);
  const logs = logsRes?.data ?? [];

  const handleDelete = async () => {
    if (!confirm("Delete this lead? This cannot be undone.")) return;
    try {
      await deleteLead.mutateAsync(lead._id);
      toast.success("Lead deleted");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleDeleteLog = async (id: string) => {
    try {
      await deleteLog.mutateAsync(id);
      toast.success("Log deleted");
    } catch {
      toast.error("Could not delete log");
    }
  };

  const handleStageChange = async (stage: string) => {
    try {
      await updateStage.mutateAsync({ id: lead._id, stage });
      setCurrentStage(stage as typeof lead.stage);
      toast.success(`Moved to ${LEAD_STAGE_LABELS[stage as keyof typeof LEAD_STAGE_LABELS]}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const weighted = Math.round(lead.value * (lead.probability / 100));

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={lead.title} panelClassName="max-w-xl">
        {/* Stage pipeline */}
        <div className="mb-4 flex items-center gap-1 overflow-x-auto pb-1">
          {LEAD_STAGE_ORDER.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-slate-300" />}
              <button
                onClick={() => canManage && s !== currentStage && handleStageChange(s)}
                disabled={!canManage || s === currentStage}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                  s === currentStage
                    ? LEAD_STAGE_COLORS[s] + " ring-2 ring-offset-1 ring-current"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                } disabled:cursor-default`}
              >
                {LEAD_STAGE_LABELS[s]}
              </button>
            </div>
          ))}
        </div>

        {/* Value / probability */}
        <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-xs text-slate-500">Deal value</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{currency(lead.value, lead.currency)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Probability</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-800">{lead.probability}%</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <TrendingUp className="h-3 w-3" /> Weighted
            </p>
            <p className="mt-0.5 text-sm font-semibold text-emerald-700">{currency(weighted, lead.currency)}</p>
          </div>
          {clientObj && (
            <div className="col-span-2">
              <p className="text-xs text-slate-500">Client</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">
                {clientObj.name}{clientObj.company ? ` — ${clientObj.company}` : ""}
              </p>
            </div>
          )}
          {lead.expectedCloseDate && (
            <div>
              <p className="text-xs text-slate-500">Close date</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">
                {new Date(lead.expectedCloseDate).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>
          )}
          {lead.assignedTo && typeof lead.assignedTo === "object" && (
            <div>
              <p className="text-xs text-slate-500">Owner</p>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{lead.assignedTo.name}</p>
            </div>
          )}
        </div>

        {lead.notes && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{lead.notes}</p>
        )}

        {/* Contact logs */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Contact history</p>
            {canManage && clientId && (
              <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setLogOpen(true)}>
                Log
              </Button>
            )}
          </div>

          {logs.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-400">No contact history yet.</p>
          ) : (
            <div className="max-h-52 space-y-2 overflow-y-auto">
              {logs.map((log) => {
                const Icon = TYPE_ICON[log.type];
                return (
                  <div key={log._id} className="flex items-start gap-3 rounded-lg border border-slate-100 bg-white p-3">
                    <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${TYPE_COLOR[log.type]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">{CONTACT_LOG_LABELS[log.type]}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.loggedAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </span>
                        {typeof log.loggedBy === "object" && log.loggedBy && (
                          <span className="text-xs text-slate-400">— {log.loggedBy.name}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-600">{log.summary}</p>
                    </div>
                    {canManage && (
                      <button onClick={() => handleDeleteLog(log._id)} className="flex-shrink-0 text-slate-300 hover:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        {canManage && (
          <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
            <Button size="sm" variant="outline" leftIcon={<Pencil className="h-4 w-4" />} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button size="sm" variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDelete} disabled={deleteLead.isPending}>
              Delete
            </Button>
          </div>
        )}
      </Modal>

      {editOpen && (
        <CreateLeadModal open={editOpen} onClose={() => setEditOpen(false)} existing={lead} orgContext={orgContext} />
      )}

      {logOpen && clientId && (
        <AddContactLogModal open={logOpen} onClose={() => setLogOpen(false)} clientId={clientId} leadId={lead._id} orgContext={orgContext} />
      )}
    </>
  );
}
