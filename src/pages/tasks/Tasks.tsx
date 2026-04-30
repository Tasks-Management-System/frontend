import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Archive, Columns3, LayoutGrid, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../apis/apiService";
import { useAssignableUsers, useUserById } from "../../apis/api/auth";
import { useProjectsList } from "../../apis/api/projects";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import { useTasksList, useUpdateTask } from "../../apis/api/tasks";
import { getUserId } from "../../utils/auth";
import type { TaskStatus } from "../../types/task.types";
import { withoutStaleCompletedTasks } from "../../utils/taskStaleHide";
import Button from "../../components/UI/Button";
import { PillTabBar, type PillTabItem } from "../../components/UI/PillTabBar";
import { TasksPageSkeleton } from "../../components/UI/Skeleton";
import { KanbanView } from "./KanbanView";
import { ListView } from "./ListView";
import { TaskCreateModal } from "./TaskCreateModal";
import { TaskDetailModal } from "./TaskDetailModal";

type TabKey = "all" | "my" | "archived";
type ViewMode = "cards" | "kanban";

const KANBAN_FETCH_LIMIT = 100;

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Tasks" },
  { key: "my", label: "My Tasks" },
  { key: "archived", label: "Archived" },
];

const VIEW_TOGGLE_ITEMS: PillTabItem[] = [
  { key: "kanban", label: "Board", icon: <Columns3 className="h-3.5 w-3.5 opacity-70" /> },
  { key: "cards", label: "Cards", icon: <LayoutGrid className="h-3.5 w-3.5 opacity-70" /> },
];

export default function Tasks() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("project") ?? undefined;

  const [tab, setTab] = useState<TabKey>("all");
  const [view, setView] = useState<ViewMode>("kanban");
  const [taskListPage, setTaskListPage] = useState(1);
  const [taskListLimit, setTaskListLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("pending");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, TaskStatus>>({});

  const userId = getUserId();
  const { data: me } = useUserById(userId);
  const { activeMode } = useActiveOrg();
  const { data: projects = [] } = useProjectsList(100, activeMode);
  const { data: users = [] } = useAssignableUsers(activeMode);

  const canCreateTask = (me?.role ?? []).some((r) =>
    ["super-admin", "admin", "manager", "hr", "employee"].includes(r)
  );
  const canAssignOthers = (me?.role ?? []).some((r) =>
    ["super-admin", "admin", "manager", "hr"].includes(r)
  );

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
        orgContext: activeMode,
      };
    }
    return {
      page: 1,
      limit: KANBAN_FETCH_LIMIT,
      project: projectId,
      archived,
      scope,
      orgContext: activeMode,
    };
  }, [tab, projectId, view, taskListPage, taskListLimit, activeMode]);

  useEffect(() => {
    setTaskListPage(1);
  }, [tab, projectId]);

  const { data: tasksRes, isLoading, isError, error } = useTasksList(listFilters);
  const rawTasks = useMemo(() => tasksRes?.tasks ?? [], [tasksRes?.tasks]);
  const pagination = tasksRes?.pagination;

  const tasks = useMemo(() => {
    const base =
      tab === "archived" || view === "cards" ? rawTasks : withoutStaleCompletedTasks(rawTasks);
    // Apply any in-flight optimistic status overrides so the card moves immediately on drop
    if (Object.keys(optimisticStatuses).length === 0) return base;
    return base.map((t) =>
      optimisticStatuses[t._id] ? { ...t, status: optimisticStatuses[t._id] } : t
    );
  }, [rawTasks, tab, view, optimisticStatuses]);

  const tableRangeLabel = useMemo(() => {
    const total = pagination?.totalTasks ?? 0;
    const currentPage = pagination?.currentPage ?? taskListPage;
    if (total === 0) return "No tasks";
    if (tasks.length === 0) return `Page ${currentPage} · 0 of ${total}`;
    const from = (currentPage - 1) * taskListLimit + 1;
    const to = from + tasks.length - 1;
    return `${from}–${to} of ${total}`;
  }, [pagination, taskListPage, taskListLimit, tasks.length]);

  const grouped = useMemo(() => {
    const g: Record<TaskStatus, typeof tasks> = {
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

  const projectOptions = projects.map((p) => ({ label: p.projectName, value: p._id }));
  const assigneeOptions = useMemo(() => {
    const meId = me?._id || userId;
    const others = users
      .filter((u) => String(u._id) !== String(meId))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    const meOpt = meId ? [{ label: "Me", value: meId }] : [];
    return [
      { label: "Unassigned", value: "" },
      ...meOpt,
      ...others.map((u) => ({ label: u.name, value: u._id })),
    ];
  }, [me?._id, userId, users]);

  const handleAddTask = (status: TaskStatus) => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  const selectedTask = useMemo(
    () => tasks.find((t) => t._id === selectedTaskId) ?? null,
    [tasks, selectedTaskId]
  );

  const handleTaskClick = (task: { _id: string }) => {
    setSelectedTaskId(task._id);
  };

  // Clear optimistic overrides only once the server data confirms the new status —
  // avoids the flash that happens when clearing too early (before refetch lands).
  useEffect(() => {
    setOptimisticStatuses((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const serverTask = rawTasks.find((t) => t._id === id);
        if (serverTask && serverTask.status === next[id]) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rawTasks]);

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    setUpdatingId(id);
    // Move the card immediately — don't wait for the API
    setOptimisticStatuses((prev) => ({ ...prev, [id]: status }));
    try {
      await updateMut.mutateAsync({ id, body: { status } });
    } catch (e) {
      // Revert the optimistic move on failure
      setOptimisticStatuses((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.error((e as ApiError)?.message ?? "Could not update task");
    } finally {
      setUpdatingId(null);
    }
  };

  const heading = selectedProject ? selectedProject.projectName : "Tasks";
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
              onClick={() => setCreateOpen(true)}
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
          icon: t.key === "archived" ? <Archive className="h-3.5 w-3.5 opacity-70" /> : undefined,
        }))}
        activeKey={tab}
        onTabChange={(key) => setTab(key as TabKey)}
      />

      {isLoading ? (
        <TasksPageSkeleton />
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
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 shadow-[0_8px_24px_rgba(109,40,217,0.25)]"
              >
                <Plus className="h-4 w-4" />
                Create task
              </Button>
            </div>
          ) : null}
        </div>
      ) : view === "cards" ? (
        <ListView
          tasks={tasks}
          pagination={pagination}
          taskListPage={taskListPage}
          taskListLimit={taskListLimit}
          tableRangeLabel={tableRangeLabel}
          updatingId={updatingId}
          currentUserId={userId}
          onStatusChange={handleStatusChange}
          onPageChange={setTaskListPage}
          onLimitChange={(limit) => {
            setTaskListLimit(limit);
            setTaskListPage(1);
          }}
          onTaskClick={handleTaskClick}
        />
      ) : (
        <KanbanView
          grouped={grouped}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
          currentUserId={userId}
          canCreateTask={canCreateTask}
          onAddTask={handleAddTask}
          onTaskClick={handleTaskClick}
        />
      )}

      <TaskCreateModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        projectOptions={projectOptions}
        assigneeOptions={assigneeOptions}
        canAssignOthers={canAssignOthers}
        defaultProjectId={projectId ?? projects[0]?._id}
        defaultAssigneeId={me?._id ?? userId}
        defaultStatus={createStatus}
      />

      <TaskDetailModal
        task={selectedTask}
        isOpen={selectedTaskId !== null}
        onClose={() => setSelectedTaskId(null)}
        currentUserId={userId}
      />
    </div>
  );
}
