import { useEffect, useState, type ChangeEvent } from "react";
import toast from "react-hot-toast";
import { Camera, Search, Users, X } from "lucide-react";
import { uploadChatFileApi } from "../../apis/api/chat";
import type { User } from "../../types/user.types";
import { Avatar } from "./Avatar";

type CreateGroupModalProps = {
  users: User[];
  currentUserId: string;
  onlineUserIds: Set<string>;
  onClose: () => void;
  onCreateGroup: (
    name: string,
    description: string,
    memberIds: string[],
    groupImage?: string | null
  ) => Promise<void>;
};

export function CreateGroupModal({
  users,
  currentUserId,
  onlineUserIds,
  onClose,
  onCreateGroup,
}: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [groupImageFile, setGroupImageFile] = useState<File | null>(null);
  const [groupImagePreview, setGroupImagePreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (groupImagePreview) URL.revokeObjectURL(groupImagePreview);
    };
  }, [groupImagePreview]);

  const onGroupPhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setGroupImageFile(file);
    setGroupImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const clearGroupPhoto = () => {
    setGroupImageFile(null);
    setGroupImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const available = users.filter(
    (u) =>
      u._id !== currentUserId &&
      u.isActive &&
      (search.trim() === "" ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleUser = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedUsers = users.filter((u) => selectedIds.has(u._id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedIds.size === 0) return;
    setLoading(true);
    try {
      let groupImageUrl: string | undefined;
      if (groupImageFile) {
        const up = await uploadChatFileApi(groupImageFile);
        if (!up.success || !up.data?.url) {
          toast.error("Failed to upload group photo");
          return;
        }
        groupImageUrl = up.data.url;
      }
      await onCreateGroup(name.trim(), description.trim(), [...selectedIds], groupImageUrl);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900">New Group</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-5 py-4">
            <div className="flex flex-col items-center gap-2">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onGroupPhotoChange}
                />
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-violet-100 ring-2 ring-violet-200/80 transition hover:ring-violet-400">
                  {groupImagePreview ? (
                    <img src={groupImagePreview} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-violet-600" />
                  )}
                  <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-white shadow">
                    <Camera className="h-3 w-3" />
                  </span>
                </div>
              </label>
              <span className="text-[11px] text-gray-400">Group photo (optional)</span>
              {groupImagePreview && (
                <button
                  type="button"
                  onClick={clearGroupPhoto}
                  className="text-[11px] font-medium text-red-500 hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>

            {/* Group name */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Design Team"
                maxLength={100}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Description <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this group about?"
                maxLength={300}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
              />
            </div>

            {/* Selected members chips */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedUsers.map((u) => (
                  <span
                    key={u._id}
                    className="flex items-center gap-1.5 rounded-full bg-violet-100 py-1 pl-2.5 pr-1.5 text-xs font-medium text-violet-700"
                  >
                    {u.name}
                    <button
                      type="button"
                      onClick={() => toggleUser(u._id)}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-200 hover:bg-violet-300"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Member search */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Add Members <span className="text-red-500">*</span>
              </label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search people..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-500/20"
                />
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-100">
                {available.length === 0 ? (
                  <p className="px-4 py-3 text-center text-xs text-gray-400">No users found</p>
                ) : (
                  available.map((user) => {
                    const isSelected = selectedIds.has(user._id);
                    const isOnline = onlineUserIds.has(user._id);
                    return (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => toggleUser(user._id)}
                        className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                          isSelected ? "bg-violet-50" : "hover:bg-gray-50"
                        }`}
                      >
                        <Avatar name={user.name} image={user.profileImage} online={isOnline} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-800">{user.name}</p>
                          <p className="truncate text-xs text-gray-400">{user.role?.[0] ?? ""}</p>
                        </div>
                        <div
                          className={`h-5 w-5 shrink-0 rounded-full border-2 transition ${
                            isSelected
                              ? "border-violet-600 bg-violet-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <svg viewBox="0 0 10 10" fill="none" className="h-full w-full p-0.5">
                              <path
                                d="M1.5 5l2.5 2.5 4.5-4.5"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedIds.size === 0 || loading}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
