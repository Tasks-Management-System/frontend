import { useQuery } from "@tanstack/react-query"
import { api } from "../apiService"
import { apiPath } from "../apiPath"
import type { GetProjectsResponse } from "../../types/projects.types"

export const getProjects = () => {
    return useQuery({
        queryKey: ["projects"],
        queryFn: async () => {
            const res = await api.get(apiPath.projects.getProjects)
            return res as unknown as GetProjectsResponse
        },
        enabled: !!localStorage.getItem("token"),
    });
};