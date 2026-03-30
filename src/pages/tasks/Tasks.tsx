import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Archive,
  CalendarDays,
  Columns3,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
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

const KANBAN_FETCH_LIMIT = 100;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

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
  review: {
    label: "Review",
    className:
      "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80",
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
  { label: "Review", value: "review" },
  { label: "Done", value: "completed" },
];

function isPopulatedProject(p: Task["project"]): p is Project {
  return typeof p === "object" && p !== null && "projectName" in p;
}

function taskProjectName(task: Task): string {
  return isPopulatedProject(task.project) ? task.project.projectName : "Project";
}

function taskAssigneeName(task: Task): string {
  if (
    task.assignedTo &&
    typeof task.assignedTo === "object" &&
    "name" in task.assignedTo
  ) {
    return task.assignedTo.name;
  }
  return "Unassigned";
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
  const assignee = taskAssigneeName(task);
  const projectName = taskProjectName(task);

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
  /** Server pagination for cards + table (default 10 rows per page). */
  const [taskListPage, setTaskListPage] = useState(1);
  const [taskListLimit, setTaskListLimit] = useState(10);
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
    (r) =>
      r === "super-admin" ||
      r === "admin" ||
      r === "manager" ||
      r === "hr" ||
      r === "employee"
  );
  const canAssignOthers = (me?.role ?? []).some(
    (r) =>
      r === "super-admin" ||
      r === "admin" ||
      r === "manager" ||
      r === "hr"
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
    if (view === "cards") {
      return {
        page: taskListPage,
        limit: taskListLimit,
        project: projectId,
        archived,
        scope,
      };
    }
    return {
      page: 1,
      limit: KANBAN_FETCH_LIMIT,
      project: projectId,
      archived,
      scope,
    };
  }, [tab, projectId, view, taskListPage, taskListLimit]);

  useEffect(() => {
    setTaskListPage(1);
  }, [tab, projectId]);

  const { data: tasksRes, isLoading, isError, error } = useTasksList(listFilters);
  const rawTasks = tasksRes?.tasks ?? [];
  const pagination = tasksRes?.pagination;

  /** Hide Done tasks from All/My once `updatedAt` is ≥24h ago (still show everything in Archived). Skip on cards view so server pagination matches the table. */
  const tasks = useMemo(() => {
    if (tab === "archived") return rawTasks;
    if (view === "cards") return rawTasks;
    return withoutStaleCompletedTasks(rawTasks);
  }, [rawTasks, tab, view]);

  const tableRangeLabel = useMemo(() => {
    const total = pagination?.totalTasks ?? 0;
    const currentPage = pagination?.currentPage ?? taskListPage;
    if (total === 0) return "No tasks";
    if (tasks.length === 0) {
      return `Page ${currentPage} · 0 of ${total}`;
    }
    const from = (currentPage - 1) * taskListLimit + 1;
    const to = from + tasks.length - 1;
    return `${from}–${to} of ${total}`;
  }, [pagination, taskListPage, taskListLimit, tasks.length]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      review: [],
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
        ...(canAssignOthers
          ? { assignedTo: formAssignee || undefined }
          : {}),
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

  const showGlobalEmpty =
    !isLoading &&
    !isError &&
    tasks.length === 0 &&
    (view !== "cards" || (pagination?.totalTasks ?? 0) === 0);

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
              Create task
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
      ) : showGlobalEmpty ? (
        <div className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50 px-6 py-16 text-center shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <p className="text-sm font-medium text-gray-800">No tasks here yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Create a task or adjust filters to see work items.
          </p>
          {canCreateTask ? (
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                variant="primary"
                onClick={openCreate}
                className="inline-flex items-center gap-2 shadow-[0_8px_24px_rgba(109,40,217,0.25)]"
              >
                <Plus className="h-4 w-4" />
                Create task
              </Button>
            </div>
          ) : null}
        </div>
      ) : view === "cards" ? (
        <div className="space-y-10">
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

          <section
            className="space-y-3"
            aria-labelledby="tasks-list-table-title"
          >
            <h3
              id="tasks-list-table-title"
              className="text-lg font-semibold tracking-tight text-gray-900"
            >
              Task list
            </h3>
            <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th scope="col" className="px-4 py-3.5">
                        Project
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Task
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Description
                      </th>
                      <th scope="col" className="px-4 py-3.5">
                        Assignee
                      </th>
                      <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                        Due
                      </th>
                      <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tasks.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-12 text-center text-sm text-gray-500"
                        >
                          No tasks on this page. Use the arrows or change rows
                          per page.
                        </td>
                      </tr>
                    ) : null}
                    {tasks.map((task) => (
                      <tr
                        key={`row-${task._id}`}
                        className="transition-colors hover:bg-violet-50/40"
                      >
                        <td className="px-4 py-3 align-top">
                          <span className="font-medium text-gray-700">
                            {taskProjectName(task)}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="font-semibold text-gray-900">
                            {task.taskName}
                          </span>
                        </td>
                        <td className="max-w-xs px-4 py-3 align-top text-gray-600">
                          <span className="line-clamp-2">
                            {task.description?.trim()
                              ? task.description
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-gray-700">
                          {taskAssigneeName(task)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-top text-gray-600">
                          {formatDue(task.dueDate)}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2">
                            <label
                              className="sr-only"
                              htmlFor={`table-status-${task._id}`}
                            >
                              Status for {task.taskName}
                            </label>
                            <select
                              id={`table-status-${task._id}`}
                              disabled={updatingId === task._id}
                              value={task.status}
                              onChange={(e) =>
                                handleStatusChange(
                                  task._id,
                                  e.target.value as TaskStatus
                                )
                              }
                              className="min-w-[8.5rem] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                  {o.label}
                                </option>
                              ))}
                            </select>
                            {updatingId === task._id ? (
                              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-600" />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                  <span className="text-gray-500">Rows per page</span>
                  <select
                    value={taskListLimit}
                    onChange={(e) => {
                      setTaskListLimit(Number(e.target.value));
                      setTaskListPage(1);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-900 shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    aria-label="Rows per page"
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-sm text-gray-600 tabular-nums">
                  {tableRangeLabel}
                </p>
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    disabled={pagination?.previousPage == null}
                    onClick={() => {
                      const prev = pagination?.previousPage;
                      if (prev != null) setTaskListPage(prev);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="min-w-[4.5rem] px-2 text-center text-xs font-medium text-gray-500 tabular-nums">
                    {pagination?.totalPages
                      ? `${pagination.currentPage} / ${pagination.totalPages}`
                      : "—"}
                  </span>
                  <button
                    type="button"
                    disabled={pagination?.nextPage == null}
                    onClick={() => {
                      const next = pagination?.nextPage;
                      if (next != null) setTaskListPage(next);
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible">
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
            title="Review"
            tasks={grouped.review}
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
          {canAssignOthers && userOptions.length > 0 ? (
            <Dropdown
              label="Assign to"
              placeholder="Unassigned"
              options={[{ label: "Unassigned", value: "" }, ...userOptions]}
              value={formAssignee}
              onChange={setFormAssignee}
            />
          ) : null}
          {!canAssignOthers ? (
            <p className="text-xs text-gray-500">
              This task will be assigned to you.
            </p>
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
