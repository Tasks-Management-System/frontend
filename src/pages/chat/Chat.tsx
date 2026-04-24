import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Search, Send, MessageSquare, Circle, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { useChatMessages, useChatUsers, useOnlineUsers } from "../../apis/api/chat";
import { getUserId } from "../../utils/auth";
import { socket } from "../../utils/socket";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatMessage } from "../../types/chat.types";
import type { User } from "../../types/user.types";

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

function MessageBubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1 group`}>
      <div
        className={`relative max-w-[75%] sm:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isMine
            ? "bg-violet-600 text-white rounded-br-md"
            : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
        <div
          className={`mt-1 flex items-center justify-end gap-1 ${
            isMine ? "text-violet-200" : "text-gray-400"
          }`}
        >
          <span className="text-[10px]">{formatMessageTime(msg.createdAt)}</span>
          {isMine &&
            (msg.isRead ? (
              <CheckCheck className="h-3.5 w-3.5" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing Indicator                                                   */
/* ------------------------------------------------------------------ */

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <div className="flex items-center gap-1 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
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

  const { data: allUsers = [] } = useChatUsers();
  const { data: onlineIds = [] } = useOnlineUsers();
  const onlineUserIds = useMemo(() => new Set(onlineIds), [onlineIds]);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [lastMessages, setLastMessages] = useState<Map<string, ChatMessage>>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const { data: chatData } = useChatMessages(selectedUserId);

  const selectedUser = useMemo(
    () => allUsers.find((u) => u._id === selectedUserId),
    [allUsers, selectedUserId]
  );

  // Load messages from REST when conversation changes or cached data is already available
  useEffect(() => {
    if (chatData?.data) {
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

        // Mark as read if from the other user and clear any stale unread count
        if (msg.sender._id === selectedUserId) {
          socket.emit("message:read", { senderId: selectedUserId });
          setUnreadCounts((prev) => {
            if (!prev.has(selectedUserId)) return prev;
            const next = new Map(prev);
            next.delete(selectedUserId);
            return next;
          });
        }
      } else if (msg.sender._id !== currentUserId) {
        // Increment unread for a different conversation
        setUnreadCounts((prev) => {
          const next = new Map(prev);
          next.set(otherUserId, (prev.get(otherUserId) ?? 0) + 1);
          return next;
        });
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

    function handleOnline({ userId }: { userId: string }) {
      queryClient.invalidateQueries({ queryKey: ["onlineUsers"] });
    }

    function handleOffline({ userId }: { userId: string }) {
      queryClient.invalidateQueries({ queryKey: ["onlineUsers"] });
    }

    socket.on("message:receive", handleReceive);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:read", handleMessageRead);
    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOffline);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:read", handleMessageRead);
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOffline);
    };
  }, [selectedUserId, currentUserId, queryClient]);

  // Mark messages as read when selecting a conversation
  useEffect(() => {
    if (selectedUserId) {
      socket.emit("message:read", { senderId: selectedUserId });
      setUnreadCounts((prev) => {
        const next = new Map(prev);
        next.delete(selectedUserId);
        return next;
      });
    }
  }, [selectedUserId]);

  const handleSelectUser = useCallback(
    (id: string) => {
      if (id === selectedUserId) return;
      setSelectedUserId(id);
      setMessages([]);
      setMessageInput("");
    },
    [selectedUserId]
  );

  const handleSend = useCallback(() => {
    const text = messageInput.trim();
    if (!text || !selectedUserId) return;

    socket.emit(
      "message:send",
      { receiverId: selectedUserId, message: text },
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

    setMessageInput("");
    socket.emit("typing:stop", { receiverId: selectedUserId });
    inputRef.current?.focus();
  }, [messageInput, selectedUserId]);

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
    <div className="flex h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
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
            <p className="text-xs text-gray-500">{onlineUserIds.size} online</p>
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
      <div className={`${!mobileShowChat ? "hidden" : "flex"} min-w-0 flex-1 flex-col md:flex`}>
        {!selectedUserId ? (
          <EmptyState />
        ) : (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-gray-200/60 px-4 py-3 sm:px-6">
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
            </div>

            {/* Messages */}
            <div
              ref={messageContainerRef}
              className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50/50 to-white px-3 py-4 sm:px-6"
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
                    <MessageSquare className="h-7 w-7 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">No messages yet</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Send a message to start the conversation
                  </p>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={msg._id}>
                    {shouldShowDateSeparator(msg, messages[i - 1]) && (
                      <div className="my-4 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-500">
                          {formatDateSeparator(msg.createdAt)}
                        </span>
                        <div className="h-px flex-1 bg-gray-200" />
                      </div>
                    )}
                    <MessageBubble msg={msg} isMine={msg.sender._id === currentUserId} />
                  </div>
                ))
              )}

              {showTyping && <TypingIndicator name={selectedUser?.name ?? ""} />}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-200/60 bg-white px-3 py-3 sm:px-6">
              <div className="flex gap-2 sm:gap-3 justify-center items-center w-full">
                <div className="relative min-w-0 flex-1">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="max-h-32 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                    style={{
                      height: "auto",
                      minHeight: "44px",
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!messageInput.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm transition-all hover:bg-violet-700 hover:shadow-md disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400 sm:hidden">Tap send or press Enter</p>
              <p className="mt-1.5 hidden text-[11px] text-gray-400 sm:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Chat;
