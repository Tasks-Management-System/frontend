import type { ChatMessage, ChatReaction, ChatUser } from "../../types/chat.types";

export function formatMessageTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDateSeparator(iso: string) {
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

export function shouldShowDateSeparator(current: ChatMessage, prev: ChatMessage | undefined) {
  if (!prev) return true;
  return new Date(current.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
}

export function aggregateReactions(reactions: ChatReaction[] | undefined, currentUserId: string) {
  if (!reactions?.length) return [];
  const map = new Map<string, Array<{ _id: string; name: string; profileImage: string | null }>>();
  for (const r of reactions) {
    const u = r.user;
    if (!u?._id) continue;
    const list = map.get(r.emoji) ?? [];
    list.push(u);
    map.set(r.emoji, list);
  }
  return [...map.entries()].map(([emoji, users]) => ({
    emoji,
    count: users.length,
    users,
    iReacted: users.some((x) => x._id === currentUserId),
  }));
}

/** Parse a reply-prefixed message into its quoted part and body.
 *  Format written by handleSend: "> Name: original\n\nactual reply"
 *  Returns { quote: { name, text } | null, body: string } */
export function parseMessage(raw: string): {
  quote: { name: string; text: string } | null;
  body: string;
} {
  if (!raw.startsWith("> ")) return { quote: null, body: raw };
  const newlineIdx = raw.indexOf("\n\n");
  if (newlineIdx === -1) return { quote: null, body: raw };

  const quoteLine = raw.slice(2, newlineIdx);
  const colonIdx = quoteLine.indexOf(": ");
  if (colonIdx === -1) return { quote: null, body: raw };

  return {
    quote: { name: quoteLine.slice(0, colonIdx), text: quoteLine.slice(colonIdx + 2) },
    body: raw.slice(newlineIdx + 2),
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImageMime(mimeType: string) {
  return mimeType.startsWith("image/");
}

export function isVideoMime(mimeType: string) {
  return mimeType.startsWith("video/");
}

export function getFileIcon(mimeType: string) {
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

export function isPdfMime(mimeType: string) {
  return mimeType === "application/pdf";
}

/** Populated mentions; for 1:1 chats falls back to sender/receiver names when REST omits mentions (legacy loads). */
export function resolveMentionUsersForHighlight(msg: ChatMessage): ChatUser[] {
  const raw = msg.mentions ?? [];
  const fromApi: ChatUser[] = [];
  for (const m of raw) {
    if (!m || typeof m !== "object") continue;
    const id = "_id" in m ? String((m as ChatUser)._id) : "";
    const name = typeof (m as ChatUser).name === "string" ? (m as ChatUser).name.trim() : "";
    if (!id || !name) continue;
    const u = m as ChatUser;
    fromApi.push({ _id: id, name, profileImage: u.profileImage ?? null });
  }
  if (fromApi.length > 0) return fromApi;

  if (!msg.group) {
    const pool: ChatUser[] = [];
    const add = (u: ChatUser | null | undefined) => {
      const name = u?.name?.trim();
      if (!u?._id || !name) return;
      pool.push({ _id: String(u._id), name, profileImage: u.profileImage ?? null });
    };
    add(msg.sender);
    add(msg.receiver ?? null);
    const seen = new Set<string>();
    return pool.filter((x) => (seen.has(x._id) ? false : !!seen.add(x._id)));
  }
  return [];
}

/**
 * Splits message text into segments and wraps @Name tokens that match
 * a mentioned user with a highlight span. Returns an array of React nodes.
 */
export function renderMentions(
  text: string,
  mentions: ChatUser[]
): (string | { key: string; text: string; highlight: boolean })[] {
  const safeText = text ?? "";
  const validNames = [
    ...new Set(
      (mentions ?? [])
        .map((m) => (typeof m?.name === "string" ? m.name.trim() : ""))
        .filter(Boolean)
    ),
  ];
  if (!validNames.length) return [safeText];

  const mentionNames = new Set(validNames);
  // Match @word or @multi word (greedy — tries longest first via alternation)
  const pattern = new RegExp(
    `(@(?:${[...mentionNames]
      .sort((a, b) => b.length - a.length)
      .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|")}))`,
    "g"
  );

  const parts: (string | { key: string; text: string; highlight: boolean })[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(safeText)) !== null) {
    if (match.index > last) parts.push(safeText.slice(last, match.index));
    parts.push({ key: `${match.index}`, text: match[1], highlight: true });
    last = match.index + match[1].length;
  }
  if (last < safeText.length) parts.push(safeText.slice(last));
  return parts;
}

export function isOfficeMime(mimeType: string) {
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
