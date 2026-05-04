import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  startTransition,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import toast from "react-hot-toast";
import {
  useChatMessages,
  useGroupMessages,
  useChatUsers,
  useChatGroups,
  useOnlineUsers,
  deleteMessageApi,
  editMessageApi,
  clearChatApi,
  clearGroupChatApi,
  uploadChatFileApi,
  toggleReactionApi,
  createGroupApi,
  updateGroupApi,
  deleteGroupApi,
  leaveGroupApi,
} from "../../apis/api/chat";
import { getUserId } from "../../utils/session";
import { socket } from "../../utils/socket";
import { useQueryClient } from "@tanstack/react-query";
import type { ChatAttachment, ChatMessage, ChatReaction } from "../../types/chat.types";
import type { User } from "../../types/user.types";
import { useChatNotifications } from "../../contexts/ChatNotificationContext";
import { useChatWallpaper } from "../../hooks/useChatWallpaper";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";

import { parseMessage } from "./chatUtils";
import type { PendingChatFile } from "./chatTypes";
import { EmptyState } from "./EmptyState";
import { ContactsPanel } from "./ContactsPanel";
import { ChatHeader } from "./ChatHeader";
import { ChatMessagesList } from "./ChatMessagesList";
import { ChatComposer } from "./ChatComposer";
import { ChatWallpaperDrawer } from "./ChatWallpaperDrawer";
import { FilePreviewModal } from "./FilePreviewModal";
import { ClearChatConfirmModal } from "./ClearChatConfirmModal";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { ChatReactionPickerPortal } from "./ChatReactionPickerPortal";
import { CreateGroupModal } from "./CreateGroupModal";
import { GroupInfoDrawer } from "./GroupInfoDrawer";

