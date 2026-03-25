import type { Project } from "./project.types";
import type { User } from "./user.types";

export type TaskStatus = "pending" | "in_progress" | "completed";

export interface Task {
  _id: string;
  project: Project | string;
  assignedTo?: User | string | null;
  taskName: string;
  description?: string;
  dueDate?: string | null;
  archived?: boolean;
  priority: "low" | "medium" | "urgent";
  status: TaskStatus;
  readableTotalTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TasksListResponse {
  success: boolean;
  message: string;
  tasks: Task[];
  pagination: {
    totalTasks: number;
    totalPages: number;
    currentPage: number;
    nextPage: number | null;
    previousPage: number | null;
  };
}
