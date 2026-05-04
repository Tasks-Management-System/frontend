import type { ChatAttachment } from "../../types/chat.types";

export type PendingChatFile = {
  id: string;
  file: File;
  previewUrl?: string;
  status: "uploading" | "done" | "error";
  result?: ChatAttachment;
};
