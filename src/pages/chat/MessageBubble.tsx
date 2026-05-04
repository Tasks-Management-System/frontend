import { useRef, useState } from "react";
import { Check, CheckCheck, Copy, CornerUpLeft, Pencil, Smile, Trash2 } from "lucide-react";
import type { ChatAttachment, ChatMessage } from "../../types/chat.types";
import { AttachmentPreview } from "./AttachmentPreview";
import { ReplyCard } from "./ReplyCard";
import { aggregateReactions, formatMessageTime, parseMessage } from "./chatUtils";

type MessageBubbleProps = {
  msg: ChatMessage;
  isMine: boolean;
  hasWallpaper?: boolean;
  currentUserId: string;
  onCopy: () => void;
  onReply: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPickReaction: (anchor: HTMLElement | null) => void;
  onToggleReactionEmoji: (emoji: string) => void;
  onPreview: (att: ChatAttachment) => void;
  onScrollToReply: (replyId: string) => void;
};

export function MessageBubble({
  msg,
  isMine,
  hasWallpaper,
  currentUserId,
  onCopy,
  onReply,
  onDelete,
  onEdit,
  onPickReaction,
  onToggleReactionEmoji,
  onPreview,
  onScrollToReply,
}: MessageBubbleProps) {
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const reactionBtnRef = useRef<HTMLButtonElement>(null);
  const { quote: legacyQuote, body } = msg.replyTo
    ? { quote: null, body: msg.message }
    : parseMessage(msg.message);

  const grouped = aggregateReactions(msg.reactions, currentUserId);

  return (
    <div className={`group mb-1 flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
      <div
        className={`flex max-w-[75%] items-end gap-1.5 sm:max-w-[65%] ${isMine ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isMine
              ? "rounded-br-md bg-violet-600 text-white shadow-md"
              : hasWallpaper
                ? "rounded-bl-md bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm"
                : "rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm"
          }`}
        >
          {msg.replyTo && (
            <ReplyCard
              replyTo={msg.replyTo}
              isMine={isMine}
              onClick={() => onScrollToReply(msg.replyTo!._id)}
            />
          )}

          {!msg.replyTo && legacyQuote && (
            <div
              className={`mb-2 rounded-xl border-l-[3px] px-3 py-2 ${
                isMine ? "border-white/50 bg-white/15" : "border-violet-400 bg-violet-50/70"
              }`}
            >
              <p
                className={`mb-0.5 text-[11px] font-semibold ${isMine ? "text-violet-200" : "text-violet-600"}`}
              >
                {legacyQuote.name}
              </p>
              <p
                className={`line-clamp-2 text-[11px] leading-relaxed ${isMine ? "text-white/70" : "text-gray-500"}`}
              >
                {legacyQuote.text}
              </p>
            </div>
          )}

          {msg.attachments && msg.attachments.length > 0 && (
            <div className="mb-2 flex flex-col gap-2">
              {msg.attachments.map((att, idx) => (
                <AttachmentPreview key={idx} att={att} isMine={isMine} onPreview={onPreview} />
              ))}
            </div>
          )}

          {body && (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{body}</p>
          )}
          <div
            className={`mt-1 flex items-center justify-end gap-1.5 ${
              isMine ? "text-violet-200" : "text-gray-400"
            }`}
          >
            {msg.isEdited && <span className="text-[10px] italic opacity-70">edited</span>}
            <span className="text-[10px]">{formatMessageTime(msg.createdAt)}</span>
            {isMine &&
              (msg.isRead ? (
                <CheckCheck className="h-3.5 w-3.5" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              ))}
          </div>
        </div>

        <div className="pointer-events-none mb-0.5 flex shrink-0 items-center self-end rounded-xl border border-gray-100 bg-white p-0.5 opacity-0 shadow-lg transition-all duration-150 group-hover:pointer-events-auto group-hover:opacity-100">
          <button
            type="button"
            title="Copy"
            onClick={onCopy}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            title="Reply"
            onClick={onReply}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-violet-50 hover:text-violet-600"
          >
            <CornerUpLeft className="h-3.5 w-3.5" />
          </button>
          {isMine && (
            <button
              type="button"
              title="Edit"
              onClick={onEdit}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-amber-50 hover:text-amber-500"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {isMine && (
            <button
              type="button"
              title="Delete"
              onClick={onDelete}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            ref={reactionBtnRef}
            type="button"
            title="Add reaction"
            onClick={() => onPickReaction(reactionBtnRef.current)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {grouped.length > 0 && (
        <div
          className={`flex max-w-[85%] flex-wrap gap-1 ${isMine ? "justify-end" : "justify-start"}`}
        >
          {grouped.map(({ emoji, count, users, iReacted }) => (
            <button
              key={emoji}
              type="button"
              title={users.map((u) => u.name).join(", ")}
              onMouseEnter={() => setHoveredEmoji(emoji)}
              onMouseLeave={() => setHoveredEmoji(null)}
              onClick={(e) => {
                e.stopPropagation();
                onToggleReactionEmoji(emoji);
              }}
              className={`inline-flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-xs transition ${
                iReacted
                  ? isMine
                    ? "border-violet-400 bg-violet-100/90 text-violet-900"
                    : "border-violet-300 bg-violet-50 text-violet-900"
                  : "border-gray-200/90 bg-white/90 text-gray-700 shadow-sm backdrop-blur-sm hover:bg-gray-50"
              }`}
            >
              <span className="leading-none">{emoji}</span>
              {count > 1 && <span className="text-[10px] font-semibold tabular-nums">{count}</span>}
            </button>
          ))}
          {hoveredEmoji && (
  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50 w-max rounded-lg border bg-white shadow-lg p-2 text-xs">
    
    <div className="font-semibold mb-1">{hoveredEmoji}</div>

    <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                {grouped.find((g) => g.emoji === hoveredEmoji)?.users.map((u: { _id: string; name: string }) => (
                  <span key={u._id}>{u._id === currentUserId ? "You" : u.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
