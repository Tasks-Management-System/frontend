import { useState, useMemo } from "react";
import {
  Clock,
  Plus,
  Pencil,
  Trash2,
  Download,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useTimesheets,
  useLogTime,
  useUpdateTimesheetEntry,
  useDeleteTimesheetEntry,
  downloadTimesheetCsv,
} from "../../apis/api/timesheets";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/auth";
import { useProjectsList } from "../../apis/api/projects";
import { useTasksList } from "../../apis/api/tasks";
import type { TimesheetEntry } from "../../types/timesheet.types";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { ApiError } from "../../apis/apiService";

function getISOWeek(date: Date): { week: number; year: number } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week =
    1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return { week, year: d.getFullYear() };
}

function getWeekDates(week: number, year: number): { start: Date; end: Date } {
  const jan1 = new Date(year, 0, 1);
  const dayOffset = jan1.getDay() <= 4 ? 1 - jan1.getDay() : 8 - jan1.getDay();
  const start = new Date(jan1.getTime() + (week - 1) * 7 * 86400000 + dayOffset * 86400000);
  const end = new Date(start.getTime() + 6 * 86400000);
  return { start, end };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type LogForm = {
  project: string;
  task: string;
  date: string;
  hours: string;
  description: string;
  billable: boolean;
};

export default function Timesheets() {
  const userId = getUserId();
  const { data: user } = useUserById(userId);
  const roles = user?.role ?? [];
  const canViewAll = roles.some((r: string) =>
    ["admin", "hr", "manager", "super-admin"].includes(r)
  );

  const now = new Date();
  const current = getISOWeek(now);
  const [week, setWeek] = useState(current.week);
  const [year, setYear] = useState(current.year);

  const { data, isLoading } = useTimesheets({ week, year });
  const entries = useMemo(() => data?.entries ?? [], [data?.entries]);
  const summary = data?.summary ?? { totalHours: 0, billableHours: 0, nonBillableHours: 0 };

  const { data: projects = [] } = useProjectsList(200);

  const [selectedProject, setSelectedProject] = useState("");
  const { data: tasksData } = useTasksList({
    project: selectedProject || undefined,
    limit: 200,
  });
  const tasks = tasksData?.tasks ?? [];

  const logMutation = useLogTime();
  const updateMutation = useUpdateTimesheetEntry();
  const deleteMutation = useDeleteTimesheetEntry();

  const [logOpen, setLogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TimesheetEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimesheetEntry | null>(null);

  const defaultForm: LogForm = {
    project: "",
    task: "",
    date: todayIso(),
    hours: "",
    description: "",
    billable: true,
  };
  const [form, setForm] = useState<LogForm>(defaultForm);

  const openLog = () => {
    setForm(defaultForm);
    setSelectedProject("");
    setLogOpen(true);
  };

  const openEdit = (e: TimesheetEntry) => {
    setForm({
      project: e.project._id,
      task: e.task?._id ?? "",
      date: new Date(e.date).toISOString().slice(0, 10),
      hours: String(e.hours),
      description: e.description,
      billable: e.billable,
    });
    setSelectedProject(e.project._id);
    setEditTarget(e);
  };

  const closeAll = () => {
    setLogOpen(false);
    setEditTarget(null);
    setDeleteTarget(null);
  };

  const handleLog = async () => {
    if (!form.project || !form.date || !form.hours) {
      toast.error("Project, date, and hours are required");
      return;
    }
    const hrs = parseFloat(form.hours);
    if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
      toast.error("Hours must be between 0.25 and 24");
      return;
    }
    try {
      await logMutation.mutateAsync({
        project: form.project,
        task: form.task || undefined,
        date: form.date,
        hours: hrs,
        description: form.description,
        billable: form.billable,
      });
      toast.success("Time logged");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    const hrs = parseFloat(form.hours);
    if (isNaN(hrs) || hrs <= 0 || hrs > 24) {
      toast.error("Hours must be between 0.25 and 24");
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editTarget._id,
        body: {
          project: form.project,
          task: form.task || undefined,
          date: form.date,
          hours: hrs,
          description: form.description,
          billable: form.billable,
        },
      });
      toast.success("Updated");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast.success("Deleted");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const goToPrevWeek = () => {
    if (week === 1) {
      setWeek(52);
      setYear((y) => y - 1);
    } else {
      setWeek((w) => w - 1);
    }
  };

  const goToNextWeek = () => {
    if (week === 52) {
      setWeek(1);
      setYear((y) => y + 1);
    } else {
      setWeek((w) => w + 1);
    }
  };

  const weekDates = useMemo(() => getWeekDates(week, year), [week, year]);

  const handleExport = () => {
    downloadTimesheetCsv({ week, year });
    toast.success("Downloading CSV…");
  };

  const groupedByDate = useMemo(() => {
    const map = new Map<string, TimesheetEntry[]>();
    for (const e of entries) {
      const d = new Date(e.date).toDateString();
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(e);
    }
    return Array.from(map.entries()).sort(
      ([a], [b]) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [entries]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-violet-600" />
            Timesheets
          </h1>
          <p className="mt-1 text-sm text-slate-500">Log hours against tasks and projects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openLog}>
            Log time
          </Button>
        </div>
      </div>

      {/* Week navigator */}
      <div className="mt-6 flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <button
          onClick={goToPrevWeek}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-900">
            Week {week}, {year}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {weekDates.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} —{" "}
            {weekDates.end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={goToNextWeek}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Summary cards */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          {
            label: "Total Hours",
            value: summary.totalHours,
            color: "text-violet-700",
            bg: "bg-violet-50",
          },
          {
            label: "Billable",
            value: summary.billableHours,
            color: "text-emerald-700",
            bg: "bg-emerald-50",
          },
          {
            label: "Non-billable",
            value: summary.nonBillableHours,
            color: "text-amber-700",
            bg: "bg-amber-50",
          },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`rounded-2xl ${bg} px-4 py-3 text-center`}>
            <p className={`text-2xl font-bold ${color}`}>{value.toFixed(1)}h</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Entries */}
      <div className="mt-5 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-14 text-center">
            <Clock className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No time logged this week</p>
            <Button
              className="mt-4"
              size="sm"
              onClick={openLog}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Log time
            </Button>
          </div>
        ) : (
          groupedByDate.map(([dateStr, dayEntries]) => (
            <div key={dateStr}>
              <div className="mb-2 flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {new Date(dateStr).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <div className="flex-1 h-px bg-gray-200" />
                <p className="text-xs font-semibold text-gray-600">
                  {dayEntries.reduce((s, e) => s + e.hours, 0).toFixed(1)}h
                </p>
              </div>
              <div className="space-y-2">
                {dayEntries.map((entry) => (
                  <EntryRow
                    key={entry._id}
                    entry={entry}
                    canManage={canViewAll || entry.user._id === userId}
                    onEdit={() => openEdit(entry)}
                    onDelete={() => setDeleteTarget(entry)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Log Modal */}
      <Modal isOpen={logOpen} onClose={closeAll} title="Log time" panelClassName="max-w-lg">
        <TimeForm
          form={form}
          setForm={setForm}
          projects={projects}
          tasks={tasks}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          onSubmit={handleLog}
          onCancel={closeAll}
          loading={logMutation.isPending}
          submitLabel="Log"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={closeAll} title="Edit entry" panelClassName="max-w-lg">
        <TimeForm
          form={form}
          setForm={setForm}
          projects={projects}
          tasks={tasks}
          selectedProject={selectedProject}
          setSelectedProject={setSelectedProject}
          onSubmit={handleUpdate}
          onCancel={closeAll}
          loading={updateMutation.isPending}
          submitLabel="Save"
        />
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={closeAll} title="Delete entry">
        <p className="text-sm text-gray-600">Delete this time entry? This cannot be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeAll}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function EntryRow({
  entry,
  canManage,
  onEdit,
  onDelete,
}: {
  entry: TimesheetEntry;
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:shadow transition">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Clock className="h-4 w-4 text-violet-600" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-gray-900">{entry.project?.projectName ?? "—"}</p>
          {entry.task && (
            <>
              <span className="text-gray-400">·</span>
              <p className="text-sm text-gray-600 truncate">{entry.task.taskName}</p>
            </>
          )}
        </div>
        {entry.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{entry.description}</p>
        )}
        {entry.user && <p className="text-xs text-gray-400">{entry.user.name}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            entry.billable ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
          }`}
        >
          <DollarSign className="h-3 w-3" />
          {entry.billable ? "Billable" : "Non-billable"}
        </span>
        <span className="text-sm font-semibold text-gray-900 w-10 text-right">{entry.hours}h</span>
        {canManage && (
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TimeForm({
  form,
  setForm,
  projects,
  tasks,
  selectedProject,
  setSelectedProject,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  form: LogForm;
  setForm: React.Dispatch<React.SetStateAction<LogForm>>;
  projects: { _id: string; projectName: string }[];
  tasks: { _id: string; taskName: string }[];
  selectedProject: string;
  setSelectedProject: (id: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
        <select
          value={form.project}
          onChange={(e) => {
            setForm((s) => ({ ...s, project: e.target.value, task: "" }));
            setSelectedProject(e.target.value);
          }}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        >
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.projectName}
            </option>
          ))}
        </select>
      </div>

      {selectedProject && tasks.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task (optional)</label>
          <select
            value={form.task}
            onChange={(e) => setForm((s) => ({ ...s, task: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">No specific task</option>
            {tasks.map((t) => (
              <option key={t._id} value={t._id}>
                {t.taskName}
              </option>
            ))}
          </select>
        </div>
      )}

      <Input
        label="Date *"
        name="date"
        type="date"
        value={form.date}
        onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
        required
      />

      <Input
        label="Hours *"
        name="hours"
        type="number"
        value={form.hours}
        onChange={(e) => setForm((s) => ({ ...s, hours: e.target.value }))}
        placeholder="e.g. 2.5"
        required
      />

      <Input
        label="Description"
        name="description"
        type="textarea"
        value={form.description}
        onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
        placeholder="What did you work on?"
      />

      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.billable}
          onChange={(e) => setForm((s) => ({ ...s, billable: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-violet-600"
        />
        Billable hours
      </label>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button loading={loading} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
