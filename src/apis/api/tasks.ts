import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { Task, TasksListResponse } from "../../types/task.types";

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

export type CreateTaskInput = {
  project: string;
  assignedTo?: string;
  taskName: string;
  description?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "urgent";
  status?: "pending" | "in_progress" | "review" | "completed";
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
    },
  });
}
