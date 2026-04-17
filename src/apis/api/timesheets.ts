import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath, API_BASE_URL } from "../apiPath";
import { getToken } from "../../utils/auth";
import type { TimesheetEntry, TimesheetsListResponse } from "../../types/timesheet.types";

export type TimesheetFilters = {
  week?: number;
  year?: number;
  userId?: string;
  project?: string;
  billable?: boolean;
};

export function useTimesheets(filters: TimesheetFilters = {}) {
  const query: Record<string, string | number | boolean> = {};
  if (filters.week !== undefined) query.week = filters.week;
  if (filters.year !== undefined) query.year = filters.year;
  if (filters.userId) query.userId = filters.userId;
  if (filters.project) query.project = filters.project;
  if (filters.billable !== undefined) query.billable = filters.billable;

  return useQuery({
    queryKey: ["timesheets", filters],
    queryFn: () =>
      api.get<TimesheetsListResponse>(apiPath.timesheets.list, {
        auth: true,
        query,
      }),
  });
}

export type LogTimeInput = {
  project: string;
  task?: string;
  date: string;
  hours: number;
  description?: string;
  billable?: boolean;
};

export function useLogTime() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LogTimeInput) =>
      api.post<{ success: boolean; entry: TimesheetEntry }>(
        apiPath.timesheets.log,
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}

export function useUpdateTimesheetEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Partial<LogTimeInput>;
    }) =>
      api.put<{ success: boolean; entry: TimesheetEntry }>(
        `${apiPath.timesheets.byId}${id}`,
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}

export function useDeleteTimesheetEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del(`${apiPath.timesheets.byId}${id}`, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["timesheets"] }),
  });
}

export function downloadTimesheetCsv(filters: TimesheetFilters = {}) {
  const params = new URLSearchParams();
  if (filters.week !== undefined) params.set("week", String(filters.week));
  if (filters.year !== undefined) params.set("year", String(filters.year));
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.project) params.set("project", filters.project);

  const token = getToken();
  const url = `${API_BASE_URL}${apiPath.timesheets.exportCsv}?${params.toString()}`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "timesheet.csv");

  // Fetch with auth and trigger download
  fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(blob);
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    });
}
