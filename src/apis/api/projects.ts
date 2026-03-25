import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { Project, ProjectsListResponse } from "../../types/project.types";

export function useProjectsList(limit = 100) {
  return useQuery<Project[]>({
    queryKey: ["projects", limit],
    queryFn: async (): Promise<Project[]> => {
      const res = await api.get<ProjectsListResponse>(apiPath.projects.list, {
        auth: true,
        query: { page: 1, limit },
      });
      return res.projects;
    },
  });
}

export type CreateProjectInput = { projectName: string; description: string };

export async function createProjectApi(body: CreateProjectInput) {
  return api.post<{ success: boolean; project: Project }>(
    apiPath.projects.create,
    body,
    { auth: true }
  );
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["projects", "create"],
    mutationFn: (body: CreateProjectInput) => createProjectApi(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
