import type { RefObject } from "react";
import type { ChatAttachment, ChatMessage } from "../../types/chat.types";
import type { WallpaperValue } from "../../hooks/useChatWallpaper";
import { getWallpaperStyle } from "../../hooks/useChatWallpaper";
import { ConversationEmpty } from "./ConversationEmpty";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { formatDateSeparator, shouldShowDateSeparator } from "./chatUtils";

type ChatMessagesListProps = {
  messages: ChatMessage[];
  currentUserId: string;
  wallpaper: WallpaperValue;
  highlightedMsgId: string | null;
  messageContainerRef: RefObject<HTMLDivElement | null>;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  showTyping: boolean;
  typingUserName: string;
  onCopyText: (text: string) => void;
  onReply: (msg: ChatMessage) => void;
  onDeleteMsg: (msgId: string) => void;
  onEditMsg: (msg: ChatMessage) => void;
  onPickReaction: (msg: ChatMessage, anchor: HTMLElement | null) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onPreview: (att: ChatAttachment) => void;
  onScrollToReply: (replyId: string) => void;
};

export function ChatMessagesList({
  messages,
  currentUserId,
  wallpaper,
  highlightedMsgId,
  messageContainerRef,
  messagesEndRef,
  showTyping,
  typingUserName,
  onCopyText,
  onReply,
  onDeleteMsg,
  onEditMsg,
  onPickReaction,
  onToggleReaction,
  onPreview,
  onScrollToReply,
}: ChatMessagesListProps) {
  const hasWallpaper = wallpaper !== "none";

  return (
    <div
      ref={messageContainerRef}
      className={`flex-1 overflow-y-auto px-3 py-4 sm:px-6 ${wallpaper === "none" ? "bg-gradient-to-b from-gray-50/50 to-white" : ""}`}
      style={wallpaper !== "none" ? getWallpaperStyle(wallpaper) : undefined}
    >
      {messages.length === 0 ? (
        <ConversationEmpty wallpaperIsCustom={hasWallpaper} />
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
                  className={`h-px flex-1 ${hasWallpaper ? "bg-white/30" : "bg-gray-200"}`}
                />
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium ${
                    hasWallpaper
                      ? "bg-white/70 text-gray-700 shadow backdrop-blur-sm"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {formatDateSeparator(msg.createdAt)}
                </span>
                <div
                  className={`h-px flex-1 ${hasWallpaper ? "bg-white/30" : "bg-gray-200"}`}
                />
              </div>
            )}
            <MessageBubble
              msg={msg}
              isMine={msg.sender._id === currentUserId}
              hasWallpaper={hasWallpaper}
              currentUserId={currentUserId}
              onCopy={() => onCopyText(msg.message)}
              onReply={() => onReply(msg)}
              onDelete={() => onDeleteMsg(msg._id)}
              onEdit={() => onEditMsg(msg)}
              onPickReaction={(el) => onPickReaction(msg, el)}
              onToggleReactionEmoji={(emoji) => void onToggleReaction(msg._id, emoji)}
              onPreview={onPreview}
              onScrollToReply={onScrollToReply}
            />
          </div>
        ))
      )}

      {showTyping && (
        <TypingIndicator name={typingUserName} hasWallpaper={hasWallpaper} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
