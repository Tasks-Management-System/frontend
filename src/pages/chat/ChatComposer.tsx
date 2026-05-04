import type { ChangeEvent, Dispatch, KeyboardEvent, RefObject, SetStateAction } from "react";
import { CornerUpLeft, FileText, Paperclip, Pencil, Send, Smile, X } from "lucide-react";
import type { ChatMessage } from "../../types/chat.types";
import EmojiPicker from "../../components/chat/EmojiPicker";
import { formatFileSize } from "./chatUtils";
import type { PendingChatFile } from "./chatTypes";

type ChatComposerProps = {
  messageInput: string;
  setMessageInput: (v: string) => void;
  pendingFiles: PendingChatFile[];
  setPendingFiles: Dispatch<SetStateAction<PendingChatFile[]>>;
  replyTo: ChatMessage | null;
  setReplyTo: (v: ChatMessage | null) => void;
  editTarget: { id: string; text: string } | null;
  setEditTarget: (v: { id: string; text: string } | null) => void;
  selectedUserDisplayName?: string;
  currentUserId: string;
  fileInputRef: RefObject<HTMLInputElement | null>;
  emojiButtonRef: RefObject<HTMLButtonElement | null>;
  emojiPickerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  emojiOpen: boolean;
  setEmojiOpen: (open: boolean | ((o: boolean) => boolean)) => void;
  onSend: () => void;
  onFileChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: KeyboardEvent) => void;
  onEmojiSelect: (emoji: string) => void;
};

export function ChatComposer({
  messageInput,
  setMessageInput,
  pendingFiles,
  setPendingFiles,
  replyTo,
  setReplyTo,
  editTarget,
  setEditTarget,
  selectedUserDisplayName,
  currentUserId,
  fileInputRef,
  emojiButtonRef,
  emojiPickerRef,
  inputRef,
  emojiOpen,
  setEmojiOpen,
  onSend,
  onFileChange,
  onInputChange,
  onKeyDown,
  onEmojiSelect,
}: ChatComposerProps) {
  return (
    <div className="relative z-10 border-t border-gray-200/70 bg-white px-3 py-3 shadow-[0_-1px_8px_rgba(0,0,0,0.05)] sm:px-6">
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
              {pf.status === "error" && <span className="text-[10px] text-red-500">Error</span>}
              <button
                type="button"
                onClick={() => setPendingFiles((prev) => prev.filter((f) => f.id !== pf.id))}
                className="ml-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

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

      {replyTo && (
        <div className="mb-2 flex items-center gap-2 rounded-xl border-l-[3px] border-violet-500 bg-violet-50 py-2 pl-3 pr-2">
          <CornerUpLeft className="h-3.5 w-3.5 shrink-0 text-violet-500" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-violet-600">
              {replyTo.sender._id === currentUserId ? "You" : selectedUserDisplayName}
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
          onChange={onFileChange}
        />

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

          {emojiOpen && (
            <div ref={emojiPickerRef} className="absolute bottom-full left-0 z-50 mb-2">
              <EmojiPicker onSelect={onEmojiSelect} />
            </div>
          )}
        </div>

        <div className="relative min-w-0 flex-1">
          <textarea
            ref={inputRef}
            value={messageInput}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
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

        <button
          type="button"
          onClick={onSend}
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
  );
}
