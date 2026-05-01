import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useCreateContactLog } from "../../apis/api/crm";
import type { ContactLogType } from "../../types/crm.types";
import { CONTACT_LOG_LABELS } from "../../types/crm.types";

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  leadId?: string;
  orgContext?: string;
}

const LOG_TYPES: ContactLogType[] = ["call", "email", "meeting", "note"];

export default function AddContactLogModal({ open, onClose, clientId, leadId, orgContext }: Props) {
  const [type, setType] = useState<ContactLogType>("call");
  const [summary, setSummary] = useState("");
  const [loggedAt, setLoggedAt] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const create = useCreateContactLog(orgContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error("Summary is required");
      return;
    }
    try {
      await create.mutateAsync({
        client: clientId,
        lead: leadId,
        type,
        summary,
        loggedAt: new Date(loggedAt).toISOString(),
      });
      toast.success("Contact log added");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add contact log" panelClassName="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
          <div className="flex gap-2">
            {LOG_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border py-1.5 text-sm font-medium transition-all ${
                  type === t
                    ? "border-violet-500 bg-violet-50 text-violet-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {CONTACT_LOG_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date & Time</label>
          <input
            type="datetime-local"
            value={loggedAt}
            onChange={(e) => setLoggedAt(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <Input
          label="Summary *"
          type="textarea"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What was discussed or decided…"
          rows={4}
          required
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? "Saving…" : "Add log"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
