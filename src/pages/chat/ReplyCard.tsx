import type { ReplyToMessage } from "../../types/chat.types";
import { getFileIcon, isImageMime, isVideoMime } from "./chatUtils";

type ReplyCardProps = {
  replyTo: ReplyToMessage;
  isMine: boolean;
  onClick: () => void;
};

export function ReplyCard({ replyTo, isMine, onClick }: ReplyCardProps) {
  const firstAtt = replyTo.attachments?.[0];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-2 w-full rounded-xl border-l-[3px] px-3 py-2 text-left transition-opacity hover:opacity-75 ${
        isMine ? "border-white/50 bg-white/15" : "border-violet-400 bg-violet-50/70"
      }`}
    >
      <p
        className={`mb-1 text-[11px] font-semibold ${isMine ? "text-violet-200" : "text-violet-600"}`}
      >
        {replyTo.sender.name}
      </p>

      {firstAtt && (
        <div className="mb-1 flex items-center gap-2">
          {isImageMime(firstAtt.mimeType) ? (
            <img
              src={firstAtt.url}
              alt={firstAtt.name}
              className="h-10 w-10 rounded-lg object-cover"
            />
          ) : isVideoMime(firstAtt.mimeType) ? (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm ${isMine ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
            >
              ▶
            </div>
          ) : (
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${isMine ? "bg-white/20" : "bg-gray-200"}`}
            >
              {getFileIcon(firstAtt.mimeType)}
            </div>
          )}
          <span
            className={`truncate text-[11px] max-w-[140px] ${isMine ? "text-white/70" : "text-gray-500"}`}
          >
            {isVideoMime(firstAtt.mimeType)
              ? "Video"
              : isImageMime(firstAtt.mimeType)
                ? "Photo"
                : firstAtt.name}
          </span>
        </div>
      )}

      {(replyTo.message || !firstAtt) && (
        <p
          className={`line-clamp-2 text-[11px] leading-relaxed ${isMine ? "text-white/70" : "text-gray-500"}`}
        >
          {replyTo.message || "📎 Attachment"}
        </p>
      )}
    </button>
  );
}
