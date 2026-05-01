import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useCreateClient, useUpdateClient } from "../../apis/api/crm";
import type { Client } from "../../types/crm.types";

interface Props {
  open: boolean;
  onClose: () => void;
  existing?: Client;
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

export default function CreateClientModal({ open, onClose, existing, orgContext }: Props) {
  const isEdit = !!existing;
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    company: existing?.company ?? "",
    email: existing?.email ?? "",
    phone: existing?.phone ?? "",
    website: existing?.website ?? "",
    industry: existing?.industry ?? "",
    status: existing?.status ?? "active",
    notes: existing?.notes ?? "",
  });

  const createClient = useCreateClient(orgContext);
  const updateClient = useUpdateClient(orgContext);
  const isPending = createClient.isPending || updateClient.isPending;

  const set =
    (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    try {
      if (isEdit) {
        await updateClient.mutateAsync({ id: existing!._id, ...form });
        toast.success("Client updated");
      } else {
        await createClient.mutateAsync(form);
        toast.success("Client created");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={isEdit ? "Edit client" : "Add client"}
      panelClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Input
              label="Name *"
              value={form.name}
              onChange={set("name")}
              placeholder="John Smith"
              required
            />
          </div>
          <Input
            label="Company"
            value={form.company}
            onChange={set("company")}
            placeholder="Acme Corp"
          />
          <Input
            label="Industry"
            value={form.industry}
            onChange={set("industry")}
            placeholder="Technology"
            list="industries"
          />
          <datalist id="industries">
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="john@acme.com"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={set("phone")}
            placeholder="+91 98765 43210"
          />
          <div className="col-span-2">
            <Input
              label="Website"
              value={form.website}
              onChange={set("website")}
              placeholder="https://acme.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={set("status")}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-span-2">
            <Input
              label="Notes"
              type="textarea"
              value={form.notes}
              onChange={set("notes")}
              placeholder="Any additional context…"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
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
                : "Add client"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
