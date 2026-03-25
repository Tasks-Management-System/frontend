import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Archive,
  CalendarDays,
  Columns3,
  LayoutGrid,
  Loader2,
  Plus,
  UserRound,
} from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../apis/apiService";
import { useAssignableUsers } from "../../apis/api/auth";
import { useProjectsList } from "../../apis/api/projects";
import {
  useCreateTask,
  useTasksList,
  useUpdateTask,
} from "../../apis/api/tasks";
import { getUserById } from "../../apis/api/auth";
import type { Task, TaskStatus } from "../../types/task.types";
import { withoutStaleCompletedTasks } from "../../utils/taskStaleHide";
import type { Project } from "../../types/project.types";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Model";
import Input from "../../components/UI/Input";
import Dropdown from "../../components/UI/Dropdown";
import { PillTabBar, type PillTabItem } from "../../components/UI/PillTabBar";

type TabKey = "all" | "my" | "archived";
type ViewMode = "cards" | "kanban";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Tasks" },
  { key: "my", label: "My Tasks" },
  { key: "archived", label: "Archived" },
];

const VIEW_TOGGLE_ITEMS: PillTabItem[] = [
  {
    key: "kanban",
    label: "Board",
    icon: <Columns3 className="h-3.5 w-3.5 opacity-70" />,
  },
  {
    key: "cards",
    label: "Cards",
    icon: <LayoutGrid className="h-3.5 w-3.5 opacity-70" />,
  },
];

const STATUS_UI: Record<
  TaskStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Todo",
    className:
      "bg-slate-100 text-slate-700 ring-1 ring-slate-200/80",
  },
  in_progress: {
    label: "In Progress",
    className:
      "bg-violet-50 text-violet-800 ring-1 ring-violet-200/80",
  },
  completed: {
    label: "Done",
    className:
      "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80",
  },
};

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "Urgent", value: "urgent" },
];

const STATUS_OPTIONS = [
  { label: "Todo", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Done", value: "completed" },
];

function isPopulatedProject(p: Task["project"]): p is Project {
  return typeof p === "object" && p !== null && "projectName" in p;
}

function formatDue(d?: string | null) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return "—";
  }
}

