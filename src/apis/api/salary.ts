import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL, apiPath } from "../apiPath";
import { api } from "../apiService";

export interface SalaryRecord {
  _id: string;
  employee: { _id: string; name: string } | string;
  month: string;
  year: number;
  basicSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  payDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface SalaryListResponse {
  success: boolean;
  message: string;
  salary: SalaryRecord[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

interface SalarySingleResponse {
  success: boolean;
  message: string;
  salary: SalaryRecord;
}

export const salaryQueryKey = ["salary"] as const;

export const useGetSalary = (page = 1, limit = 10, orgContext?: string) => {
  return useQuery({
    queryKey: ["salary", "list", page, limit, orgContext],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const res = await api.get<SalaryListResponse>(apiPath.salary.list, {
        auth: true,
        query: { page, limit, ...(orgContext ? { orgContext } : {}) },
      });
      return res;
    },
  });
};

export const useCreateSalary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["salary", "create"],
    mutationFn: async (body: {
      employee: string;
      month: string;
      year: number;
      basicSalary: number;
      bonus: number;
      deductions: number;
      payDate: string;
    }) => {
      return api.post<SalarySingleResponse>(apiPath.salary.create, body, {
        auth: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salaryQueryKey });
    },
  });
};

export const useUpdateSalary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["salary", "update"],
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: { basicSalary?: number; bonus?: number; deductions?: number };
    }) => {
      return api.put<SalarySingleResponse>(apiPath.salary.byId + id, body, {
        auth: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salaryQueryKey });
    },
  });
};

export const useDeleteSalary = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["salary", "delete"],
    mutationFn: async (id: string) => {
      return api.del<SalarySingleResponse>(apiPath.salary.byId + id, {
        auth: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: salaryQueryKey });
    },
  });
};

export const useGenerateSalaryPdf = () => {
  return useMutation({
    mutationKey: ["salary", "pdf"],
    mutationFn: async (id: string) => {
      const token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

      const res = await fetch(`${API_BASE_URL}${apiPath.salary.pdf}${id}`, {
        method: "GET",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          Accept: "application/pdf",
        },
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      return res.blob();
    },
  });
};
