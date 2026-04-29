import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { socket } from "../utils/socket";
import type { ChatMessage } from "../types/chat.types";

const STORAGE_KEY = "chatUnreadCounts";

type UnreadMap = Record<string, number>; // senderId → unread count

type ChatNotificationContextValue = {
  /** Per-sender unread counts */
  unreadCounts: UnreadMap;
  /** Sum of all unread counts */
  totalUnread: number;
  /** Clear unread count for a specific sender (called when opening that chat) */
  clearUnread: (senderId: string) => void;
  /** Clear all unread counts */
  clearAll: () => void;
  /** Tell the context which chat is currently open so messages from that sender
   *  don't increment the badge while the conversation is visible */
  setActiveChatUser: (userId: string) => void;
};

const ChatNotificationContext = createContext<ChatNotificationContextValue>({
  unreadCounts: {},
  totalUnread: 0,
  clearUnread: () => undefined,
  clearAll: () => undefined,
  setActiveChatUser: () => undefined,
});

function loadFromStorage(): UnreadMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) return parsed as UnreadMap;
  } catch {
    // ignore
  }
  return {};
}

function saveToStorage(counts: UnreadMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
}

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCounts, setUnreadCounts] = useState<UnreadMap>(loadFromStorage);
  const [activeChatUserId, setActiveChatUserId] = useState("");

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  // Listen for incoming messages globally so the badge works on every page
  useEffect(() => {
    function handleReceive(msg: ChatMessage) {
      const currentUserId = localStorage.getItem("userId") ?? "";

      // Only count messages that someone else sent to me.
      // We check sender (always populated) rather than receiver because the
      // backend used to send receiver as a plain string ID (not populated),
      // making msg.receiver._id unreliable. Checking "sender !== me" is both
      // simpler and correct: if I'm not the sender, the message is incoming.
      if (msg.sender._id === currentUserId) return;

      const senderId = msg.sender._id;

      // If this conversation is currently open, don't count it
      if (senderId === activeChatUserId) return;

      setUnreadCounts((prev) => {
        const next = { ...prev, [senderId]: (prev[senderId] ?? 0) + 1 };
        saveToStorage(next);
        return next;
      });
    }

    socket.on("message:receive", handleReceive);
    return () => {
      socket.off("message:receive", handleReceive);
    };
  }, [activeChatUserId]);

  const clearUnread = useCallback((senderId: string) => {
    setUnreadCounts((prev) => {
      if (!prev[senderId]) return prev;
      const next = { ...prev };
      delete next[senderId];
      saveToStorage(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    setUnreadCounts({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setActiveChatUser = useCallback((userId: string) => {
    setActiveChatUserId(userId);
  }, []);

  return (
    <ChatNotificationContext.Provider
      value={{ unreadCounts, totalUnread, clearUnread, clearAll, setActiveChatUser }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
}

export function useChatNotifications() {
  return useContext(ChatNotificationContext);
}