function TaskCard({
  task,
  onStatusChange,
  updating,
}: {
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  updating: boolean;
}) {
  const assignee =
    task.assignedTo &&
    typeof task.assignedTo === "object" &&
    "name" in task.assignedTo
      ? task.assignedTo.name
      : "Unassigned";

  const projectName = isPopulatedProject(task.project)
    ? task.project.projectName
    : "Project";

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/90 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] ring-1 ring-black/[0.03] transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/80 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            {projectName}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">
            {task.taskName}
          </h3>
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_UI[task.status].className}`}
        >
          {STATUS_UI[task.status].label}
        </span>
      </div>
      {task.description ? (
        <p className="mt-2 text-sm text-gray-600 line-clamp-2">
          {task.description}
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-400 italic">No description</p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-gray-400" />
          {assignee}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
          {formatDue(task.dueDate)}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        <label className="sr-only" htmlFor={`status-${task._id}`}>
          Change status
        </label>
        <select
          id={`status-${task._id}`}
          disabled={updating}
          value={task.status}
          onChange={(e) =>
            onStatusChange(task._id, e.target.value as TaskStatus)
          }
          className="w-full max-w-[200px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {updating ? (
          <Loader2 className="h-4 w-4 animate-spin text-violet-600" />
        ) : null}
      </div>
    </article>
  );
}

function KanbanColumn({
  title,
  tasks,
  onStatusChange,
  updatingId,
}: {
  title: string;
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  updatingId: string | null;
}) {
  return (
    <div className="flex min-h-[320px] min-w-[280px] flex-1 flex-col rounded-2xl border border-gray-200/70 bg-gradient-to-b from-gray-50/80 to-white/40 p-3 shadow-inner">
      <div className="mb-3 flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <p className="px-1 text-xs text-gray-400">No tasks</p>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              onStatusChange={onStatusChange}
              updating={updatingId === t._id}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") ?? undefined;

  const [tab, setTab] = useState<TabKey>("all");
  const [view, setView] = useState<ViewMode>("kanban");
  const [createOpen, setCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [formProject, setFormProject] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDue, setFormDue] = useState("");
  const [formPriority, setFormPriority] = useState("medium");
  const [formAssignee, setFormAssignee] = useState("");

  const userId = localStorage.getItem("userId") ?? "";
  const { data: me } = getUserById(userId);
  const { data: projects = [] } = useProjectsList(100);
  const { data: users = [] } = useAssignableUsers();
  const canCreateTask = (me?.role ?? []).some(
    (r) => r === "admin" || r === "manager"
  );
  const createMut = useCreateTask();
  const updateMut = useUpdateTask();

  const selectedProject = useMemo(
    () => projects.find((p) => p._id === projectId),
    [projects, projectId]
  );

  const listFilters = useMemo(() => {
    const archived = tab === "archived";
    const scope = tab === "my" ? ("my" as const) : undefined;
    return {
      limit: 100,
      project: projectId,
      archived,
      scope,
    };
  }, [tab, projectId]);

  const { data: tasksRes, isLoading, isError, error } = useTasksList(listFilters);
  const rawTasks = tasksRes?.tasks ?? [];
  /** Hide Done tasks from All/My once `updatedAt` is ≥24h ago (still show everything in Archived). */
  const tasks = useMemo(() => {
    if (tab === "archived") return rawTasks;
    return withoutStaleCompletedTasks(rawTasks);
  }, [rawTasks, tab]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      completed: [],
    };
    for (const t of tasks) {
      if (g[t.status]) g[t.status].push(t);
    }
    return g;
  }, [tasks]);

  const projectOptions = projects.map((p) => ({
    label: p.projectName,
    value: p._id,
  }));

  const userOptions = users.map((u) => ({
    label: u.name,
    value: u._id,
  }));

  const openCreate = () => {
    setFormProject(projectId ?? projects[0]?._id ?? "");
    setFormTitle("");
    setFormDescription("");
    setFormDue("");
    setFormPriority("medium");
    setFormAssignee("");
    setCreateOpen(true);
  };

  const handleCreate = async () => {
    if (!formProject || !formTitle.trim()) {
      toast.error("Project and task title are required.");
      return;
    }
    try {
      await createMut.mutateAsync({
        project: formProject,
        taskName: formTitle.trim(),
        description: formDescription.trim() || undefined,
        dueDate: formDue ? new Date(formDue).toISOString() : undefined,
        priority: formPriority as "low" | "medium" | "urgent",
        assignedTo: formAssignee || undefined,
        status: "pending",
      });
      toast.success("Task created");
      setCreateOpen(false);
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not create task");
    }
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setUpdatingId(id);
    try {
      await updateMut.mutateAsync({ id, body: { status } });
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not update task");
    } finally {
      setUpdatingId(null);
    }
  };

  const heading = selectedProject
    ? selectedProject.projectName
    : "Tasks";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            {heading}
          </h2>
          <p className="text-sm text-gray-500">
            {selectedProject
              ? "Tasks in this project. Switch tabs or view to work the way you like."
              : "Plan, track, and ship work across your workspace."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PillTabBar
            size="sm"
            items={VIEW_TOGGLE_ITEMS}
            activeKey={view}
            onTabChange={(key) => setView(key as ViewMode)}
          />
          {canCreateTask ? (
            <Button
              type="button"
              variant="primary"
              onClick={openCreate}
              className="inline-flex items-center gap-2 shadow-[0_8px_24px_rgba(109,40,217,0.25)]"
            >
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          ) : null}
        </div>
      </div>

      <PillTabBar
        items={TABS.map((t) => ({
          key: t.key,
          label: t.label,
          icon:
            t.key === "archived" ? (
              <Archive className="h-3.5 w-3.5 opacity-70" />
            ) : undefined,
        }))}
        activeKey={tab}
        onTabChange={(key) => setTab(key as TabKey)}
      />

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white/60 py-20 text-sm text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-violet-600" />
          Loading tasks…
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800">
          {(error as Error)?.message ?? "Failed to load tasks."}
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50 px-6 py-16 text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-medium text-gray-800">No tasks here yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create a task or adjust filters to see work items.
          </p>
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onStatusChange={handleStatusChange}
              updating={updatingId === task._id}
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible">
          <KanbanColumn
            title="Todo"
            tasks={grouped.pending}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
          <KanbanColumn
            title="In Progress"
            tasks={grouped.in_progress}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
          <KanbanColumn
            title="Done"
            tasks={grouped.completed}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create task"
        panelClassName="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Dropdown
              label="Project"
              placeholder="Select project"
              options={projectOptions}
              value={formProject}
              onChange={setFormProject}
            />
            <Dropdown
              label="Priority"
              options={PRIORITY_OPTIONS}
              value={formPriority}
              onChange={setFormPriority}
            />
          </div>
          {userOptions.length > 0 ? (
            <Dropdown
              label="Assign to"
              placeholder="Unassigned"
              options={[{ label: "Unassigned", value: "" }, ...userOptions]}
              value={formAssignee}
              onChange={setFormAssignee}
            />
          ) : null}
          <Input
            label="Title"
            placeholder="What needs to be done?"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
          />
          <Input
            type="textarea"
            label="Description"
            placeholder="Add context, links, or acceptance criteria"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
          />
          <Input
            type="date"
            label="Due date"
            value={formDue}
            onChange={(e) => setFormDue(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={createMut.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
            >
              {createMut.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Save
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