const Chat = () => {
  const currentUserId = getUserId();
  const queryClient = useQueryClient();
  const { activeMode } = useActiveOrg();

  const { data: allUsers = [] } = useChatUsers(activeMode);
  const { data: onlineIds = [] } = useOnlineUsers();
  const { data: groups = [], refetch: refetchGroups } = useChatGroups();
  const onlineUserIds = useMemo(() => new Set(onlineIds), [onlineIds]);

  // ── Conversation selection ───────────────────────────────────────────────
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const selectedUser = useMemo(
    () => allUsers.find((u) => u._id === selectedUserId),
    [allUsers, selectedUserId]
  );
  const selectedGroup = useMemo(
    () => groups.find((g) => g._id === selectedGroupId),
    [groups, selectedGroupId]
  );

  // ── Messages ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { data: chatData } = useChatMessages(selectedUserId);
  const { data: groupChatData } = useGroupMessages(selectedGroupId);

  useEffect(() => {
    if (selectedUserId && chatData?.data) {
      startTransition(() => {
        setMessages(chatData.data.map((m) => ({ ...m, reactions: m.reactions ?? [] })));
      });
    }
  }, [chatData, selectedUserId]);

  useEffect(() => {
    if (selectedGroupId && groupChatData?.data) {
      startTransition(() => {
        setMessages(groupChatData.data.map((m) => ({ ...m, reactions: m.reactions ?? [] })));
      });
    }
  }, [groupChatData, selectedGroupId]);

  // ── Input state ───────────────────────────────────────────────────────────
  const [messageInput, setMessageInput] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [groupTypingUsers, setGroupTypingUsers] = useState<Map<string, Set<string>>>(new Map());
  const [lastMessages, setLastMessages] = useState<Map<string, ChatMessage>>(new Map());
  const [lastGroupMessages, setLastGroupMessages] = useState<Map<string, ChatMessage>>(new Map());
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);

  const {
    unreadCounts: globalUnreadCounts,
    clearUnread,
    setActiveChatUser,
    setActiveGroupId,
  } = useChatNotifications();
  const unreadCounts = useMemo(
    () => new Map(Object.entries(globalUnreadCounts).map(([k, v]) => [k, v])),
    [globalUnreadCounts]
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<{ id: string; text: string } | null>(null);
  const [clearChatConfirm, setClearChatConfirm] = useState(false);
  const [previewFile, setPreviewFile] = useState<ChatAttachment | null>(null);
  const [reactionPicker, setReactionPicker] = useState<{
    messageId: string;
    top: number;
    left: number;
  } | null>(null);

  const [pendingFiles, setPendingFiles] = useState<PendingChatFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const reactionPickerMessageRef = useRef<string | null>(null);

  const wallpaperKey = selectedGroupId ? `group-${selectedGroupId}` : selectedUserId;
  const { wallpaper, setWallpaper } = useChatWallpaper(wallpaperKey);
  const [wallpaperSidebarOpen, setWallpaperSidebarOpen] = useState(false);
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const prevMessageCountRef = useRef(0);

  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // ── Scroll ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > prevMessageCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (typingUsers.size > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [typingUsers]);

  // ── DM socket events ──────────────────────────────────────────────────────
  useEffect(() => {
    function handleReceive(msg: ChatMessage) {
      const otherUserId =
        msg.sender._id === currentUserId ? (msg.receiver?._id ?? "") : msg.sender._id;

      setLastMessages((prev) => {
        const next = new Map(prev);
        next.set(otherUserId, msg);
        return next;
      });

      if (
        (msg.sender._id === selectedUserId && msg.receiver?._id === currentUserId) ||
        (msg.sender._id === currentUserId && msg.receiver?._id === selectedUserId)
      ) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, { ...msg, reactions: msg.reactions ?? [] }];
        });
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
    function handleReactionsUpdated({
      messageId,
      reactions,
    }: {
      messageId: string;
      reactions: ChatReaction[];
    }) {
      setMessages((prev) =>
        prev.some((m) => m._id === messageId)
          ? prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
          : prev
      );
    }
    function handleOnline() {
      queryClient.invalidateQueries({ queryKey: ["onlineUsers"] });
    }

    socket.on("message:receive", handleReceive);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    socket.on("message:read", handleMessageRead);
    socket.on("message:delete", handleMessageDelete);
    socket.on("message:edit", handleMessageEdit);
    socket.on("message:reactions-updated", handleReactionsUpdated);
    socket.on("user:online", handleOnline);
    socket.on("user:offline", handleOnline);

    return () => {
      socket.off("message:receive", handleReceive);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
      socket.off("message:read", handleMessageRead);
      socket.off("message:delete", handleMessageDelete);
      socket.off("message:edit", handleMessageEdit);
      socket.off("message:reactions-updated", handleReactionsUpdated);
      socket.off("user:online", handleOnline);
      socket.off("user:offline", handleOnline);
    };
  }, [selectedUserId, currentUserId, queryClient, clearUnread]);

  // ── Group socket events ───────────────────────────────────────────────────
  useEffect(() => {
    function handleGroupReceive({
      groupId,
      message: msg,
    }: {
      groupId: string;
      message: ChatMessage;
    }) {
      setLastGroupMessages((prev) => {
        const next = new Map(prev);
        next.set(groupId, msg);
        return next;
      });

      if (groupId === selectedGroupId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, { ...msg, reactions: msg.reactions ?? [] }];
        });
        clearUnread(`group:${groupId}`);
      }
    }

    function handleGroupTypingStart({ userId, groupId }: { userId: string; groupId: string }) {
      setGroupTypingUsers((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(groupId) ?? []);
        set.add(userId);
        next.set(groupId, set);
        return next;
      });
    }
    function handleGroupTypingStop({ userId, groupId }: { userId: string; groupId: string }) {
      setGroupTypingUsers((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(groupId) ?? []);
        set.delete(userId);
        next.set(groupId, set);
        return next;
      });
    }
    function handleGroupMessageDelete({ messageId }: { messageId: string }) {
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    }
    function handleGroupMessageEdit({
      messageId,
      message,
    }: {
      messageId: string;
      message: string;
    }) {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, message, isEdited: true } : m))
      );
    }

    socket.on("group:message:receive", handleGroupReceive);
    socket.on("group:typing:start", handleGroupTypingStart);
    socket.on("group:typing:stop", handleGroupTypingStop);
    socket.on("group:message:delete", handleGroupMessageDelete);
    socket.on("group:message:edit", handleGroupMessageEdit);

    return () => {
      socket.off("group:message:receive", handleGroupReceive);
      socket.off("group:typing:start", handleGroupTypingStart);
      socket.off("group:typing:stop", handleGroupTypingStop);
      socket.off("group:message:delete", handleGroupMessageDelete);
      socket.off("group:message:edit", handleGroupMessageEdit);
    };
  }, [selectedGroupId, clearUnread]);

  // ── Click-outside for emoji/menu ──────────────────────────────────────────
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

  useEffect(() => {
    if (!reactionPicker) return;
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") {
        reactionPickerMessageRef.current = null;
        setReactionPicker(null);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reactionPicker]);

  // ── Active conversation tracking ──────────────────────────────────────────
  useEffect(() => {
    setActiveChatUser(selectedUserId);
    if (selectedUserId) {
      socket.emit("message:read", { senderId: selectedUserId });
      clearUnread(selectedUserId);
    }
    return () => {
      setActiveChatUser("");
    };
  }, [selectedUserId, clearUnread, setActiveChatUser]);

  useEffect(() => {
    setActiveGroupId(selectedGroupId);
    if (selectedGroupId) clearUnread(`group:${selectedGroupId}`);
    return () => {
      setActiveGroupId("");
    };
  }, [selectedGroupId, clearUnread, setActiveGroupId]);

  // ── Conversation selection handlers ──────────────────────────────────────
  const resetComposer = () => {
    setMessages([]);
    setMessageInput("");
    setReplyTo(null);
    setEditTarget(null);
    setPendingFiles([]);
    setMentionedUserIds([]);
  };

  const handleSelectUser = useCallback(
    (id: string) => {
      if (id === selectedUserId) return;
      setSelectedGroupId("");
      setSelectedUserId(id);
      resetComposer();
    },
    [selectedUserId]
  );

  const handleSelectGroup = useCallback(
    (id: string) => {
      if (id === selectedGroupId) return;
      setSelectedUserId("");
      setSelectedGroupId(id);
      resetComposer();
    },
    [selectedGroupId]
  );

  // ── Group management ──────────────────────────────────────────────────────
  const handleCreateGroup = useCallback(
    async (name: string, description: string, memberIds: string[], groupImage?: string | null) => {
      try {
        const res = await createGroupApi({
          name,
          description,
          memberIds,
          ...(groupImage ? { groupImage } : {}),
        });
        if (res.success && res.data) {
          socket.emit("group:join", { groupId: res.data._id });
          await refetchGroups();
          handleSelectGroup(res.data._id);
          toast.success("Group created!");
        }
      } catch {
        toast.error("Failed to create group");
      }
    },
    [refetchGroups, handleSelectGroup]
  );

  const handleUpdateGroup = useCallback(
    async (payload: { name?: string; description?: string; groupImage?: string | null }) => {
      if (!selectedGroupId) return;
      try {
        await updateGroupApi(selectedGroupId, payload);
        await refetchGroups();
        toast.success("Group updated");
      } catch {
        toast.error("Failed to update group");
      }
    },
    [selectedGroupId, refetchGroups]
  );

  const handleLeaveGroup = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      await leaveGroupApi(selectedGroupId);
      await refetchGroups();
      setSelectedGroupId("");
      resetComposer();
      setGroupInfoOpen(false);
      toast.success("Left the group");
    } catch {
      toast.error("Failed to leave group");
    }
  }, [selectedGroupId, refetchGroups]);

  const handleDeleteGroup = useCallback(async () => {
    if (!selectedGroupId) return;
    try {
      await deleteGroupApi(selectedGroupId);
      await refetchGroups();
      setSelectedGroupId("");
      resetComposer();
      setGroupInfoOpen(false);
      toast.success("Group deleted");
    } catch {
      toast.error("Failed to delete group");
    }
  }, [selectedGroupId, refetchGroups]);

  const handleRemoveGroupMember = useCallback(
    async (memberId: string) => {
      if (!selectedGroupId) return;
      try {
        await updateGroupApi(selectedGroupId, { removeMembers: [memberId] });
        await refetchGroups();
        toast.success("Member removed");
      } catch {
        toast.error("Failed to remove member");
      }
    },
    [selectedGroupId, refetchGroups]
  );

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = messageInput.trim();
    const hasFiles = pendingFiles.length > 0;
    if (!text && !hasFiles) return;
    if (!selectedUserId && !selectedGroupId) return;
    if (pendingFiles.some((f) => f.status === "uploading")) {
      toast.error("Please wait for files to finish uploading");
      return;
    }

    if (editTarget) {
      const { id } = editTarget;
      setEditTarget(null);
      setMessageInput("");
      try {
        const res = await editMessageApi(id, text);
        if (res.success && res.data) {
          setMessages((prev) => prev.map((m) => (m._id === id ? res.data! : m)));
          if (selectedGroupId) {
            socket.emit("group:message:edit", {
              messageId: id,
              message: text,
              groupId: selectedGroupId,
            });
          } else {
            socket.emit("message:edit", {
              messageId: id,
              message: text,
              receiverId: selectedUserId,
            });
          }
        }
      } catch {
        toast.error("Failed to edit message");
      }
      inputRef.current?.focus();
      return;
    }

    const readyAttachments = pendingFiles
      .filter((f) => f.status === "done" && f.result)
      .map((f) => f.result!);
    setPendingFiles([]);

    const uniqueMentionIds = [...new Set(mentionedUserIds)];
    setMentionedUserIds([]);

    if (selectedGroupId) {
      socket.emit(
        "group:message:send",
        {
          groupId: selectedGroupId,
          message: text,
          attachments: readyAttachments,
          replyToId: replyTo?._id ?? null,
          mentions: uniqueMentionIds,
        },
        (response: { success: boolean; data?: ChatMessage; error?: string }) => {
          if (response.success && response.data) {
            setMessages((prev) => {
              if (prev.some((m) => m._id === response.data!._id)) return prev;
              return [...prev, response.data!];
            });
            setLastGroupMessages((prev) => {
              const next = new Map(prev);
              next.set(selectedGroupId, response.data!);
              return next;
            });
          }
        }
      );
    } else {
      socket.emit(
        "message:send",
        {
          receiverId: selectedUserId,
          message: text,
          attachments: readyAttachments,
          replyToId: replyTo?._id ?? null,
          mentions: uniqueMentionIds,
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
          }
        }
      );
    }

    setReplyTo(null);
    setMessageInput("");
    if (selectedGroupId) {
      socket.emit("group:typing:stop", { groupId: selectedGroupId });
    } else {
      socket.emit("typing:stop", { receiverId: selectedUserId });
    }
    inputRef.current?.focus();
  }, [
    messageInput,
    selectedUserId,
    selectedGroupId,
    replyTo,
    editTarget,
    pendingFiles,
    mentionedUserIds,
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

  const openReactionPicker = useCallback((msg: ChatMessage, anchor: HTMLElement | null) => {
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const pw = 328;
    const ph = 360;
    let left = rect.left;
    let top = rect.top - ph - 8;
    if (top < 12) top = rect.bottom + 8;
    left = Math.max(12, Math.min(left, window.innerWidth - pw - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - ph - 12));
    reactionPickerMessageRef.current = msg._id;
    setReactionPicker({ messageId: msg._id, top, left });
  }, []);

  const toggleReactionOnMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      const res = await toggleReactionApi(messageId, emoji);
      if (res.success && res.data?.reactions) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: res.data!.reactions } : m))
        );
      }
    } catch {
      toast.error("Couldn't update reaction");
    }
  }, []);

  const handleConfirmReactionPick = useCallback(
    async (emoji: string) => {
      const targetId = reactionPickerMessageRef.current;
      reactionPickerMessageRef.current = null;
      setReactionPicker(null);
      if (!targetId) return;
      await toggleReactionOnMessage(targetId, emoji);
    },
    [toggleReactionOnMessage]
  );

  const handleConfirmDelete = useCallback(
    async (deleteFor: "me" | "everyone") => {
      if (!deleteTarget) return;
      const id = deleteTarget;
      setDeleteTarget(null);
      try {
        await deleteMessageApi(id, deleteFor);
        setMessages((prev) => prev.filter((m) => m._id !== id));
        if (deleteFor === "everyone") {
          if (selectedGroupId) {
            socket.emit("group:message:delete", { messageId: id, groupId: selectedGroupId });
          } else {
            socket.emit("message:delete", { messageId: id, receiverId: selectedUserId });
          }
        }
      } catch {
        toast.error("Failed to delete message");
      }
    },
    [deleteTarget, selectedUserId, selectedGroupId]
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
      if (selectedGroupId) {
        await clearGroupChatApi(selectedGroupId);
      } else {
        await clearChatApi(selectedUserId);
      }
      setMessages([]);
    } catch {
      toast.error("Failed to clear chat");
    }
  }, [selectedUserId, selectedGroupId]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const newPending: PendingChatFile[] = files.map((file) => ({
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

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value);
    if (selectedGroupId) {
      socket.emit("group:typing:start", { groupId: selectedGroupId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("group:typing:stop", { groupId: selectedGroupId });
      }, 1500);
    } else if (selectedUserId) {
      socket.emit("typing:start", { receiverId: selectedUserId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing:stop", { receiverId: selectedUserId });
      }, 1500);
    }
  };

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

  const handleMentionAdd = useCallback((user: User) => {
    setMentionedUserIds((prev) => [...prev, user._id]);
  }, []);

  const isSelectedOnline = selectedUserId ? onlineUserIds.has(selectedUserId) : false;
  const showTyping = Boolean(selectedUserId && typingUsers.has(selectedUserId));

  const groupTypingSet = selectedGroupId
    ? (groupTypingUsers.get(selectedGroupId) ?? new Set<string>())
    : new Set<string>();
  const groupTypingNames = [...groupTypingSet]
    .map((uid) => allUsers.find((u) => u._id === uid)?.name ?? "Someone")
    .filter(Boolean);
  const showGroupTyping = groupTypingNames.length > 0;

  const handleMobileSelect = (id: string) => {
    handleSelectUser(id);
    setMobileShowChat(true);
  };
  const handleMobileGroupSelect = (id: string) => {
    handleSelectGroup(id);
    setMobileShowChat(true);
  };
  const handleMobileBack = () => {
    setMobileShowChat(false);
    setSelectedUserId("");
    setSelectedGroupId("");
  };

  const hasConversation = Boolean(selectedUserId || selectedGroupId);

  return (
    <div className="flex h-[calc(95vh-5rem)] overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <ContactsPanel
        mobileShowChat={mobileShowChat}
        users={allUsers}
        groups={groups}
        onlineUserIds={onlineUserIds}
        selectedUserId={selectedUserId}
        selectedGroupId={selectedGroupId}
        currentUserId={currentUserId}
        lastMessages={lastMessages}
        lastGroupMessages={lastGroupMessages}
        unreadCounts={unreadCounts}
        onSelectUser={handleMobileSelect}
        onSelectGroup={handleMobileGroupSelect}
        onNewGroup={() => setShowCreateGroup(true)}
      />

      <div
        className={`${!mobileShowChat ? "hidden" : "flex"} relative min-w-0 flex-1 flex-col overflow-hidden md:flex`}
      >
        {!hasConversation ? (
          <EmptyState />
        ) : (
          <>
            <ChatHeader
              menuButtonRef={menuButtonRef}
              menuRef={menuRef}
              selectedUserName={selectedUser?.name ?? ""}
              profileImage={selectedUser?.profileImage ?? null}
              isSelectedOnline={isSelectedOnline}
              showTyping={showTyping}
              isGroup={!!selectedGroupId}
              groupName={selectedGroup?.name ?? ""}
              groupImage={selectedGroup?.groupImage ?? null}
              groupMemberCount={selectedGroup?.members.length ?? 0}
              groupTypingNames={groupTypingNames}
              onGroupInfoClick={() => setGroupInfoOpen(true)}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              onMobileBack={handleMobileBack}
              onWallpaperClick={() => setWallpaperSidebarOpen(true)}
              onClearChatClick={() => setClearChatConfirm(true)}
            />

            <div className="flex flex-1 overflow-hidden">
              <ChatMessagesList
                messages={messages}
                currentUserId={currentUserId}
                wallpaper={wallpaper}
                highlightedMsgId={highlightedMsgId}
                messageContainerRef={messageContainerRef}
                messagesEndRef={messagesEndRef}
                showTyping={showTyping || showGroupTyping}
                typingUserName={
                  selectedGroupId
                    ? groupTypingNames.slice(0, 2).join(", ")
                    : (selectedUser?.name ?? "")
                }
                isGroup={!!selectedGroupId}
                onCopyText={handleCopy}
                onReply={handleReply}
                onDeleteMsg={handleDeleteMsg}
                onEditMsg={handleEditMsg}
                onPickReaction={openReactionPicker}
                onToggleReaction={toggleReactionOnMessage}
                onPreview={setPreviewFile}
                onScrollToReply={handleScrollToReply}
              />

              {groupInfoOpen && selectedGroup && (
                <GroupInfoDrawer
                  group={selectedGroup}
                  currentUserId={currentUserId}
                  onClose={() => setGroupInfoOpen(false)}
                  onLeave={handleLeaveGroup}
                  onDelete={handleDeleteGroup}
                  onRemoveMember={handleRemoveGroupMember}
                  onUpdateGroup={handleUpdateGroup}
                />
              )}
            </div>

            <ChatComposer
              messageInput={messageInput}
              setMessageInput={setMessageInput}
              pendingFiles={pendingFiles}
              setPendingFiles={setPendingFiles}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              editTarget={editTarget}
              setEditTarget={setEditTarget}
              selectedUserDisplayName={selectedUser?.name ?? selectedGroup?.name}
              currentUserId={currentUserId}
              availableUsers={allUsers}
              onMentionAdd={handleMentionAdd}
              fileInputRef={fileInputRef}
              emojiButtonRef={emojiButtonRef}
              emojiPickerRef={emojiPickerRef}
              inputRef={inputRef}
              emojiOpen={emojiOpen}
              setEmojiOpen={setEmojiOpen}
              onSend={handleSend}
              onFileChange={handleFileSelect}
              onInputChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onEmojiSelect={handleEmojiSelect}
            />
          </>
        )}

        <ChatWallpaperDrawer
          open={wallpaperSidebarOpen}
          wallpaper={wallpaper}
          setWallpaper={setWallpaper}
          onClose={() => setWallpaperSidebarOpen(false)}
        />
      </div>

      {previewFile && <FilePreviewModal att={previewFile} onClose={() => setPreviewFile(null)} />}

      {clearChatConfirm && (
        <ClearChatConfirmModal
          peerName={selectedGroup?.name ?? selectedUser?.name}
          onConfirm={handleClearChat}
          onCancel={() => setClearChatConfirm(false)}
        />
      )}

      {deleteTarget && (
        <DeleteMessageModal
          onDeleteEveryone={() => void handleConfirmDelete("everyone")}
          onDeleteForMe={() => void handleConfirmDelete("me")}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      <ChatReactionPickerPortal
        reactionPicker={reactionPicker}
        reactionPickerMessageRef={reactionPickerMessageRef}
        onDismiss={() => {
          reactionPickerMessageRef.current = null;
          setReactionPicker(null);
        }}
        onSelectEmoji={handleConfirmReactionPick}
      />

      {showCreateGroup && (
        <CreateGroupModal
          users={allUsers}
          currentUserId={currentUserId}
          onlineUserIds={onlineUserIds}
          onClose={() => setShowCreateGroup(false)}
          onCreateGroup={handleCreateGroup}
        />
      )}
    </div>
  );
};

export default Chat;
