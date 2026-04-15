import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, uploadFormData } from "../apiService";
import { apiPath } from "../apiPath";
import type { Task, TasksListResponse, TaskTemplate, Subtask, TaskComment } from "../../types/task.types";

export type TaskListFilters = {
  page?: number;
  limit?: number;
  project?: string;
  archived?: boolean;
  scope?: "all" | "my";
  search?: string;
};

export function useTasksList(filters: TaskListFilters) {
  const { page = 1, limit = 10, project, archived, scope, search } = filters;
  return useQuery({
    queryKey: ["tasks", { page, limit, project, archived, scope, search }],
    queryFn: async () => {
      const res = await api.get<TasksListResponse>(apiPath.tasks.list, {
        auth: true,
        query: {
          page,
          limit,
          ...(project ? { project } : {}),
          archived: archived ? "true" : "false",
          ...(scope ? { scope } : {}),
          ...(search?.trim() ? { search: search.trim() } : {}),
        },
      });
      return res;
    },
  });
}

export function useTaskById(id: string | null) {
  return useQuery({
    queryKey: ["task", id],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; task: Task }>(
        `${apiPath.tasks.byId}${id}`,
        { auth: true }
      );
      return res.task;
    },
    enabled: !!id,
  });
}

export type CreateTaskInput = {
  project: string;
  assignedTo?: string;
  taskName: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "urgent";
  status?: "pending" | "in_progress" | "review" | "completed";
  subtasks?: { title: string; completed?: boolean; order?: number }[];
  timeEstimate?: number | null;
  templateName?: string | null;
};

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["createTask"],
    mutationFn: (body: CreateTaskInput) =>
      api.post<{ success: boolean; task: Task }>(apiPath.tasks.create, body, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export type UpdateTaskInput = {
  taskName?: string;
  description?: string;
  dueDate?: string | null;
  status?: "pending" | "in_progress" | "review" | "completed";
  priority?: "low" | "medium" | "urgent";
  archived?: boolean;
  subtasks?: Subtask[];
  timeEstimate?: number | null;
  timeLogged?: number;
};

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["updateTask"],
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskInput }) =>
      api.put<{ success: boolean; task: Task }>(
        `${apiPath.tasks.byId}${id}`,
        body,
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["addComment"],
    mutationFn: ({ taskId, text, mentions }: { taskId: string; text: string; mentions?: string[] }) =>
      api.post<{ success: boolean; comment: TaskComment }>(
        `${apiPath.tasks.byId}${taskId}/comments`,
        { text, mentions },
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["deleteComment"],
    mutationFn: ({ taskId, commentId }: { taskId: string; commentId: string }) =>
      api.del(`${apiPath.tasks.byId}${taskId}/comments/${commentId}`, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

export function useAddAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["addAttachment"],
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return uploadFormData("POST", `${apiPath.tasks.byId}${taskId}/attachments`, fd, { auth: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["deleteAttachment"],
    mutationFn: ({ taskId, attachmentId }: { taskId: string; attachmentId: string }) =>
      api.del(`${apiPath.tasks.byId}${taskId}/attachments/${attachmentId}`, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["task"] });
    },
  });
}

export function useTaskTemplates() {
  return useQuery({
    queryKey: ["taskTemplates"],
    queryFn: () =>
      api.get<{ success: boolean; templates: TaskTemplate[] }>(
        `${apiPath.tasks.list}/templates`,
        { auth: true }
      ),
  });
}
