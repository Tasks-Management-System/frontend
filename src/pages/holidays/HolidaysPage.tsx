import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Pencil, Trash2, CalendarDays } from "lucide-react";
import toast from "react-hot-toast";
import { useHolidays, useDeleteHoliday } from "../../apis/api/holidays";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Model";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import type { Holiday } from "../../types/holiday.types";
import { formatHolidayListDate, groupHolidaysByMonth, HOLIDAY_MONTH_NAMES } from "./holidaysUtils";
import { HolidayFormModal } from "./HolidayFormModal";

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

  const grouped = groupHolidaysByMonth(holidays);
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

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setYear((y) => y - 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[3rem] text-center text-sm font-semibold text-slate-700">
          {year}
        </span>
        <button
          type="button"
          onClick={() => setYear((y) => y + 1)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

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
                  {HOLIDAY_MONTH_NAMES[Number(monthIdx)]}
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
                            <p className="text-xs text-slate-400">
                              {formatHolidayListDate(h.date)}
                            </p>
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
                              type="button"
                              onClick={() => handleEditOpen(h)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
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

      {formOpen && (
        <HolidayFormModal open={formOpen} onClose={handleFormClose} initial={editHoliday} />
      )}

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
