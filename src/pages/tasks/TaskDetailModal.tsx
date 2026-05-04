import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Square,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Task, TaskStatus, TaskComment, TaskAttachment } from "../../types/task.types";
import {
  useUpdateTask,
  useTaskById,
  useAddComment,
  useDeleteComment,
  useAddAttachment,
  useDeleteAttachment,
} from "../../apis/api/tasks";
import { useAssignableUsers } from "../../apis/api/auth";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import { ApiError } from "../../apis/apiService";
import { TASK_STATUS_OPTIONS, taskStatusSelectClass } from "../../constants/taskStatus";
import { taskAssigneeName, taskProjectName } from "./taskUtils";

const PRIORITY_SELECT_CLASS: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-900 border-emerald-200 focus:border-emerald-300 focus:ring-emerald-500/20",
  medium:
    "bg-amber-50 text-amber-900 border-amber-200 focus:border-amber-300 focus:ring-amber-500/20",
  urgent: "bg-red-50 text-red-900 border-red-200 focus:border-red-300 focus:ring-red-500/20",
};

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-emerald-50 text-emerald-700 ring-emerald-200/80",
  medium: "bg-amber-50 text-amber-700 ring-amber-200/80",
  urgent: "bg-red-50 text-red-700 ring-red-200/80",
};

function fmt(d?: string | null) {
  if (!d) return null;
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(d));
  } catch {
    return null;
  }
}

function formatMinutes(mins: number | null | undefined): string {
  if (!mins) return "—";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type PreviewKind = "image" | "video" | "pdf" | "other";

function getPreviewKind(mimetype: string, filename: string): PreviewKind {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype === "application/pdf") return "pdf";
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"].includes(ext ?? ""))
    return "image";
  if (["mp4", "webm", "ogg", "mov", "mkv"].includes(ext ?? "")) return "video";
  if (ext === "pdf") return "pdf";
  return "other";
}

