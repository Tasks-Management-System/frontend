import type { Task, TaskStatus } from "../../types/task.types";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onStatusChange: (id: string, status: TaskStatus) => void;
  updatingId: string | null;
  currentUserId?: string;
}

function KanbanColumn({ title, tasks, onStatusChange, updatingId, currentUserId }: KanbanColumnProps) {
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
              currentUserId={currentUserId}
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
}

export function KanbanView({ grouped, onStatusChange, updatingId, currentUserId }: KanbanViewProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2 xl:grid xl:grid-cols-4 xl:overflow-visible">
      <KanbanColumn
        title="Todo"
        tasks={grouped.pending}
        onStatusChange={onStatusChange}
        updatingId={updatingId}
        currentUserId={currentUserId}
      />
      <KanbanColumn
        title="In Progress"
        tasks={grouped.in_progress}
        onStatusChange={onStatusChange}
        updatingId={updatingId}
        currentUserId={currentUserId}
      />
      <KanbanColumn
        title="Review"
        tasks={grouped.review}
        onStatusChange={onStatusChange}
        updatingId={updatingId}
        currentUserId={currentUserId}
      />
      <KanbanColumn
        title="Done"
        tasks={grouped.completed}
        onStatusChange={onStatusChange}
        updatingId={updatingId}
        currentUserId={currentUserId}
      />
    </div>
  );
}
