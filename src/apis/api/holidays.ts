import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { CreateHolidayBody, Holiday } from "../../types/holiday.types";

export const holidaysQueryKey = (year?: number) =>
  year ? ["holidays", year] : ["holidays"];

export function useHolidays(year?: number, orgContext?: string) {
  return useQuery({
    queryKey: holidaysQueryKey(year),
    queryFn: async (): Promise<Holiday[]> => {
      const query: Record<string, string | number> = {};
      if (year) query.year = year;
      if (orgContext) query.orgContext = orgContext;
      const res = await api.get<{ success: boolean; holidays: Holiday[] }>(
        apiPath.holidays.list,
        { auth: true, query }
      );
      return res.holidays ?? [];
    },
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateHolidayBody) =>
      api.post<{ success: boolean; holiday: Holiday }>(apiPath.holidays.list, body, {
        auth: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Partial<CreateHolidayBody> }) =>
      api.put<{ success: boolean; holiday: Holiday }>(apiPath.holidays.byId + id, body, {
        auth: true,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.del<{ success: boolean }>(apiPath.holidays.byId + id, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holidays"] }),
  });
}
