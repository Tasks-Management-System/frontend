import { useState } from "react";
import { Mail, Phone, Globe, Building2, Pencil, Trash2, Plus, Phone as CallIcon, AtSign, Users, FileText } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import CreateClientModal from "./CreateClientModal";
import AddContactLogModal from "./AddContactLogModal";
import { useContactLogs, useDeleteClient, useDeleteContactLog } from "../../apis/api/crm";
import type { Client, ContactLogType } from "../../types/crm.types";
import { CONTACT_LOG_LABELS } from "../../types/crm.types";

interface Props {
  client: Client;
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

export default function ClientDetailModal({ client, onClose, canManage, orgContext }: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const deleteClient = useDeleteClient(orgContext);
  const deleteLog = useDeleteContactLog(orgContext);
  const { data: logsRes } = useContactLogs(client._id, undefined, orgContext);
  const logs = logsRes?.data ?? [];

  const handleDelete = async () => {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    try {
      await deleteClient.mutateAsync(client._id);
      toast.success("Client deleted");
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

  return (
    <>
      <Modal isOpen={true} onClose={onClose} title={client.name} panelClassName="max-w-xl">
        {/* Status badge */}
        <div className="mb-4 flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}>
            {client.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          {client.industry && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{client.industry}</span>
          )}
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4">
          {client.company && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {client.company}
            </div>
          )}
          {client.email && (
            <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-sm text-violet-600 hover:underline">
              <Mail className="h-4 w-4 flex-shrink-0" />
              {client.email}
            </a>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
              {client.phone}
            </div>
          )}
          {client.website && (
            <a href={client.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-violet-600 hover:underline truncate">
              <Globe className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{client.website.replace(/^https?:\/\//, '')}</span>
            </a>
          )}
        </div>

        {client.notes && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{client.notes}</p>
        )}

        {/* Contact logs */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700">Contact history</p>
            {canManage && (
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
                      <button onClick={() => handleDeleteLog(log._id)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
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
            <Button size="sm" variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={handleDelete} disabled={deleteClient.isPending}>
              Delete
            </Button>
          </div>
        )}
      </Modal>

      {editOpen && (
        <CreateClientModal open={editOpen} onClose={() => setEditOpen(false)} existing={client} orgContext={orgContext} />
      )}

      {logOpen && (
        <AddContactLogModal open={logOpen} onClose={() => setLogOpen(false)} clientId={client._id} orgContext={orgContext} />
      )}
    </>
  );
}
