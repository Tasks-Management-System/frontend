import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search,
  Send,
  MessageSquare,
  Circle,
  ArrowLeft,
  Check,
  CheckCheck,
  Smile,
  MoreVertical,
  Palette,
  Copy,
  CornerUpLeft,
  Trash2,
  Pencil,
  Eraser,
  Paperclip,
  FileText,
  Download,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useChatMessages,
  useChatUsers,
  useOnlineUsers,
  deleteMessageApi,
  editMessageApi,
  clearChatApi,
  uploadChatFileApi,
} from "../../apis/api/chat";
import { getUserId } from "../../utils/session";
import { socket } from "../../utils/socket";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatAttachment, ChatMessage, ReplyToMessage } from "../../types/chat.types";
import type { User } from "../../types/user.types";
import EmojiPicker from "../../components/chat/EmojiPicker";
import WallpaperPicker from "../../components/chat/WallpaperPicker";
import { useChatNotifications } from "../../contexts/ChatNotificationContext";
import { useChatWallpaper, getWallpaperStyle } from "../../hooks/useChatWallpaper";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";

/* ------------------------------------------------------------------ */
/*  Avatar                                                             */
/* ------------------------------------------------------------------ */

function Avatar({
  name,
  image,
  online,
  size = "md",
}: {
  name: string;
  image: string | null;
  online?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const url = resolveProfileImageUrl(image);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const dim = size === "lg" ? "h-12 w-12" : size === "md" ? "h-10 w-10" : "h-8 w-8";
  const textSize = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="relative shrink-0">
      <div
        className={`${dim} flex items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-semibold ${textSize} overflow-hidden ring-2 ring-white shadow-sm`}
      >
        {url ? (
          <img src={url} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className="select-none">{initials}</span>
        )}
      </div>
      {online !== undefined && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${
            online ? "bg-emerald-500" : "bg-gray-300"
          }`}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Time formatting                                                    */
/* ------------------------------------------------------------------ */

function formatMessageTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateSeparator(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function shouldShowDateSeparator(current: ChatMessage, prev: ChatMessage | undefined) {
  if (!prev) return true;
  return new Date(current.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
}

/* ------------------------------------------------------------------ */
/*  Contact List                                                       */
/* ------------------------------------------------------------------ */

function ContactList({
  users,
  onlineUserIds,
  selectedId,
  onSelect,
  currentUserId,
  lastMessages,
  unreadCounts,
}: {
  users: User[];
  onlineUserIds: Set<string>;
  selectedId: string;
  onSelect: (id: string) => void;
  currentUserId: string;
  lastMessages: Map<string, ChatMessage>;
  unreadCounts: Map<string, number>;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const others = users.filter((u) => u._id !== currentUserId && u.isActive);
    if (!search.trim()) return others;
    const q = search.toLowerCase();
    return others.filter(
      (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }, [users, currentUserId, search]);

  // Sort: online first, then by last message time
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aOnline = onlineUserIds.has(a._id) ? 1 : 0;
      const bOnline = onlineUserIds.has(b._id) ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      const aMsg = lastMessages.get(a._id);
      const bMsg = lastMessages.get(b._id);
      if (aMsg && bMsg)
        return new Date(bMsg.createdAt).getTime() - new Date(aMsg.createdAt).getTime();
      if (aMsg) return -1;
      if (bMsg) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filtered, onlineUserIds, lastMessages]);

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="p-3 sm:p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Search className="mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">No users found</p>
          </div>
        ) : (
          sorted.map((user) => {
            const isOnline = onlineUserIds.has(user._id);
            const isSelected = selectedId === user._id;
            const lastMsg = lastMessages.get(user._id);
            const unread = unreadCounts.get(user._id) ?? 0;

            return (
              <button
                key={user._id}
                type="button"
                onClick={() => onSelect(user._id)}
                className={`flex w-full items-center gap-3 px-3 py-3 sm:px-4 text-left transition-all duration-150 ${
                  isSelected
                    ? "bg-violet-50 border-l-[3px] border-violet-600"
                    : "border-l-[3px] border-transparent hover:bg-gray-50"
                }`}
              >
                <Avatar name={user.name} image={user.profileImage} online={isOnline} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm ${
                        unread > 0 ? "font-bold text-gray-900" : "font-medium text-gray-800"
                      }`}
                    >
                      {user.name}
                    </p>
                    {lastMsg && (
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {formatMessageTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-gray-500">
                      {lastMsg
                        ? lastMsg.sender._id === currentUserId
                          ? `You: ${lastMsg.message}`
                          : lastMsg.message
                        : isOnline
                          ? "Online"
                          : (user.role?.[0] ?? "Offline")}
                    </p>
                    {unread > 0 && !isSelected && (
                      <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message Bubble                                                     */
/* ------------------------------------------------------------------ */

/** Parse a reply-prefixed message into its quoted part and body.
 *  Format written by handleSend: "> Name: original\n\nactual reply"
 *  Returns { quote: { name, text } | null, body: string } */
function parseMessage(raw: string): { quote: { name: string; text: string } | null; body: string } {
  if (!raw.startsWith("> ")) return { quote: null, body: raw };
  const newlineIdx = raw.indexOf("\n\n");
  if (newlineIdx === -1) return { quote: null, body: raw };

  const quoteLine = raw.slice(2, newlineIdx); // strip leading "> "
  const colonIdx = quoteLine.indexOf(": ");
  if (colonIdx === -1) return { quote: null, body: raw };

  return {
    quote: { name: quoteLine.slice(0, colonIdx), text: quoteLine.slice(colonIdx + 2) },
    body: raw.slice(newlineIdx + 2),
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

function isVideoMime(mimeType: string) {
  return mimeType.startsWith("video/");
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("audio/")) return "🎵";
  if (mimeType === "application/pdf") return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📑";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("compressed"))
    return "🗜️";
  return "📎";
}

function isPdfMime(mimeType: string) {
  return mimeType === "application/pdf";
}

function isOfficeMime(mimeType: string) {
  return (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("sheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("presentation") ||
    mimeType.includes("powerpoint") ||
    mimeType.includes("officedocument")
  );
}

/* ------------------------------------------------------------------ */
/*  File Preview Modal                                                 */
/* ------------------------------------------------------------------ */

function FilePreviewModal({ att, onClose }: { att: ChatAttachment; onClose: () => void }) {
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
    // Fallback — not previewable, show download card
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
      {/* Top bar */}
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

      {/* Content */}
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

function AttachmentPreview({
  att,
  isMine,
  onPreview,
}: {
  att: ChatAttachment;
  isMine: boolean;
  onPreview: (att: ChatAttachment) => void;
}) {
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

/* ------------------------------------------------------------------ */
/*  Reply Card                                                         */
/* ------------------------------------------------------------------ */

function ReplyCard({
  replyTo,
  isMine,
  onClick,
}: {
  replyTo: ReplyToMessage;
  isMine: boolean;
  onClick: () => void;
}) {
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

function MessageBubble({
  msg,
  isMine,
  hasWallpaper,
  onCopy,
  onReply,
  onDelete,
  onEdit,
  onPreview,
  onScrollToReply,
}: {
  msg: ChatMessage;
  isMine: boolean;
  hasWallpaper?: boolean;
  onCopy: () => void;
  onReply: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onPreview: (att: ChatAttachment) => void;
  onScrollToReply: (replyId: string) => void;
}) {
  // New messages use the replyTo FK; old messages use the "> Name: text" prefix
  const { quote: legacyQuote, body } = msg.replyTo
    ? { quote: null, body: msg.message }
    : parseMessage(msg.message);

  return (
    <div className={`group mb-1 flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`flex items-end gap-1.5 ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Bubble */}
        <div
          className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 sm:max-w-[65%] ${
            isMine
              ? "rounded-br-md bg-violet-600 text-white shadow-md"
              : hasWallpaper
                ? "rounded-bl-md bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm"
                : "rounded-bl-md border border-gray-100 bg-white text-gray-800 shadow-sm"
          }`}
        >
          {/* Structured reply card — clickable, scrolls to original */}
          {msg.replyTo && (
            <ReplyCard
              replyTo={msg.replyTo}
              isMine={isMine}
              onClick={() => onScrollToReply(msg.replyTo!._id)}
            />
          )}

          {/* Legacy backward-compat: old "> Name: text\n\n" encoded messages */}
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

          {/* Attachments */}
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

        {/* Action bar — fades in on row hover */}
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
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator                                                   */
/* ------------------------------------------------------------------ */

function TypingIndicator({ name, hasWallpaper }: { name: string; hasWallpaper?: boolean }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div
        className={`flex items-center gap-1 rounded-2xl px-4 py-3 shadow-sm ${
          hasWallpaper
            ? "bg-white/90 backdrop-blur-sm shadow-lg"
            : "border border-gray-100 bg-white"
        }`}
      >
        <div className="flex gap-1">
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
        </div>
      </div>
      <span className="text-xs text-gray-400">{name} is typing...</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Empty State                                                        */
/* ------------------------------------------------------------------ */

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50">
        <MessageSquare className="h-10 w-10 text-violet-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-800">Start a conversation</h3>
      <p className="mt-1 max-w-xs text-sm text-gray-500">
        Select a contact from the list to begin chatting with your team members.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Chat Page                                                     */
/* ------------------------------------------------------------------ */

const Chat = () => {
  const currentUserId = getUserId();
  const queryClient = useQueryClient();
  const { activeMode } = useActiveOrg();

  const { data: allUsers = [] } = useChatUsers(activeMode);
  const { data: onlineIds = [] } = useOnlineUsers();
  const onlineUserIds = useMemo(() => new Set(onlineIds), [onlineIds]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [lastMessages, setLastMessages] = useState<Map<string, ChatMessage>>(new Map());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Use global unread counts (persisted, visible in sidebar)
  const {
    unreadCounts: globalUnreadCounts,
    clearUnread,
    setActiveChatUser,
  } = useChatNotifications();
  // Convert to Map for the ContactList component
  const unreadCounts = useMemo(
    () => new Map(Object.entries(globalUnreadCounts).map(([k, v]) => [k, v])),
    [globalUnreadCounts]
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; text: string } | null>(null);
  const [clearChatConfirm, setClearChatConfirm] = useState(false);
  const [previewFile, setPreviewFile] = useState<ChatAttachment | null>(null);

  type PendingFile = {
    id: string;
    file: File;
    previewUrl?: string;
    status: "uploading" | "done" | "error";
    result?: ChatAttachment;
  };
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  // Per-conversation wallpaper — keyed by the other user's ID
  const { wallpaper, setWallpaper } = useChatWallpaper(selectedUserId);
  const [wallpaperSidebarOpen, setWallpaperSidebarOpen] = useState(false);

  // 3-dot menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const { data: chatData } = useChatMessages(selectedUserId);

  const selectedUser = useMemo(
    () => allUsers.find((u) => u._id === selectedUserId),
    [allUsers, selectedUserId]
  );

  // Load messages from REST when conversation changes or cached data is already available
  useEffect(() => {
    if (chatData?.data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMessages(chatData.data);
    }
  }, [chatData, selectedUserId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  // Socket event listeners
  useEffect(() => {
    function handleReceive(msg: ChatMessage) {
      const otherUserId = msg.sender._id === currentUserId ? msg.receiver._id : msg.sender._id;

      // Update last message for contact list
      setLastMessages((prev) => {
        const next = new Map(prev);
        next.set(otherUserId, msg);
        return next;
      });

      // If this message belongs to the active conversation, add it
      if (
        (msg.sender._id === selectedUserId && msg.receiver._id === currentUserId) ||
        (msg.sender._id === currentUserId && msg.receiver._id === selectedUserId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });

        // Mark as read if from the other user
        if (msg.sender._id === selectedUserId) {
          socket.emit("message:read", { senderId: selectedUserId });
          clearUnread(selectedUserId);
        }
      }
    }

    function handleTypingStart({ userId }: { userId: string }) {
      setTypingUsers((prev) => new Set(prev).add(userId));
    }

    function handleTypingStop({ userId }: { userId: string }) {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }

    function handleMessageRead({ readBy }: { readBy: string }) {
      if (readBy === selectedUserId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender._id === currentUserId && !m.isRead ? { ...m, isRead: true } : m
          )
        );
      }
    }

    function handleMessageDelete({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    }

    function handleMessageEdit({ messageId, message }: { messageId: string; message: string }) {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, message, isEdited: true } : m))
      );
    }

    function handleOnline() {
      queryClient.invalidateQueries({ queryKey: ["onlineUsers"] });
    }

    function handleOffline() {
      queryClient.invalidateQueries({ queryKey: ["onlineUsers"] });
    }

    socket.on("message:receive", handleReceive);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:read", handleMessageRead);
    socket.on("message:delete", handleMessageDelete);
    socket.on("message:edit", handleMessageEdit);
    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOffline);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:read", handleMessageRead);
      socket.off("message:delete", handleMessageDelete);
      socket.off("message:edit", handleMessageEdit);
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOffline);
    };
  }, [selectedUserId, currentUserId, queryClient, clearUnread]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!emojiOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setEmojiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [emojiOpen]);

  // Close 3-dot menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        menuButtonRef.current &&
        !menuButtonRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Mark messages as read when selecting a conversation + tell global context
  // which chat is open so new messages from that sender don't increment the badge
  useEffect(() => {
    setActiveChatUser(selectedUserId);
    if (selectedUserId) {
      socket.emit("message:read", { senderId: selectedUserId });
      clearUnread(selectedUserId);
    }
    return () => {
      // Clear active chat when leaving the chat page or closing conversation
      setActiveChatUser("");
    };
  }, [selectedUserId, clearUnread, setActiveChatUser]);

  const handleSelectUser = useCallback(
    (id: string) => {
      if (id === selectedUserId) return;
      setSelectedUserId(id);
      setMessages([]);
      setMessageInput("");
      setReplyTo(null);
      setEditTarget(null);
      setPendingFiles([]);
    },
    [selectedUserId]
  );

  const handleSend = useCallback(async () => {
    const text = messageInput.trim();
    const hasFiles = pendingFiles.length > 0;
    if (!text && !hasFiles) return;
    if (!selectedUserId) return;
    if (pendingFiles.some((f) => f.status === "uploading")) {
      toast.error("Please wait for files to finish uploading");
      return;
    }

    // Edit mode — update existing message
    if (editTarget) {
      const { id } = editTarget;
      setEditTarget(null);
      setMessageInput("");
      try {
        const res = await editMessageApi(id, text);
        if (res.success && res.data) {
          setMessages((prev) => prev.map((m) => (m._id === id ? res.data! : m)));
          socket.emit("message:edit", { messageId: id, message: text, receiverId: selectedUserId });
        }
      } catch {
        toast.error("Failed to edit message");
      }
      inputRef.current?.focus();
      return;
    }

    const finalText = text;
    const readyAttachments = pendingFiles
      .filter((f) => f.status === "done" && f.result)
      .map((f) => f.result!);
    setPendingFiles([]);

    socket.emit(
      "message:send",
      {
        receiverId: selectedUserId,
        message: finalText,
        attachments: readyAttachments,
        replyToId: replyTo?._id ?? null,
      },
      (response: { success: boolean; data?: ChatMessage; error?: string }) => {
        if (response.success && response.data) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === response.data!._id)) return prev;
            return [...prev, response.data!];
          });
          setLastMessages((prev) => {
            const next = new Map(prev);
            next.set(selectedUserId, response.data!);
            return next;
          });
        } else if (!response.success) {
          console.error("Send failed:", response.error);
        }
      }
    );

    setReplyTo(null);
    setMessageInput("");
    socket.emit("typing:stop", { receiverId: selectedUserId });
    inputRef.current?.focus();
  }, [
    messageInput,
    selectedUserId,
    replyTo,
    currentUserId,
    selectedUser,
    editTarget,
    pendingFiles,
  ]);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    toast.success("Copied to clipboard");
  }, []);

  const handleReply = useCallback((msg: ChatMessage) => {
    setReplyTo(msg);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleDeleteMsg = useCallback((msgId: string) => {
    setDeleteTarget(msgId);
  }, []);

  const handleEditMsg = useCallback((msg: ChatMessage) => {
    // Strip the reply quote prefix so the user only edits the body
    const { body } = parseMessage(msg.message);
    setEditTarget({ id: msg._id, text: body });
    setReplyTo(null);
    setMessageInput(body);
    requestAnimationFrame(() => {
      const ta = inputRef.current;
      if (!ta) return;
      ta.focus();
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 128)}px`;
      ta.setSelectionRange(body.length, body.length);
    });
  }, []);

  const handleConfirmDelete = useCallback(
    async (deleteFor: "me" | "everyone") => {
      if (!deleteTarget) return;
      const id = deleteTarget;
      setDeleteTarget(null);
      try {
        await deleteMessageApi(id, deleteFor);
        setMessages((prev) => prev.filter((m) => m._id !== id));
        if (deleteFor === "everyone") {
          socket.emit("message:delete", { messageId: id, receiverId: selectedUserId });
        }
      } catch {
        toast.error("Failed to delete message");
      }
    },
    [deleteTarget, selectedUserId]
  );

  const handleScrollToReply = useCallback((replyId: string) => {
    const el = messageContainerRef.current?.querySelector(
      `[data-msg-id="${replyId}"]`
    ) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMsgId(replyId);
      setTimeout(() => setHighlightedMsgId(null), 1500);
    } else {
      toast("Message not visible — scroll up to find it", { icon: "↑" });
    }
  }, []);

  const handleClearChat = useCallback(async () => {
    setClearChatConfirm(false);
    try {
      await clearChatApi(selectedUserId);
      setMessages([]);
    } catch {
      toast.error("Failed to clear chat");
    }
  }, [selectedUserId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const newPending: PendingFile[] = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
      status: "uploading" as const,
    }));

    setPendingFiles((prev) => [...prev, ...newPending]);

    for (const pending of newPending) {
      try {
        const res = await uploadChatFileApi(pending.file);
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pending.id ? { ...f, status: "done", result: res.data } : f))
        );
      } catch {
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === pending.id ? { ...f, status: "error" } : f))
        );
        toast.error(`Failed to upload ${pending.file.name}`);
      }
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    if (selectedUserId) {
      socket.emit("typing:start", { receiverId: selectedUserId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { receiverId: selectedUserId });
      }, 1500);
    }
  };

  // Insert emoji at the current cursor position in the textarea
  const handleEmojiSelect = useCallback(
    (emoji: string) => {
      const textarea = inputRef.current;
      if (!textarea) {
        setMessageInput((prev) => prev + emoji);
        return;
      }
      const start = textarea.selectionStart ?? messageInput.length;
      const end = textarea.selectionEnd ?? messageInput.length;
      const newValue = messageInput.slice(0, start) + emoji + messageInput.slice(end);
      setMessageInput(newValue);
      // Restore focus and move cursor after the inserted emoji
      requestAnimationFrame(() => {
        textarea.focus();
        const newPos = start + emoji.length;
        textarea.setSelectionRange(newPos, newPos);
        textarea.style.height = "auto";
        textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
      });
    },
    [messageInput]
  );

  const isSelectedOnline = selectedUserId ? onlineUserIds.has(selectedUserId) : false;

  const showTyping = selectedUserId && typingUsers.has(selectedUserId);

  // Mobile: show contact list or chat
  const [mobileShowChat, setMobileShowChat] = useState(false);

  const handleMobileSelect = (id: string) => {
    handleSelectUser(id);
    setMobileShowChat(true);
  };

  const handleMobileBack = () => {
    setMobileShowChat(false);
    setSelectedUserId("");
  };

  return (
    <div className="flex h-[calc(95vh-5rem)] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      {/* ---- Contacts Panel ---- */}
      <div
        className={`${
          mobileShowChat ? "hidden" : "flex"
        } w-full flex-col border-r border-gray-200/60 md:flex md:w-80 lg:w-96`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-gray-200/60 px-4 py-4 sm:px-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>

        <ContactList
          users={allUsers}
          onlineUserIds={onlineUserIds}
          selectedId={selectedUserId}
          onSelect={handleMobileSelect}
          currentUserId={currentUserId}
          lastMessages={lastMessages}
          unreadCounts={unreadCounts}
        />
      </div>

      {/* ---- Chat Area ---- */}
      <div
        className={`${!mobileShowChat ? "hidden" : "flex"} relative min-w-0 flex-1 flex-col overflow-hidden md:flex`}
      >
        {!selectedUserId ? (
          <EmptyState />
        ) : (
          <>
            {/* Chat Header */}
            <div className="relative z-10 flex items-center gap-3 border-b border-gray-200/70 bg-white px-4 py-3 shadow-sm sm:px-6">
              <button
                type="button"
                onClick={handleMobileBack}
                className="mr-1 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar
                name={selectedUser?.name ?? ""}
                image={selectedUser?.profileImage ?? null}
                online={isSelectedOnline}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-gray-900">
                  {selectedUser?.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <Circle
                    className={`h-2 w-2 ${
                      isSelectedOnline
                        ? "fill-emerald-500 text-emerald-500"
                        : "fill-gray-300 text-gray-300"
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {showTyping ? "Typing..." : isSelectedOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              {/* 3-dot menu */}
              <div className="relative shrink-0">
                <button
                  ref={menuButtonRef}
                  type="button"
                  title="More options"
                  onClick={() => setMenuOpen((o) => !o)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    menuOpen
                      ? "bg-gray-100 text-gray-700"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  }`}
                >
                  <MoreVertical className="h-4.5 w-4.5" />
                </button>

                {menuOpen && (
                  <div
                    ref={menuRef}
                    className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl ring-1 ring-black/5"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setWallpaperSidebarOpen(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      <Palette className="h-4 w-4 text-gray-400" />
                      <span>Wallpaper</span>
                    </button>
                    <div className="my-1 h-px bg-gray-100" />
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setClearChatConfirm(true);
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 transition hover:bg-red-50"
                    >
                      <Eraser className="h-4 w-4" />
                      <span>Clear Chat</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messageContainerRef}
              className={`flex-1 overflow-y-auto px-3 py-4 sm:px-6 ${wallpaper === "none" ? "bg-gradient-to-b from-gray-50/50 to-white" : ""}`}
              style={wallpaper !== "none" ? getWallpaperStyle(wallpaper) : undefined}
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div
                    className={`rounded-2xl p-6 ${wallpaper !== "none" ? "bg-white/70 shadow-lg backdrop-blur-md" : ""}`}
                  >
                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 mx-auto">
                      <MessageSquare className="h-7 w-7 text-violet-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">No messages yet</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Send a message to start the conversation
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={msg._id}
                    data-msg-id={msg._id}
                    className={`rounded-xl transition-all duration-500 ${
                      highlightedMsgId === msg._id
                        ? "bg-violet-100/70 ring-2 ring-violet-400 ring-offset-1"
                        : ""
                    }`}
                  >
                    {shouldShowDateSeparator(msg, messages[i - 1]) && (
                      <div className="my-4 flex items-center gap-3">
                        <div
                          className={`h-px flex-1 ${wallpaper !== "none" ? "bg-white/30" : "bg-gray-200"}`}
                        />
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                            wallpaper !== "none"
                              ? "bg-white/70 text-gray-700 shadow backdrop-blur-sm"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                        <div
                          className={`h-px flex-1 ${wallpaper !== "none" ? "bg-white/30" : "bg-gray-200"}`}
                        />
                      </div>
                    )}
                    <MessageBubble
                      msg={msg}
                      isMine={msg.sender._id === currentUserId}
                      hasWallpaper={wallpaper !== "none"}
                      onCopy={() => handleCopy(msg.message)}
                      onReply={() => handleReply(msg)}
                      onDelete={() => handleDeleteMsg(msg._id)}
                      onEdit={() => handleEditMsg(msg)}
                      onPreview={setPreviewFile}
                      onScrollToReply={handleScrollToReply}
                    />
                  </div>
                ))
              )}

              {showTyping && (
                <TypingIndicator
                  name={selectedUser?.name ?? ""}
                  hasWallpaper={wallpaper !== "none"}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="relative z-10 border-t border-gray-200/70 bg-white px-3 py-3 shadow-[0_-1px_8px_rgba(0,0,0,0.05)] sm:px-6">
              {/* Pending file attachments preview */}
              {pendingFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {pendingFiles.map((pf) => (
                    <div
                      key={pf.id}
                      className="relative flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5"
                    >
                      {pf.previewUrl ? (
                        <img
                          src={pf.previewUrl}
                          alt={pf.file.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                          <FileText className="h-5 w-5 text-violet-600" />
                        </div>
                      )}
                      <div className="min-w-0 max-w-[120px]">
                        <p className="truncate text-xs font-medium text-gray-700">{pf.file.name}</p>
                        <p className="text-[10px] text-gray-400">{formatFileSize(pf.file.size)}</p>
                      </div>
                      {pf.status === "uploading" && (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                      )}
                      {pf.status === "error" && (
                        <span className="text-[10px] text-red-500">Error</span>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setPendingFiles((prev) => prev.filter((f) => f.id !== pf.id))
                        }
                        className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit preview bar */}
              {editTarget && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border-l-[3px] border-amber-400 bg-amber-50 py-2 pl-3 pr-2">
                  <Pencil className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-amber-600">Editing message</p>
                    <p className="truncate text-xs text-gray-500">{editTarget.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditTarget(null);
                      setMessageInput("");
                    }}
                    className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-amber-100 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Reply preview bar */}
              {replyTo && (
                <div className="mb-2 flex items-center gap-2 rounded-xl border-l-[3px] border-violet-500 bg-violet-50 py-2 pl-3 pr-2">
                  <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-violet-600">
                      {replyTo.sender._id === currentUserId ? "You" : selectedUser?.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {replyTo.message || (replyTo.attachments?.length ? "📎 Attachment" : "")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="shrink-0 rounded-md p-1 text-gray-400 hover:bg-violet-100 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2 sm:gap-3">
                {/* Attachment button */}
                <button
                  type="button"
                  title="Attach file"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <Paperclip className="h-5 w-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.mp4,.mp3"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Emoji toggle button — picker anchors directly above this button */}
                <div className="relative mb-0.5 shrink-0">
                  <button
                    ref={emojiButtonRef}
                    type="button"
                    onClick={() => setEmojiOpen((o) => !o)}
                    title="Emoji"
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                      emojiOpen
                        ? "bg-violet-100 text-violet-600"
                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    }`}
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  {/* Picker floats directly above the button */}
                  {emojiOpen && (
                    <div ref={emojiPickerRef} className="absolute bottom-full left-0 z-50 mb-2">
                      <EmojiPicker onSelect={handleEmojiSelect} />
                    </div>
                  )}
                </div>

                {/* Text input */}
                <div className="relative min-w-0 flex-1">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    style={{ height: "auto", minHeight: "44px" }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                    }}
                  />
                </div>

                {/* Send button */}
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!messageInput.trim() && pendingFiles.length === 0}
                  className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition-all hover:bg-violet-700 hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-1.5 text-[11px] text-gray-400 sm:hidden">Tap send or press Enter</p>
              <p className="mt-1.5 hidden text-[11px] text-gray-400 sm:block">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </>
        )}

        {/* ---- Wallpaper Sidebar (slides in from right) ---- */}
        <div
          className={`absolute right-0 top-0 z-40 h-full w-72 flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
            wallpaperSidebarOpen ? "flex translate-x-0" : "translate-x-full"
          }`}
          aria-hidden={!wallpaperSidebarOpen}
        >
          <WallpaperPicker
            current={wallpaper}
            onChange={setWallpaper}
            onClose={() => setWallpaperSidebarOpen(false)}
          />
        </div>

        {/* Dim overlay behind the sidebar */}
        {wallpaperSidebarOpen && (
          <div
            className="absolute inset-0 z-30 bg-black/20"
            onClick={() => setWallpaperSidebarOpen(false)}
          />
        )}
      </div>

      {/* ---- File / Image Preview Modal ---- */}
      {previewFile && <FilePreviewModal att={previewFile} onClose={() => setPreviewFile(null)} />}

      {/* ---- Clear Chat Confirmation Modal ---- */}
      {clearChatConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setClearChatConfirm(false)}
        >
          <div
            className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Eraser className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Clear chat?</h3>
              <p className="mt-1 text-sm text-gray-500">
                All messages will be removed from your view only.{" "}
                <span className="font-medium text-gray-700">{selectedUser?.name}</span> will still
                see the conversation.
              </p>
            </div>
            <div className="flex flex-col gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={handleClearChat}
                className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Clear Chat
              </button>
              <button
                type="button"
                onClick={() => setClearChatConfirm(false)}
                className="w-full rounded-xl py-2 text-sm text-gray-400 transition hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Delete Confirmation Modal ---- */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icon + title */}
            <div className="flex flex-col items-center px-6 pt-6 pb-4 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Delete message?</h3>
              <p className="mt-1 text-sm text-gray-500">Choose who to delete this message for.</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => handleConfirmDelete("everyone")}
                className="w-full rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Delete for Everyone
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete("me")}
                className="w-full rounded-xl bg-gray-100 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
              >
                Delete for Me
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="w-full rounded-xl py-2 text-sm text-gray-400 transition hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
