import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  Applicant,
  CreateApplicantBody,
  Interview,
  ScheduleInterviewBody,
  SubmitFeedbackBody,
  HiringStage,
} from "../../types/hiring.types";

// ─── Query keys ──────────────────────────────────────────────────────────────
export const hiringQueryKey = ["hiring"] as const;
export const interviewsQueryKey = ["interviews"] as const;

// ─── Applicants ──────────────────────────────────────────────────────────────

export function useApplicants(page = 1, limit = 50, orgContext?: string) {
  return useQuery({
    queryKey: [...hiringQueryKey, page, limit, orgContext],
    queryFn: async (): Promise<{ hiring: Applicant[]; totalHirings: number }> => {
      const res = await api.get<{ success: boolean; hiring: Applicant[]; totalHirings: number }>(
        apiPath.hiring.getHiring,
        { auth: true, query: { page, limit, ...(orgContext ? { orgContext } : {}) } }
      );
      return { hiring: res.hiring ?? [], totalHirings: res.totalHirings ?? 0 };
    },
  });
}

export function useApplicantById(id: string | null) {
  return useQuery({
    queryKey: [...hiringQueryKey, id],
    enabled: !!id,
    queryFn: async (): Promise<Applicant> => {
      const res = await api.get<{ success: boolean; hiring: Applicant }>(
        apiPath.hiring.getHiringById + id,
        { auth: true }
      );
      return res.hiring;
    },
  });
}

export function useCreateApplicant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateApplicantBody) => {
      const form = new FormData();
      form.append("name", body.name);
      form.append("email", body.email);
      form.append("phone", body.phone);
      form.append("resume", body.resume);
      if (body.currentSalary != null) form.append("currentSalary", String(body.currentSalary));
      if (body.expectedSalary != null) form.append("expectedSalary", String(body.expectedSalary));
      if (body.noticePeriod) form.append("noticePeriod", body.noticePeriod);
      if (body.skills) form.append("skills", body.skills);
      if (body.experience) form.append("experience", body.experience);
      if (body.linkedInProfile) form.append("linkedInProfile", body.linkedInProfile);
      if (body.gitHubLink) form.append("gitHubLink", body.gitHubLink);
      if (body.portfolioLink) form.append("portfolioLink", body.portfolioLink);
      if (body.note) form.append("note", body.note);
      return api.upload<{ success: boolean; hiring: Applicant }>(
        "POST",
        apiPath.hiring.createHiring,
        form,
        { auth: true }
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: hiringQueryKey }),
  });
}

export function useUpdateApplicantStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: HiringStage }) =>
      api.patch<{ success: boolean; hiring: Applicant }>(
        apiPath.hiring.updateStage.replace(":id", id),
        { stage },
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: hiringQueryKey });
      qc.invalidateQueries({ queryKey: interviewsQueryKey });
    },
  });
}

export function useConvertToUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
      api.post<{ success: boolean; user: { _id: string; name: string; email: string } }>(
        apiPath.hiring.convert.replace(":id", id),
        {},
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: hiringQueryKey }),
  });
}

// ─── Interviews ───────────────────────────────────────────────────────────────

export function useInterviews(applicantId?: string) {
  return useQuery({
    queryKey: [...interviewsQueryKey, applicantId],
    queryFn: async (): Promise<Interview[]> => {
      const query: Record<string, string> = {};
      if (applicantId) query.applicantId = applicantId;
      const res = await api.get<{ success: boolean; interviews: Interview[] }>(
        apiPath.interviews.list,
        { auth: true, query }
      );
      return res.interviews ?? [];
    },
  });
}

export function useScheduleInterview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: ScheduleInterviewBody) =>
      api.post<{ success: boolean; interview: Interview }>(
        apiPath.interviews.list,
        body,
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interviewsQueryKey });
      qc.invalidateQueries({ queryKey: hiringQueryKey });
    },
  });
}

export function useSubmitFeedback() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: SubmitFeedbackBody }) =>
      api.post<{ success: boolean; interview: Interview }>(
        apiPath.interviews.feedback.replace(":id", id),
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: interviewsQueryKey }),
  });
}

export function useSetInterviewResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, result }: { id: string; result: string }) =>
      api.patch<{ success: boolean; interview: Interview }>(
        apiPath.interviews.result.replace(":id", id),
        { result },
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: interviewsQueryKey });
      qc.invalidateQueries({ queryKey: hiringQueryKey });
    },
  });
}
