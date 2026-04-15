import type { Project } from "./project.types";
import type { User } from "./user.types";

export type TaskStatus = "pending" | "in_progress" | "review" | "completed";

export interface Subtask {
  _id?: string;
  title: string;
  completed: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskComment {
  _id: string;
  author: { _id: string; name: string; email: string } | string;
  text: string;
  mentions: { _id: string; name: string; email: string }[] | string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskAttachment {
  _id: string;
  filename: string;
  url: string;
  mimetype: string;
  size: number;
  uploadedBy: { _id: string; name: string; email: string } | string;
  createdAt?: string;
}

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
  subtasks?: Subtask[];
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  timeEstimate?: number | null;
  timeLogged?: number;
  templateName?: string | null;
  readableTotalTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskTemplate {
  _id: string;
  templateName: string;
  taskName: string;
  description?: string;
  subtasks?: Subtask[];
  priority: "low" | "medium" | "urgent";
  timeEstimate?: number | null;
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
