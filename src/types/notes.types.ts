import type { StickyColorId } from "../utils/stickyNoteTheme";

export interface StickyNote {
  _id: string;
  user: string;
  title: string;
  content: string;
  color?: StickyColorId;
  positionX?: number;
  positionY?: number;
  isArchived?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type PatchNoteBody = {
  title?: string;
  content?: string;
  color?: StickyColorId;
  positionX?: number;
  positionY?: number;
};

export interface NotesListResponse {
  success: boolean;
  message: string;
  notes: StickyNote[];
}

export interface CreateNoteResponse {
  success: boolean;
  message: string;
  note: StickyNote;
}

export interface UpdateNoteResponse {
  success: boolean;
  message: string;
  note: StickyNote;
}
