import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import {
  useCreateLead,
  useUpdateLead,
  useClients,
  useCreateClient,
  useUpdateClient,
} from "../../apis/api/crm";
import type { Client, Lead, LeadStage } from "../../types/crm.types";
import { LEAD_STAGE_LABELS, LEAD_STAGE_ORDER } from "../../types/crm.types";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Lead;
  orgContext?: string;
}

const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Retail",
  "Manufacturing",
  "Education",
  "Real Estate",
  "Consulting",
  "Media",
  "Other",
];

export default function CreateLeadModal({ open, onClose, existing, orgContext }: Props) {
  const isEdit = !!existing;
  const existingClient =
    existing?.client && typeof existing.client === "object" ? (existing.client as Client) : null;

  // ─── Client fields ────────────────────────────────────────────────────────
  const [existingClientId, setExistingClientId] = useState<string>(existingClient?._id ?? "");
  const [clientForm, setClientForm] = useState({
    name: existingClient?.name ?? "",
    company: existingClient?.company ?? "",
    email: existingClient?.email ?? "",
    phone: existingClient?.phone ?? "",
    website: existingClient?.website ?? "",
    industry: existingClient?.industry ?? "",
    notes: existingClient?.notes ?? "",
  });

  // ─── Deal fields ──────────────────────────────────────────────────────────
  const [dealForm, setDealForm] = useState({
    title: existing?.title ?? "",
    stage: (existing?.stage ?? "lead") as LeadStage,
    value: String(existing?.value ?? ""),
    currency: existing?.currency ?? "INR",
    probability: String(existing?.probability ?? "20"),
    expectedCloseDate: existing?.expectedCloseDate ? existing.expectedCloseDate.slice(0, 10) : "",
    notes: existing?.notes ?? "",
  });

  const { data: clientsRes } = useClients(undefined, orgContext);
  const allClients = clientsRes?.data ?? [];

  const createClient = useCreateClient(orgContext);
  const updateClient = useUpdateClient(orgContext);
  const createLead = useCreateLead(orgContext);
  const updateLead = useUpdateLead(orgContext);
  const isPending =
    createClient.isPending ||
    updateClient.isPending ||
    createLead.isPending ||
    updateLead.isPending;

  const setClient =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setClientForm((p) => ({ ...p, [field]: e.target.value }));

  const setDeal =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setDealForm((p) => ({ ...p, [field]: e.target.value }));

  const handleExistingClientSelect = (id: string) => {
    setExistingClientId(id);
    if (id) {
      const c = allClients.find((cl) => cl._id === id);
      if (c) {
        setClientForm({
          name: c.name,
          company: c.company ?? "",
          email: c.email ?? "",
          phone: c.phone ?? "",
          website: c.website ?? "",
          industry: c.industry ?? "",
          notes: c.notes ?? "",
        });
      }
    } else {
      setClientForm({
        name: "",
        company: "",
        email: "",
        phone: "",
        website: "",
        industry: "",
        notes: "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    if (!dealForm.title.trim()) {
      toast.error("Deal title is required");
      return;
    }

    try {
      let clientId = existingClientId;

      if (isEdit && existingClient) {
        // Update existing client
        await updateClient.mutateAsync({ id: existingClient._id, ...clientForm });
        clientId = existingClient._id;
      } else if (!existingClientId) {
        // Create new client
        const res = await createClient.mutateAsync(clientForm);
        clientId = res.data._id;
      }

      const payload = {
        title: dealForm.title,
        client: clientId,
        stage: dealForm.stage,
        value: Number(dealForm.value) || 0,
        currency: dealForm.currency,
        probability: Math.min(100, Math.max(0, Number(dealForm.probability) || 0)),
        expectedCloseDate: dealForm.expectedCloseDate || undefined,
        notes: dealForm.notes,
      };

      if (isEdit) {
        await updateLead.mutateAsync({ id: existing!._id, ...payload });
        toast.success("Lead updated");
      } else {
        await createLead.mutateAsync(payload as typeof payload & { client: string });
        toast.success("Lead created");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const useExisting = !!existingClientId;

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? "Edit lead" : "New lead"}
      panelClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* ── Client section ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Client
          </p>

          {/* Select existing client */}
          {!isEdit && allClients.length > 0 && (
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Link to existing client{" "}
                <span className="font-normal text-slate-400">
                  (optional — leave blank to create new)
                </span>
              </label>
              <select
                value={existingClientId}
                onChange={(e) => handleExistingClientSelect(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="">— Create new client —</option>
                {allClients.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {c.company ? ` — ${c.company}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                value={clientForm.name}
                onChange={setClient("name")}
                placeholder="Jane Smith"
                required
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
              <input
                value={clientForm.company}
                onChange={setClient("company")}
                placeholder="Acme Corp"
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                value={clientForm.email}
                onChange={setClient("email")}
                placeholder="jane@acme.com"
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
              <input
                value={clientForm.phone}
                onChange={setClient("phone")}
                placeholder="+91 98765 43210"
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Website</label>
              <input
                value={clientForm.website}
                onChange={setClient("website")}
                placeholder="https://acme.com"
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Industry</label>
              <input
                value={clientForm.industry}
                onChange={setClient("industry")}
                placeholder="Technology"
                list="crm-industries"
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
              <datalist id="crm-industries">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} />
                ))}
              </datalist>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Client notes <span className="font-normal text-slate-400">(internal)</span>
              </label>
              <textarea
                value={clientForm.notes}
                onChange={setClient("notes")}
                placeholder="Any context about this client…"
                rows={2}
                readOnly={useExisting && !isEdit}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none ${
                  useExisting && !isEdit
                    ? "border-slate-100 bg-slate-50 text-slate-500"
                    : "border-slate-200"
                }`}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* ── Deal section ── */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Deal</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Deal title <span className="text-red-500">*</span>
              </label>
              <input
                value={dealForm.title}
                onChange={setDeal("title")}
                placeholder="e.g. Website redesign project"
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">Stage</label>
              <div className="flex flex-wrap gap-2">
                {LEAD_STAGE_ORDER.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDealForm((p) => ({ ...p, stage: s }))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${
                      dealForm.stage === s
                        ? "border-violet-500 bg-violet-50 text-violet-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {LEAD_STAGE_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Deal value</label>
              <input
                type="number"
                value={dealForm.value}
                onChange={setDeal("value")}
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Currency</label>
              <select
                value={dealForm.currency}
                onChange={setDeal("currency")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="INR">INR ₹</option>
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Probability %</label>
              <input
                type="number"
                value={dealForm.probability}
                onChange={setDeal("probability")}
                placeholder="20"
                min={0}
                max={100}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Expected close date
              </label>
              <input
                type="date"
                value={dealForm.expectedCloseDate}
                onChange={setDeal("expectedCloseDate")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            <div className="col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Deal notes</label>
              <textarea
                value={dealForm.notes}
                onChange={setDeal("notes")}
                placeholder="Key requirements, context, next steps…"
                rows={3}
                className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending
              ? isEdit
                ? "Saving…"
                : "Creating…"
              : isEdit
                ? "Save changes"
                : "Create lead"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
