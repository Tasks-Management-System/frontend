import { useEffect } from "react";
import { Download, X } from "lucide-react";
import type { ChatAttachment } from "../../types/chat.types";
import {
  formatFileSize,
  getFileIcon,
  isImageMime,
  isOfficeMime,
  isPdfMime,
  isVideoMime,
} from "./chatUtils";

type FilePreviewModalProps = {
  att: ChatAttachment;
  onClose: () => void;
};

export function FilePreviewModal({ att, onClose }: FilePreviewModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const renderContent = () => {
    if (isImageMime(att.mimeType)) {
      return (
        <img
          src={att.url}
          alt={att.name}
          className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
        />
      );
    }
    if (isVideoMime(att.mimeType)) {
      return (
        <video
          src={att.url}
          controls
          autoPlay
          className="max-h-full max-w-full rounded-xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    if (isPdfMime(att.mimeType)) {
      return <iframe src={att.url} title={att.name} className="h-full w-full rounded-xl" />;
    }
    if (isOfficeMime(att.mimeType)) {
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(att.url)}&embedded=true`;
      return <iframe src={viewerUrl} title={att.name} className="h-full w-full rounded-xl" />;
    }
    return (
      <div className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-white p-10 shadow-2xl">
        <div className="text-6xl">{getFileIcon(att.mimeType)}</div>
        <div className="text-center">
          <p className="text-base font-semibold text-gray-800">{att.name}</p>
          <p className="mt-1 text-sm text-gray-400">{formatFileSize(att.size)}</p>
        </div>
        <a
          href={att.url}
          download={att.name}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex shrink-0 items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{att.name}</p>
          <p className="text-[11px] text-white/50">{formatFileSize(att.size)}</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={att.url}
            download={att.name}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center p-4" onClick={onClose}>
        <div
          className={`${
            isImageMime(att.mimeType)
              ? "flex max-h-full max-w-full items-center justify-center"
              : "h-full w-full max-w-4xl"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
