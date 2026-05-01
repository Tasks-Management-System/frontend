import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import {
  useHolidays,
  useCreateHoliday,
  useUpdateHoliday,
  useDeleteHoliday,
} from "../../apis/api/holidays";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Model";
import Input from "../../components/UI/Input";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import type { Holiday, CreateHolidayBody, HolidayType } from "../../types/holiday.types";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long" });
}

function groupByMonth(holidays: Holiday[]): Record<number, Holiday[]> {
  const map: Record<number, Holiday[]> = {};
  for (const h of holidays) {
    const m = new Date(h.date).getMonth();
    if (!map[m]) map[m] = [];
    map[m].push(h);
  }
  return map;
}

// ─── Holiday Form Modal ───────────────────────────────────────────────────────
interface HolidayFormModalProps {
  open: boolean;
  onClose: () => void;
  initial?: Holiday | null;
}

function HolidayFormModal({ open, onClose, initial }: HolidayFormModalProps) {
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function HolidaysPage() {
  const userId = getUserId();
  const { data: user } = useUserById(userId);
  const { activeMode, ownedOrg, hasBoth, noOrg } = useActiveOrg();
  const roles = user?.role ?? [];
  const effectiveRoles: string[] =
    noOrg || (hasBoth && activeMode === "member")
      ? ["employee"]
      : ownedOrg && activeMode === "owned"
        ? ["admin"]
        : roles;
  const canManage = effectiveRoles.includes("admin");

  const [year, setYear] = useState(new Date().getFullYear());
  const [formOpen, setFormOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const { data: holidays = [], isLoading } = useHolidays(year, activeMode);
  const deleteHoliday = useDeleteHoliday();

  const grouped = groupByMonth(holidays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHoliday.mutateAsync(deleteTarget._id);
      toast.success("Holiday deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  const handleEditOpen = (h: Holiday) => {
    setEditHoliday(h);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditHoliday(null);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Holidays</h1>
          <p className="mt-1 text-sm text-slate-500">Company and national holidays for {year}.</p>
        </div>
        {canManage && (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            size="sm"
            onClick={() => {
              setEditHoliday(null);
              setFormOpen(true);
            }}
          >
            Add holiday
          </Button>
        )}
      </div>

      {/* Year navigator */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => setYear((y) => y - 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[3rem] text-center text-sm font-semibold text-slate-700">
          {year}
        </span>
        <button
          onClick={() => setYear((y) => y + 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Holiday list */}
      <div className="mt-6 space-y-8">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <CalendarDays className="h-10 w-10 opacity-40" />
            <p className="text-sm">No holidays declared for {year}.</p>
            {canManage && (
              <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
                Add first holiday
              </Button>
            )}
          </div>
        ) : (
          Object.entries(grouped)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([monthIdx, list]) => (
              <div key={monthIdx}>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {MONTH_NAMES[Number(monthIdx)]}
                </h2>
                <div className="space-y-2">
                  {list.map((h) => {
                    const hDate = new Date(h.date);
                    hDate.setHours(0, 0, 0, 0);
                    const isPast = hDate < today;
                    const isToday = hDate.getTime() === today.getTime();
                    return (
                      <div
                        key={h._id}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${
                          isToday
                            ? "border-violet-200 bg-violet-50"
                            : isPast
                              ? "border-slate-100 bg-slate-50 opacity-60"
                              : "border-slate-100 bg-white hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full flex-shrink-0 ${
                              h.type === "national" ? "bg-amber-400" : "bg-violet-500"
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{h.name}</p>
                            <p className="text-xs text-slate-400">{formatDate(h.date)}</p>
                          </div>
                          <span
                            className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                              h.type === "national"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-violet-100 text-violet-700"
                            }`}
                          >
                            {h.type === "national" ? "National" : "Company"}
                          </span>
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditOpen(h)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(h)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Form modal */}
      {formOpen && (
        <HolidayFormModal open={formOpen} onClose={handleFormClose} initial={editHoliday} />
      )}

      {/* Delete confirm modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete holiday">
        <p className="text-sm text-slate-600">
          Delete <span className="font-semibold">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            disabled={deleteHoliday.isPending}
            onClick={handleDelete}
          >
            {deleteHoliday.isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
