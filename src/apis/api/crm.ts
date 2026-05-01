import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { Client, ContactLog, ForecastItem, Lead } from "../../types/crm.types";

const CLIENTS_KEY = ["clients"];
const LEADS_KEY = ["leads"];
const LOGS_KEY = ["contactLogs"];

// ---------- Clients ----------

export function useClients(search?: string, orgContext?: string) {
  return useQuery({
    queryKey: [...CLIENTS_KEY, search, orgContext],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (search) query.search = search;
      if (orgContext) query.orgContext = orgContext;
      const res = await api.get<{ success: boolean; data: Client[]; total: number }>(
        apiPath.clients.list,
        { auth: true, query: Object.keys(query).length ? query : undefined }
      );
      return res;
    },
  });
}

export function useCreateClient(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Client>) =>
      api.post<{ success: boolean; data: Client }>(
        apiPath.clients.list + (orgContext ? `?orgContext=${orgContext}` : ""),
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useUpdateClient(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Client> & { id: string }) =>
      api.put<{ success: boolean; data: Client }>(
        apiPath.clients.byId + id + (orgContext ? `?orgContext=${orgContext}` : ""),
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useDeleteClient(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del(
        apiPath.clients.byId + id + (orgContext ? `?orgContext=${orgContext}` : ""),
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

// ---------- Leads ----------

export function useLeads(orgContext?: string) {
  return useQuery({
    queryKey: [...LEADS_KEY, orgContext],
    queryFn: async () => {
      const res = await api.get<{ success: boolean; data: Lead[]; total: number }>(
        apiPath.leads.list,
        { auth: true, query: orgContext ? { orgContext } : undefined }
      );
      return res;
    },
  });
}

export function useRevenueForecast(orgContext?: string) {
  return useQuery({
    queryKey: [...LEADS_KEY, "forecast", orgContext],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: ForecastItem[];
        totalWeighted: number;
        totalValue: number;
      }>(apiPath.leads.forecast, { auth: true, query: orgContext ? { orgContext } : undefined });
      return res;
    },
  });
}

export function useCreateLead(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Lead> & { client: string }) =>
      api.post<{ success: boolean; data: Lead }>(
        apiPath.leads.list + (orgContext ? `?orgContext=${orgContext}` : ""),
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useUpdateLead(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Lead> & { id: string }) =>
      api.put<{ success: boolean; data: Lead }>(
        apiPath.leads.byId + id + (orgContext ? `?orgContext=${orgContext}` : ""),
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useUpdateLeadStage(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.patch<{ success: boolean; data: Lead }>(
        apiPath.leads.updateStage.replace(":id", id) + (orgContext ? `?orgContext=${orgContext}` : ""),
        { stage },
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useDeleteLead(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del(
        apiPath.leads.byId + id + (orgContext ? `?orgContext=${orgContext}` : ""),
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

// ---------- Contact Logs ----------

export function useContactLogs(clientId?: string, leadId?: string, orgContext?: string) {
  return useQuery({
    queryKey: [...LOGS_KEY, clientId, leadId, orgContext],
    queryFn: async () => {
      const query: Record<string, string> = {};
      if (clientId) query.clientId = clientId;
      if (leadId) query.leadId = leadId;
      if (orgContext) query.orgContext = orgContext;
      const res = await api.get<{ success: boolean; data: ContactLog[] }>(
        apiPath.contactLogs.list,
        { auth: true, query }
      );
      return res;
    },
    enabled: !!(clientId || leadId),
  });
}

export function useCreateContactLog(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      client: string;
      type: string;
      summary: string;
      lead?: string;
      loggedAt?: string;
    }) =>
      api.post<{ success: boolean; data: ContactLog }>(
        apiPath.contactLogs.list + (orgContext ? `?orgContext=${orgContext}` : ""),
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: LOGS_KEY }),
  });
}

export function useDeleteContactLog(orgContext?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del(
        apiPath.contactLogs.byId + id + (orgContext ? `?orgContext=${orgContext}` : ""),
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: LOGS_KEY }),
  });
}
