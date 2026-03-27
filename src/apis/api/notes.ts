import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  CreateNoteResponse,
  NotesListResponse,
  PatchNoteBody,
  UpdateNoteResponse,
} from "../../types/notes.types";

export const notesQueryKey = ["notes"] as const;

export function useMyNotes(archived = false) {
  return useQuery({
    queryKey: [...notesQueryKey, { archived }],
    queryFn: () =>
      api.get<NotesListResponse>(apiPath.notes.list, {
        auth: true,
        query: archived ? { archived: "true" } : {},
      }),
  });
}

export type CreateNotePayload = {
  title: string;
  content: string;
  color?: string;
  positionX?: number;
  positionY?: number;
};

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["createNote"],
    mutationFn: (body: CreateNotePayload) =>
      api.post<CreateNoteResponse>(apiPath.notes.create, body, { auth: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}

export function usePatchNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["patchNote"],
    mutationFn: ({ id, body }: { id: string; body: PatchNoteBody }) =>
      api.patch<UpdateNoteResponse>(`${apiPath.notes.byId}${id}`, body, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notesQueryKey });
    },
  });
}
