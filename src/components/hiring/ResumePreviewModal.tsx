import { X, ExternalLink } from "lucide-react";

interface Props {
  url: string;
  name: string;
  onClose: () => void;
}

export default function ResumePreviewModal({ url, name, onClose }: Props) {
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 shadow">
        <p className="truncate text-sm font-medium text-slate-800">{name} — Resume</p>
        <div className="flex items-center gap-2">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open in new tab
          </a>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <iframe
        src={viewerUrl}
        className="flex-1 w-full border-0 bg-slate-100"
        title="Resume preview"
      />
    </div>
  );
}
