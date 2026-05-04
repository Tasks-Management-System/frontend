import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { socket } from "../utils/socket";
import type { ChatMessage } from "../types/chat.types";
import {
  isDesktopNotificationSupported,
  notifyIncomingDesktopChat,
  requestChatDesktopNotifications,
} from "../utils/desktopNotification";

const STORAGE_KEY = "chatUnreadCounts";

type UnreadMap = Record<string, number>; // senderId → unread count

export type DesktopNotificationPermission = NotificationPermission | "unsupported"; // SSR or Notification API unavailable

function getDesktopPermissionFlag(): DesktopNotificationPermission {
  if (!isDesktopNotificationSupported()) return "unsupported";
  return Notification.permission;
}

type ChatNotificationContextValue = {
  /** Per-sender unread counts (also keyed as `group:<groupId>`) */
  unreadCounts: UnreadMap;
  /** Sum of all unread counts */
  totalUnread: number;
  /** Clear unread count for a specific sender (called when opening that chat) */
  clearUnread: (key: string) => void;
  /** Clear all unread counts */
  clearAll: () => void;
  /** Tell the context which chat is currently open */
  setActiveChatUser: (userId: string) => void;
  /** Tell the context which group chat is currently open */
  setActiveGroupId: (groupId: string) => void;
  /** Browser native notification permission (HTTPS or localhost required) */
  desktopPermission: DesktopNotificationPermission;
  /** Prompt for permission (needs a prior user gesture, e.g. button click). */
  requestDesktopNotifications: () => Promise<boolean>;
};

const ChatNotificationContext = createContext<ChatNotificationContextValue>({
  unreadCounts: {},
  totalUnread: 0,
  clearUnread: () => undefined,
  clearAll: () => undefined,
  setActiveChatUser: () => undefined,
  setActiveGroupId: () => undefined,
  desktopPermission: "unsupported",
  requestDesktopNotifications: async () => false,
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
  const [activeGroupId, setActiveGroupIdState] = useState("");
  const [desktopPermission, setDesktopPermission] = useState<DesktopNotificationPermission>(() =>
    getDesktopPermissionFlag()
  );

  const totalUnread = Object.values(unreadCounts).reduce((s, n) => s + n, 0);

  const requestDesktopNotifications = useCallback(async () => {
    const ok = await requestChatDesktopNotifications();
    setDesktopPermission(getDesktopPermissionFlag());
    return ok;
  }, []);

  // Listen for incoming DM messages globally
  useEffect(() => {
    function handleReceive(msg: ChatMessage) {
      const currentUserId = localStorage.getItem("userId") ?? "";
      if (msg.sender._id === currentUserId) return;

      const senderId = msg.sender._id;
      notifyIncomingDesktopChat(msg, activeChatUserId);
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

  // Listen for incoming group messages globally
  useEffect(() => {
    function handleGroupReceive({
      groupId,
      message: msg,
    }: {
      groupId: string;
      message: ChatMessage;
    }) {
      const currentUserId = localStorage.getItem("userId") ?? "";
      if (msg.sender._id === currentUserId) return;

      const key = `group:${groupId}`;
      if (key === `group:${activeGroupId}`) return;

      setUnreadCounts((prev) => {
        const next = { ...prev, [key]: (prev[key] ?? 0) + 1 };
        saveToStorage(next);
        return next;
      });
    }

    socket.on("group:message:receive", handleGroupReceive);
    return () => {
      socket.off("group:message:receive", handleGroupReceive);
    };
  }, [activeGroupId]);

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

  const setActiveGroupId = useCallback((groupId: string) => {
    setActiveGroupIdState(groupId);
  }, []);

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadCounts,
        totalUnread,
        clearUnread,
        clearAll,
        setActiveChatUser,
        setActiveGroupId,
        desktopPermission,
        requestDesktopNotifications,
      }}
    >
      {children}
    </ChatNotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useChatNotifications() {
  return useContext(ChatNotificationContext);
}
