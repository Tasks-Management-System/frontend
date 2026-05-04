import { Download, FileText } from "lucide-react";
import type { ChatAttachment } from "../../types/chat.types";
import { formatFileSize, getFileIcon, isImageMime, isVideoMime } from "./chatUtils";

type AttachmentPreviewProps = {
  att: ChatAttachment;
  isMine: boolean;
  onPreview: (att: ChatAttachment) => void;
};

export function AttachmentPreview({ att, isMine, onPreview }: AttachmentPreviewProps) {
  if (isImageMime(att.mimeType)) {
    return (
      <button type="button" onClick={() => onPreview(att)} className="block w-full">
        <img
          src={att.url}
          alt={att.name}
          className="max-h-56 w-full rounded-xl object-cover transition hover:opacity-90"
          loading="lazy"
        />
      </button>
    );
  }

  if (isVideoMime(att.mimeType)) {
    return (
      <div className="relative overflow-hidden rounded-xl">
        <video
          src={att.url}
          controls
          preload="metadata"
          className="max-h-56 w-full rounded-xl bg-black"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onPreview(att)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
        isMine ? "bg-white/15 hover:bg-white/25" : "bg-gray-100 hover:bg-gray-200"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xl ${
          isMine ? "bg-white/20" : "bg-violet-100"
        }`}
      >
        {isImageMime(att.mimeType) ? (
          <FileText className={`h-4 w-4 ${isMine ? "text-white" : "text-violet-600"}`} />
        ) : (
          <span>{getFileIcon(att.mimeType)}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className={`truncate text-xs font-medium ${isMine ? "text-white" : "text-gray-800"}`}>
          {att.name}
        </p>
        <p className={`text-[10px] ${isMine ? "text-white/60" : "text-gray-400"}`}>
          {formatFileSize(att.size)}
        </p>
      </div>
      <Download className={`h-4 w-4 shrink-0 ${isMine ? "text-white/70" : "text-gray-400"}`} />
    </button>
  );
}
