import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { Project, ProjectsListResponse } from "../../types/project.types";

export function useProjectsList(limit = 100, orgContext?: string) {
  return useQuery<Project[]>({
    queryKey: ["projects", limit, orgContext],
    queryFn: async (): Promise<Project[]> => {
      const res = await api.get<ProjectsListResponse>(apiPath.projects.list, {
        auth: true,
        query: { page: 1, limit, ...(orgContext ? { orgContext } : {}) },
      });
      return res.projects;
    },
  });
}

export type CreateProjectInput = { projectName: string; description: string; orgContext?: string };

export async function createProjectApi(body: CreateProjectInput) {
  const { orgContext, ...rest } = body;
  return api.post<{ success: boolean; project: Project }>(
    apiPath.projects.create + (orgContext ? `?orgContext=${orgContext}` : ""),
    rest,
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

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orgContext }: { id: string; orgContext?: string }) =>
      api.del(
        apiPath.projects.byId + id + (orgContext ? `?orgContext=${orgContext}` : ""),
        { auth: true }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
