import { useState } from "react";
import { Megaphone, Pin, PinOff, Plus, Trash2, CheckCheck, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import {
  useAnnouncements,
  useCreateAnnouncement,
  useUpdateAnnouncement,
  useMarkAnnouncementRead,
  usePinAnnouncement,
  useDeleteAnnouncement,
} from "../../apis/api/announcements";
import { getUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/auth";
import type { Announcement } from "../../types/announcement.types";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { ApiError } from "../../apis/apiService";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type FormState = { title: string; content: string; isPinned: boolean };

export default function Announcements() {
  const userId = getUserId();
  const { data: user } = getUserById(userId);
  const roles = user?.role ?? [];
  const canManage = roles.some((r: string) => ["admin", "hr", "super-admin"].includes(r));

  const { data: announcements = [], isLoading } = useAnnouncements();
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const markReadMutation = useMarkAnnouncementRead();
  const pinMutation = usePinAnnouncement();
  const deleteMutation = useDeleteAnnouncement();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Announcement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [form, setForm] = useState<FormState>({
    title: "",
    content: "",
    isPinned: false,
  });

  const openCreate = () => {
    setForm({ title: "", content: "", isPinned: false });
    setCreateOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setForm({ title: a.title, content: a.content, isPinned: a.isPinned });
    setEditTarget(a);
  };

  const closeModals = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setDeleteTarget(null);
  };

  const handleSubmitCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      toast.success("Announcement posted");
      closeModals();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to post");
    }
  };

  const handleSubmitEdit = async () => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget._id, body: form });
      toast.success("Updated");
      closeModals();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to update");
    }
  };

  const handleMarkRead = async (a: Announcement) => {
    if (a.isRead) return;
    try {
      await markReadMutation.mutateAsync(a._id);
    } catch {
      // silent
    }
  };

  const handlePin = async (a: Announcement) => {
    try {
      await pinMutation.mutateAsync({ id: a._id, isPinned: !a.isPinned });
      toast.success(a.isPinned ? "Unpinned" : "Pinned");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast.success("Deleted");
      closeModals();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to delete");
    }
  };

  const unreadCount = announcements.filter((a) => !a.isRead).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-violet-600" />
            Announcements
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Company-wide updates and notices.
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
        {canManage && (
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            New announcement
          </Button>
        )}
      </div>

      {/* Feed */}
      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <Megaphone className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No announcements yet</p>
          </div>
        ) : (
          announcements.map((a) => (
            <AnnouncementCard
              key={a._id}
              announcement={a}
              canManage={canManage}
              onMarkRead={() => handleMarkRead(a)}
              onPin={() => handlePin(a)}
              onEdit={() => openEdit(a)}
              onDelete={() => setDeleteTarget(a)}
            />
          ))
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createOpen}
        onClose={closeModals}
        title="New announcement"
        panelClassName="max-w-lg"
      >
        <AnnouncementForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmitCreate}
          onCancel={closeModals}
          loading={createMutation.isPending}
          submitLabel="Post"
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editTarget}
        onClose={closeModals}
        title="Edit announcement"
        panelClassName="max-w-lg"
      >
        <AnnouncementForm
          form={form}
          setForm={setForm}
          onSubmit={handleSubmitEdit}
          onCancel={closeModals}
          loading={updateMutation.isPending}
          submitLabel="Save"
        />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={!!deleteTarget} onClose={closeModals} title="Delete announcement">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-medium">"{deleteTarget?.title}"</span>? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeModals}>
            Cancel
          </Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function AnnouncementCard({
  announcement: a,
  canManage,
  onMarkRead,
  onPin,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  canManage: boolean;
  onMarkRead: () => void;
  onPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={[
        "relative rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md",
        a.isPinned ? "border-violet-300 ring-1 ring-violet-200" : "border-gray-200",
        !a.isRead ? "border-l-4 border-l-violet-500" : "",
      ].join(" ")}
    >
      {a.isPinned && (
        <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
          <Pin className="h-3 w-3" />
          Pinned
        </span>
      )}

      <div className="flex items-start justify-between gap-3 pr-16">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-gray-900">{a.title}</h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {a.postedBy?.name ?? "Admin"} · {formatDate(a.createdAt)}
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-line text-sm text-gray-700 leading-relaxed">{a.content}</p>

      <div className="mt-4 flex items-center gap-2">
        {!a.isRead && (
          <button
            onClick={onMarkRead}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark as read
          </button>
        )}
        {a.isRead && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
            <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
            Read
          </span>
        )}

        {canManage && (
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={onPin}
              title={a.isPinned ? "Unpin" : "Pin"}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              {a.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
            </button>
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
        placeholder="Announcement title"
        required
      />
      <Input
        label="Content"
        name="content"
        type="textarea"
        value={form.content}
        onChange={(e) => setForm((s) => ({ ...s, content: e.target.value }))}
        placeholder="Write your announcement…"
        required
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPinned}
          onChange={(e) => setForm((s) => ({ ...s, isPinned: e.target.checked }))}
          className="h-4 w-4 rounded border-gray-300 text-violet-600"
        />
        Pin this announcement
      </label>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button loading={loading} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
