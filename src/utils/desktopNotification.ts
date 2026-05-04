import type { ChatMessage } from "../types/chat.types";

/** Must be HTTPS (or localhost) for the Notification API */
export function isDesktopNotificationSupported() {
  return typeof window !== "undefined" && typeof Notification !== "undefined";
}

export async function requestChatDesktopNotifications(): Promise<boolean> {
  if (!isDesktopNotificationSupported()) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

function previewIncomingBody(msg: ChatMessage): string {
  if (msg.message?.trim()) return msg.message.trim();
  if (msg.attachments?.length)
    return msg.attachments.length === 1
      ? `📎 ${msg.attachments[0].name}`
      : `📎 ${msg.attachments.length} attachments`;
  return "New message";
}

/**
 * When the receiver already has this thread open AND the tab/window is in the foreground,
 * skip (same as not bumping unread for that sender).
 */
function shouldSuppressIncomingDesktop(senderId: string, activeChatUserId: string): boolean {
  if (senderId !== activeChatUserId) return false;
  if (typeof document === "undefined") return false;
  try {
    return document.visibilityState === "visible" && document.hasFocus();
  } catch {
    return document.visibilityState === "visible";
  }
}

/** Native OS/browser banner (requires prior permission grant + user gesture to request). */
export function notifyIncomingDesktopChat(msg: ChatMessage, activeChatUserId: string) {
  if (!isDesktopNotificationSupported() || Notification.permission !== "granted") return;
  if (!msg?.sender?.name || !msg?.sender?._id) return;
  const senderId = msg.sender._id;

  const currentUserId = localStorage.getItem("userId") ?? "";
  if (senderId === currentUserId) return;

  if (shouldSuppressIncomingDesktop(senderId, activeChatUserId)) return;

  const title = `New message from ${msg.sender.name}`;
  const body = previewIncomingBody(msg);

  try {
    new Notification(title, {
      body: body.length > 400 ? `${body.slice(0, 400)}…` : body,
      tag: `crm-chat-${senderId}`,
      silent: false,
      icon: `${window.location.origin}/vite.svg`,
    });
  } catch {
    // ignore malformed options in older browsers
  }
}