function FilePreviewModal({
  attachments,
  startIndex,
  onClose,
}: {
  attachments: TaskAttachment[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [visible, setVisible] = useState(false);
  const total = attachments.length;
  const a = attachments[index];
  const kind = getPreviewKind(a.mimetype, a.filename);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, total]);

  return createPortal(
    <div
      className={`fixed inset-0 z-[400] flex flex-col transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Toolbar */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-black/60 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-white">{a.filename}</p>
          <p className="text-xs text-white/50">{formatFileSize(a.size)}</p>
        </div>
        <a
          href={a.url}
          download={a.filename}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
        <a
          href={a.url}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview area */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden p-4">
        {kind === "image" && (
          <img
            key={a._id}
            src={a.url}
            alt={a.filename}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl transition-all duration-200"
            style={{ animation: "previewPop 220ms cubic-bezier(0.22,1,0.36,1) both" }}
          />
        )}
        {kind === "video" && (
          <video
            key={a._id}
            src={a.url}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-xl shadow-2xl"
            style={{ animation: "previewPop 220ms cubic-bezier(0.22,1,0.36,1) both" }}
          />
        )}
        {kind === "pdf" && (
          <iframe
            key={a._id}
            src={a.url}
            title={a.filename}
            className="h-[80vh] w-full max-w-4xl rounded-xl border-0 shadow-2xl"
            style={{ animation: "previewPop 220ms cubic-bezier(0.22,1,0.36,1) both" }}
          />
        )}
        {kind === "other" && (
          <div
            className="flex flex-col items-center gap-4 rounded-2xl bg-white/10 px-12 py-10 text-center backdrop-blur"
            style={{ animation: "previewPop 220ms cubic-bezier(0.22,1,0.36,1) both" }}
          >
            <FileText className="h-16 w-16 text-white/40" />
            <p className="text-base font-medium text-white">{a.filename}</p>
            <p className="text-sm text-white/60">{formatFileSize(a.size)}</p>
            <a
              href={a.url}
              download={a.filename}
              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow hover:bg-gray-100 transition"
            >
              <Download className="h-4 w-4" />
              Download file
            </a>
          </div>
        )}
      </div>

      {/* Prev / Next arrows */}
      {total > 1 && (
        <>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => setIndex((i) => i - 1)}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 hover:bg-black/70 disabled:opacity-30 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            disabled={index === total - 1}
            onClick={() => setIndex((i) => i + 1)}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white/80 hover:bg-black/70 disabled:opacity-30 transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Thumbnail strip */}
          <div className="relative z-10 flex items-center justify-center gap-2 border-t border-white/10 bg-black/60 px-4 py-2 overflow-x-auto">
            {attachments.map((att, i) => {
              const k = getPreviewKind(att.mimetype, att.filename);
              return (
                <button
                  key={att._id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`shrink-0 rounded-lg overflow-hidden border-2 transition ${
                    i === index
                      ? "border-violet-400 opacity-100"
                      : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  {k === "image" ? (
                    <img src={att.url} alt={att.filename} className="h-10 w-14 object-cover" />
                  ) : (
                    <div className="flex h-10 w-14 items-center justify-center bg-white/10">
                      {k === "video" ? (
                        <span className="text-[9px] font-bold text-white/70 uppercase">Video</span>
                      ) : k === "pdf" ? (
                        <span className="text-[9px] font-bold text-white/70 uppercase">PDF</span>
                      ) : (
                        <FileText className="h-4 w-4 text-white/50" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes previewPop {
          from { transform: scale(0.92); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>,
    document.body
  );
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  projectOptions?: { label: string; value: string }[];
}

export function TaskDetailModal({
  task,
  isOpen,
  onClose,
  currentUserId,
  projectOptions,
}: TaskDetailModalProps) {
  const updateMut = useUpdateTask();
  const addCommentMut = useAddComment();
  const deleteCommentMut = useDeleteComment();
  const addAttachmentMut = useAddAttachment();
  const deleteAttachmentMut = useDeleteAttachment();
  const { activeMode } = useActiveOrg();
  const { data: users = [] } = useAssignableUsers(activeMode);

  // Fetch full task with comments/attachments
  const { data: fullTask } = useTaskById(isOpen && task ? task._id : null);
  const activeTask = fullTask || task;

  const [rendered, setRendered] = useState(false);
  const [visible, setVisible] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Subtask input
  const [newSubtask, setNewSubtask] = useState("");
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);

  // Comment input
  const [commentText, setCommentText] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);

  // Time inputs
  const [editingTime, setEditingTime] = useState(false);
  const [timeEstimateInput, setTimeEstimateInput] = useState("");
  const [timeLoggedInput, setTimeLoggedInput] = useState("");

  // Tab
  const [activeTab, setActiveTab] = useState<"subtasks" | "comments" | "attachments">("subtasks");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const EXIT_MS = 200;

  useEffect(() => {
    if (isOpen && task) {
      setTitle(task.taskName);
      setDescription(task.description ?? "");
      setEditingTitle(false);
      setEditingDesc(false);
      setSaving(null);
      setNewSubtask("");
      setShowSubtaskInput(false);
      setCommentText("");
      setSelectedMentions([]);
      setEditingTime(false);
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
    const t = window.setTimeout(() => setRendered(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [isOpen, task]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);
  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!rendered || !activeTask) return null;

  const save = async (field: string, body: Record<string, unknown>) => {
    setSaving(field);
    try {
      await updateMut.mutateAsync({
        id: activeTask._id,
        body: body as Parameters<typeof updateMut.mutateAsync>[0]["body"],
      });
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not update task");
    } finally {
      setSaving(null);
    }
  };

  const handleTitleBlur = () => {
    setEditingTitle(false);
    const trimmed = title.trim();
    if (!trimmed || trimmed === activeTask.taskName) return;
    save("title", { taskName: trimmed });
  };

  const handleDescBlur = () => {
    setEditingDesc(false);
    if (description === (activeTask.description ?? "")) return;
    save("description", { description: description.trim() || undefined });
  };

  // Subtask handlers
  const subtasks = activeTask.subtasks || [];

  const handleAddSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    const updated = [...subtasks, { title: trimmed, completed: false, order: subtasks.length }];
    save("subtasks", { subtasks: updated });
    setNewSubtask("");
  };

  const handleToggleSubtask = (idx: number) => {
    const updated = subtasks.map((s, i) => (i === idx ? { ...s, completed: !s.completed } : s));
    save("subtasks", { subtasks: updated });
  };

  const handleDeleteSubtask = (idx: number) => {
    const updated = subtasks.filter((_, i) => i !== idx);
    save("subtasks", { subtasks: updated });
  };

  // Comment handlers
  const comments = activeTask.comments || [];

  const handleAddComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    // Extract @mentions from text
    const mentionRegex = /@(\w+)/g;
    const mentionNames = [...trimmed.matchAll(mentionRegex)].map((m) => m[1].toLowerCase());
    const mentionIds = users
      .filter((u) => mentionNames.some((name) => u.name.toLowerCase().includes(name)))
      .map((u) => u._id);

    const allMentions = [...new Set([...selectedMentions, ...mentionIds])];

    try {
      await addCommentMut.mutateAsync({
        taskId: activeTask._id,
        text: trimmed,
        mentions: allMentions,
      });
      setCommentText("");
      setSelectedMentions([]);
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not add comment");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCommentMut.mutateAsync({ taskId: activeTask._id, commentId });
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not delete comment");
    }
  };

  const handleCommentKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
    // Detect @mention
    const val = (e.target as HTMLTextAreaElement).value;
    const lastAt = val.lastIndexOf("@");
    if (lastAt >= 0) {
      const afterAt = val.slice(lastAt + 1);
      if (!afterAt.includes(" ")) {
        setMentionSearch(afterAt.toLowerCase());
        setShowMentionDropdown(true);
        return;
      }
    }
    setShowMentionDropdown(false);
  };

  const insertMention = (userName: string, userId: string) => {
    const lastAt = commentText.lastIndexOf("@");
    if (lastAt >= 0) {
      setCommentText(commentText.slice(0, lastAt) + `@${userName} `);
    }
    setSelectedMentions((prev) => [...new Set([...prev, userId])]);
    setShowMentionDropdown(false);
  };

  // Attachment handlers
  const attachments = activeTask.attachments || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await addAttachmentMut.mutateAsync({ taskId: activeTask._id, file });
      toast.success("File attached");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not upload file");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachmentMut.mutateAsync({ taskId: activeTask._id, attachmentId });
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not delete attachment");
    }
  };

  // Time handlers
  const handleSaveTime = () => {
    const est = timeEstimateInput ? Number(timeEstimateInput) : null;
    const logged = timeLoggedInput ? Number(timeLoggedInput) : undefined;
    save("time", {
      ...(est !== null ? { timeEstimate: est } : { timeEstimate: null }),
      ...(logged !== undefined ? { timeLogged: logged } : {}),
    });
    setEditingTime(false);
  };

  const assignee = taskAssigneeName(activeTask, currentUserId);
  const projectName = taskProjectName(activeTask);
  const isBusy = saving !== null;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;

  const filteredMentionUsers = showMentionDropdown
    ? users.filter((u) => u.name.toLowerCase().includes(mentionSearch)).slice(0, 6)
    : [];

  const modal = createPortal(
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-[0.98] opacity-0"
        }`}
        style={{ maxHeight: "min(92dvh, 780px)" }}
      >
        {/* Header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FolderOpen className="h-4 w-4 text-gray-400" />
            <span className="font-medium">{projectName}</span>
            {activeTask.archived && (
              <span className="ml-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 ring-1 ring-gray-200">
                Archived
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => save("archived", { archived: !activeTask.archived })}
              disabled={isBusy}
              title={activeTask.archived ? "Restore task" : "Archive task"}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50"
            >
              {saving === "archived" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : activeTask.archived ? (
                <ArchiveRestore className="h-3.5 w-3.5" />
              ) : (
                <Archive className="h-3.5 w-3.5" />
              )}
              {activeTask.archived ? "Restore" : "Archive"}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1">
          {/* Left: main content */}
          <div className="flex flex-1 flex-col overflow-y-auto px-6 py-5">
            {/* Priority badge */}
            <span
              className={`mb-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                PRIORITY_BADGE[activeTask.priority]
              }`}
            >
              {activeTask.priority.charAt(0).toUpperCase() + activeTask.priority.slice(1)} priority
            </span>

            {/* Title */}
            {editingTitle ? (
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleTitleBlur();
                  }
                }}
                rows={2}
                className="w-full resize-none rounded-xl border border-violet-300 bg-violet-50/30 px-3 py-2 text-xl font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
              />
            ) : (
              <h2
                role="button"
                tabIndex={0}
                onClick={() => setEditingTitle(true)}
                onKeyDown={(e) => e.key === "Enter" && setEditingTitle(true)}
                className="group flex cursor-text items-start gap-2 text-xl font-bold leading-snug text-gray-900"
              >
                <span className="flex-1 rounded-xl px-1 py-0.5 group-hover:bg-gray-100/70 transition-colors">
                  {title || activeTask.taskName}
                </span>
                {saving === "title" && (
                  <Loader2 className="mt-1 h-4 w-4 shrink-0 animate-spin text-violet-500" />
                )}
              </h2>
            )}

            {/* Description */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Description
              </p>
              {editingDesc ? (
                <textarea
                  ref={descRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleDescBlur}
                  rows={4}
                  placeholder="Add a description..."
                  className="w-full resize-y rounded-xl border border-violet-300 bg-violet-50/30 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/25"
                />
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingDesc(true)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingDesc(true)}
                  className="group min-h-[4rem] cursor-text rounded-xl border border-transparent px-3 py-2.5 text-sm text-gray-600 transition-colors hover:border-gray-200 hover:bg-gray-50"
                >
                  {activeTask.description?.trim() ? (
                    <span className="whitespace-pre-wrap">{activeTask.description}</span>
                  ) : (
                    <span className="italic text-gray-400">Click to add a description...</span>
                  )}
                  {saving === "description" && (
                    <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-violet-500" />
                  )}
                </div>
              )}
            </div>

            {/* Tabs: Subtasks / Comments / Attachments */}
            <div className="mt-5 border-t border-gray-100 pt-4">
              <div className="flex gap-1 rounded-lg bg-gray-100 p-1 mb-4">
                {(
                  [
                    {
                      key: "subtasks" as const,
                      label: "Subtasks",
                      icon: <CheckSquare className="h-3.5 w-3.5" />,
                      count: subtasks.length,
                    },
                    {
                      key: "comments" as const,
                      label: "Comments",
                      icon: <MessageSquare className="h-3.5 w-3.5" />,
                      count: comments.length,
                    },
                    {
                      key: "attachments" as const,
                      label: "Files",
                      icon: <Paperclip className="h-3.5 w-3.5" />,
                      count: attachments.length,
                    },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      activeTab === tab.key
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                    {tab.count > 0 && (
                      <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Subtasks tab */}
              {activeTab === "subtasks" && (
                <div className="space-y-2">
                  {subtasks.length > 0 && (
                    <div className="mb-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{
                            width: `${subtasks.length ? (completedSubtasks / subtasks.length) * 100 : 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {completedSubtasks}/{subtasks.length}
                      </span>
                    </div>
                  )}

                  {subtasks.map((st, idx) => (
                    <div key={st._id || idx} className="flex items-center gap-2 group">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(idx)}
                        className="shrink-0 text-gray-400 hover:text-violet-600"
                      >
                        {st.completed ? (
                          <CheckSquare className="h-4 w-4 text-violet-600" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${st.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                      >
                        {st.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteSubtask(idx)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}

                  {showSubtaskInput ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSubtask}
                        onChange={(e) => setNewSubtask(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubtask();
                          if (e.key === "Escape") {
                            setShowSubtaskInput(false);
                            setNewSubtask("");
                          }
                        }}
                        placeholder="Subtask title..."
                        autoFocus
                        className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubtask}
                        disabled={!newSubtask.trim()}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSubtaskInput(true)}
                      className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add subtask
                    </button>
                  )}
                </div>
              )}

              {/* Comments tab */}
              {activeTab === "comments" && (
                <div className="space-y-3">
                  <div className="max-h-[220px] overflow-y-auto space-y-3">
                    {comments.length === 0 && (
                      <p className="text-xs text-gray-400 italic">No comments yet</p>
                    )}
                    {comments.map((c: TaskComment) => {
                      const authorObj = typeof c.author === "object" ? c.author : null;
                      const authorName = authorObj?.name || "Unknown";
                      const isOwn = authorObj?._id === currentUserId;
                      return (
                        <div key={c._id} className="group flex gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                            {authorName.charAt(0).toUpperCase()}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-800">
                                {authorName}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {timeAgo(c.createdAt)}
                              </span>
                              {isOwn && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c._id)}
                                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                              {c.text}
                            </p>
                            {Array.isArray(c.mentions) && c.mentions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {c.mentions.map((m) => {
                                  const mObj = typeof m === "object" ? m : null;
                                  return mObj ? (
                                    <span
                                      key={mObj._id}
                                      className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full"
                                    >
                                      @{mObj.name}
                                    </span>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comment input */}
                  <div className="relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={handleCommentKeyDown}
                      placeholder="Write a comment... Use @name to mention"
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!commentText.trim() || addCommentMut.isPending}
                      className="absolute bottom-2.5 right-2.5 rounded-lg bg-violet-600 p-1.5 text-white hover:bg-violet-700 disabled:opacity-50"
                    >
                      {addCommentMut.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                    </button>

                    {/* Mention dropdown */}
                    {showMentionDropdown && filteredMentionUsers.length > 0 && (
                      <div className="absolute bottom-full left-0 mb-1 w-56 rounded-lg border border-gray-100 bg-white shadow-lg max-h-40 overflow-y-auto z-10">
                        {filteredMentionUsers.map((u) => (
                          <button
                            key={u._id}
                            type="button"
                            onClick={() => insertMention(u.name, u._id)}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-violet-50 flex items-center gap-2"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-semibold text-violet-700">
                              {u.name.charAt(0).toUpperCase()}
                            </span>
                            <span className="truncate">{u.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Attachments tab */}
              {activeTab === "attachments" && (
                <div className="space-y-2">
                  {attachments.length === 0 && (
                    <p className="text-xs text-gray-400 italic">No files attached</p>
                  )}
                  {attachments.map((a: TaskAttachment, idx: number) => {
                    const kind = getPreviewKind(a.mimetype, a.filename);
                    return (
                      <div
                        key={a._id}
                        className="flex items-center gap-3 group rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setPreviewIndex(idx)}
                      >
                        {/* Thumbnail / icon */}
                        <div className="shrink-0">
                          {kind === "image" ? (
                            <img
                              src={a.url}
                              alt={a.filename}
                              className="h-9 w-12 rounded-md object-cover border border-gray-100"
                            />
                          ) : kind === "video" ? (
                            <div className="flex h-9 w-12 items-center justify-center rounded-md bg-violet-50 border border-violet-100">
                              <span className="text-[9px] font-bold text-violet-500 uppercase">
                                Video
                              </span>
                            </div>
                          ) : kind === "pdf" ? (
                            <div className="flex h-9 w-12 items-center justify-center rounded-md bg-red-50 border border-red-100">
                              <span className="text-[9px] font-bold text-red-500 uppercase">
                                PDF
                              </span>
                            </div>
                          ) : (
                            <div className="flex h-9 w-12 items-center justify-center rounded-md bg-gray-50 border border-gray-100">
                              <FileText className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">{a.filename}</p>
                          <p className="text-[10px] text-gray-400">{formatFileSize(a.size)}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <a
                            href={a.url}
                            download={a.filename}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded p-1 text-gray-400 hover:text-gray-600"
                            title="Download"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAttachment(a._id);
                            }}
                            className="rounded p-1 text-gray-400 hover:text-red-500 transition"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={addAttachmentMut.isPending}
                    className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    {addAttachmentMut.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    Attach file
                  </button>
                </div>
              )}
            </div>

            {/* Timestamps */}
            {(activeTask.createdAt || activeTask.updatedAt) && (
              <div className="mt-6 flex flex-col gap-0.5 text-[11px] text-gray-400">
                {activeTask.createdAt && <span>Created {fmt(activeTask.createdAt)}</span>}
                {activeTask.updatedAt && <span>Updated {fmt(activeTask.updatedAt)}</span>}
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="flex w-56 shrink-0 flex-col gap-5 overflow-y-auto border-l border-gray-100 bg-gray-50/50 px-4 py-5">

          {/* Project */}
          {projectOptions && projectOptions.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Project
                </p>
                <div className="relative">
                  <select
                    value={
                      typeof activeTask.project === "object"
                        ? ((activeTask.project as { _id: string } | null)?._id ?? "")
                        : ((activeTask.project as string | null | undefined) ?? "")
                    }
                    disabled={isBusy}
                    onChange={(e) => save("project", { project: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
                  >
                    {projectOptions.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  {saving === "project" && (
                    <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-violet-500" />
                  )}
                </div>
              </div>
            )}
            
            {/* Status */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Status
              </p>
              <div className="relative">
                <select
                  value={activeTask.status}
                  disabled={isBusy}
                  onChange={(e) => save("status", { status: e.target.value as TaskStatus })}
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 disabled:opacity-60 ${taskStatusSelectClass(activeTask.status)}`}
                >
                  {TASK_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {saving === "status" && (
                  <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-violet-500" />
                )}
              </div>
            </div>

            {/* Priority */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Priority
              </p>
              <div className="relative">
                <select
                  value={activeTask.priority}
                  disabled={isBusy}
                  onChange={(e) =>
                    save("priority", {
                      priority: e.target.value as Task["priority"],
                    })
                  }
                  className={`w-full rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 disabled:opacity-60 ${
                    PRIORITY_SELECT_CLASS[activeTask.priority]
                  }`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="urgent">Urgent</option>
                </select>
                {saving === "priority" && (
                  <Loader2 className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-violet-500" />
                )}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Assignee
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  <UserRound className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-medium">{assignee}</span>
              </div>
            </div>

            {/* Due date */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Due date
              </p>
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                <input
                  type="date"
                  key={activeTask.dueDate ?? "no-due"}
                  defaultValue={activeTask.dueDate ? activeTask.dueDate.substring(0, 10) : ""}
                  disabled={isBusy}
                  onChange={(e) =>
                    save("dueDate", {
                      dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Time Estimate & Logged */}
            <div>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Time
              </p>
              {editingTime ? (
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] text-gray-500">Estimate (min)</label>
                    <input
                      type="number"
                      value={timeEstimateInput}
                      onChange={(e) => setTimeEstimateInput(e.target.value)}
                      placeholder="e.g. 120"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500">Logged (min)</label>
                    <input
                      type="number"
                      value={timeLoggedInput}
                      onChange={(e) => setTimeLoggedInput(e.target.value)}
                      placeholder="e.g. 60"
                      className="w-full rounded-lg border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={handleSaveTime}
                      className="rounded-md bg-violet-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-violet-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTime(false)}
                      className="rounded-md border border-gray-200 px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setTimeEstimateInput(activeTask.timeEstimate?.toString() || "");
                    setTimeLoggedInput(activeTask.timeLogged?.toString() || "");
                    setEditingTime(true);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && setEditingTime(true)}
                  className="cursor-pointer rounded-lg border border-transparent px-2 py-1.5 text-xs text-gray-600 hover:border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    <div>
                      <div>Est: {formatMinutes(activeTask.timeEstimate)}</div>
                      <div>Log: {formatMinutes(activeTask.timeLogged)}</div>
                    </div>
                  </div>
                  {saving === "time" && (
                    <Loader2 className="ml-1 inline h-3 w-3 animate-spin text-violet-500" />
                  )}
                </div>
              )}
            </div>

            

            {/* Template badge */}
            {activeTask.templateName && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Template
                </p>
                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                  {activeTask.templateName}
                </span>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      {modal}
      {previewIndex !== null && (attachments as TaskAttachment[]).length > 0 && (
        <FilePreviewModal
          attachments={attachments as TaskAttachment[]}
          startIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </>
  );
}
