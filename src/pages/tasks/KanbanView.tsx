import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import type { Task, TaskStatus } from "../../types/task.types";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  updatingId: string | null;
  currentUserId?: string;
  canCreateTask?: boolean;
  onAddTask?: (status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
  draggingTaskId: string | null;
  onDragStart: (taskId: string, fromStatus: TaskStatus) => void;
  onDragEnd: () => void;
  onDrop: (toStatus: TaskStatus) => void;
}

function KanbanColumn({
  title,
  status,
  tasks,
  onStatusChange,
  updatingId,
  currentUserId,
  canCreateTask,
  onAddTask,
  onTaskClick,
  draggingTaskId,
  onDragStart,
  onDragEnd,
  onDrop,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isActive = isDragOver && draggingTaskId !== null;

  return (
    <div
      className={`flex min-h-[65vh] min-w-[280px] flex-1 flex-col rounded-2xl border p-3 shadow-inner transition-colors duration-150 ${
        isActive
          ? "border-violet-400 bg-violet-50/60"
          : "border-gray-200/70 bg-gradient-to-b from-gray-50/80 to-white/40"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (draggingTaskId) setIsDragOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsDragOver(false);
        }
      }}
      onDrop={() => {
        setIsDragOver(false);
        onDrop(status);
      }}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 shadow-sm ring-1 ring-gray-200/80">
            {tasks.length}
          </span>
          {canCreateTask && onAddTask ? (
            <button
              type="button"
              onClick={() => onAddTask(status)}
              title={`Add task to ${title}`}
              className="rounded-full p-0.5 text-gray-400 transition-colors hover:bg-violet-100 hover:text-violet-600"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-0.5">
        {tasks.length === 0 ? (
          <div
            className={`flex flex-1 items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors duration-150 ${
              isActive ? "border-violet-300 bg-violet-50/40" : "border-gray-200/70"
            }`}
          >
            <p className="text-xs text-gray-400">
              {isActive ? "Drop here" : "No tasks"}
            </p>
          </div>
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              onStatusChange={onStatusChange}
              updating={updatingId === t._id}
              currentUserId={currentUserId}
              isDragging={draggingTaskId === t._id}
              onDragStart={() => onDragStart(t._id, status)}
              onDragEnd={onDragEnd}
              onTaskClick={onTaskClick}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface KanbanViewProps {
  grouped: Record<TaskStatus, Task[]>;
  onStatusChange: (id: string, status: TaskStatus) => void;
  updatingId: string | null;
  currentUserId?: string;
  canCreateTask?: boolean;
  onAddTask?: (status: TaskStatus) => void;
  onTaskClick?: (task: Task) => void;
}

const COLUMNS: { title: string; status: TaskStatus }[] = [
  { title: "Todo", status: "pending" },
  { title: "In Progress", status: "in_progress" },
  { title: "Review", status: "review" },
  { title: "Done", status: "completed" },
];

export function KanbanView({
  grouped,
  onStatusChange,
  updatingId,
  currentUserId,
  canCreateTask,
  onAddTask,
  onTaskClick,
}: KanbanViewProps) {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const draggingFromStatus = useRef<TaskStatus | null>(null);

  const handleDragStart = (taskId: string, fromStatus: TaskStatus) => {
    setDraggingTaskId(taskId);
    draggingFromStatus.current = fromStatus;
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    draggingFromStatus.current = null;
  };

  const handleDrop = (toStatus: TaskStatus) => {
    if (
      draggingTaskId &&
      draggingFromStatus.current &&
      draggingFromStatus.current !== toStatus
    ) {
      onStatusChange(draggingTaskId, toStatus);
    }
    setDraggingTaskId(null);
    draggingFromStatus.current = null;
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible">
      {COLUMNS.map(({ title, status }) => (
        <KanbanColumn
          key={status}
          title={title}
          status={status}
          tasks={grouped[status]}
          onStatusChange={onStatusChange}
          updatingId={updatingId}
          currentUserId={currentUserId}
          canCreateTask={canCreateTask}
          onAddTask={onAddTask}
          onTaskClick={onTaskClick}
          draggingTaskId={draggingTaskId}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}
