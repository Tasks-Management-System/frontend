import { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/UI/Model";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";
import { useCreateHoliday, useUpdateHoliday } from "../../apis/api/holidays";
import type { Holiday, CreateHolidayBody, HolidayType } from "../../types/holiday.types";

type HolidayFormModalProps = {
  open: boolean;
  onClose: () => void;
  initial?: Holiday | null;
};

export function HolidayFormModal({ open, onClose, initial }: HolidayFormModalProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : "");
  const [type, setType] = useState<HolidayType>(initial?.type ?? "company");

  const create = useCreateHoliday();
  const update = useUpdateHoliday();
  const isEdit = !!initial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !date) {
      toast.error("Name and date are required");
      return;
    }
    const body: CreateHolidayBody = { name: name.trim(), date, type };
    try {
      if (isEdit) {
        await update.mutateAsync({ id: initial._id, body });
        toast.success("Holiday updated");
      } else {
        await create.mutateAsync(body);
        toast.success("Holiday added");
      }
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const loading = create.isPending || update.isPending;

  return (
    <Modal isOpen={open} onClose={onClose} title={isEdit ? "Edit Holiday" : "Add Holiday"}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Republic Day"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as HolidayType)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="company">Company holiday</option>
            <option value="national">National holiday</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save changes" : "Add holiday"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
