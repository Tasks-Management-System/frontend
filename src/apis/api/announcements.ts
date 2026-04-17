import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type { Announcement, AnnouncementsListResponse } from "../../types/announcement.types";

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: () =>
      api.get<AnnouncementsListResponse>(apiPath.announcements.list, { auth: true }),
    select: (data) => data.announcements,
  });
}

export type CreateAnnouncementInput = {
  title: string;
  content: string;
  isPinned?: boolean;
};

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateAnnouncementInput) =>
      api.post<{ success: boolean; announcement: Announcement }>(
        apiPath.announcements.create,
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<CreateAnnouncementInput> }) =>
      api.put<{ success: boolean; announcement: Announcement }>(
        `${apiPath.announcements.byId}${id}`,
        body,
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useMarkAnnouncementRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.patch(`${apiPath.announcements.byId}${id}/read`, {}, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function usePinAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      api.patch(
        `${apiPath.announcements.byId}${id}/pin`,
        { isPinned },
        { auth: true }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.del(`${apiPath.announcements.byId}${id}`, { auth: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["announcements"] }),
  });
}
