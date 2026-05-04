import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Camera,
  Check,
  ImageOff,
  LogOut,
  Pencil,
  Shield,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";
import type { ChatGroup } from "../../types/chat.types";
import { uploadChatFileApi } from "../../apis/api/chat";
import { Avatar } from "./Avatar";

type GroupInfoDrawerProps = {
  group: ChatGroup;
  currentUserId: string;
  onClose: () => void;
  onLeave: () => void;
  onDelete: () => void;
  onRemoveMember: (memberId: string) => void;
  onUpdateGroup: (payload: {
    name?: string;
    description?: string;
    groupImage?: string | null;
  }) => Promise<void>;
};

export function GroupInfoDrawer({
  group,
  currentUserId,
  onClose,
  onLeave,
  onDelete,
  onRemoveMember,
  onUpdateGroup,
}: GroupInfoDrawerProps) {
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDetails, setEditingDetails] = useState(false);
  const [draftName, setDraftName] = useState(group.name);
  const [draftDescription, setDraftDescription] = useState(group.description ?? "");
  const [savingDetails, setSavingDetails] = useState(false);
  const [imageBusy, setImageBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreator = group.createdBy._id === currentUserId;
  const isAdmin = group.admins.some((a) => a._id === currentUserId);
  const canEdit = isAdmin;

  useEffect(() => {
    setDraftName(group.name);
    setDraftDescription(group.description ?? "");
    setEditingDetails(false);
  }, [group._id, group.name, group.description]);

  const handleSaveDetails = async () => {
    const nameTrim = draftName.trim();
    if (!nameTrim) {
      toast.error("Group name cannot be empty");
      return;
    }
    const nextDesc = draftDescription.trim();
    const prevDesc = (group.description ?? "").trim();
    const payload: { name?: string; description?: string } = {};
    if (nameTrim !== group.name) payload.name = nameTrim;
    if (nextDesc !== prevDesc) payload.description = nextDesc;
    if (Object.keys(payload).length === 0) {
      setEditingDetails(false);
      return;
    }
    setSavingDetails(true);
    try {
      await onUpdateGroup(payload);
      setEditingDetails(false);
    } finally {
      setSavingDetails(false);
    }
  };

  const handleCancelEdit = () => {
    setDraftName(group.name);
    setDraftDescription(group.description ?? "");
    setEditingDetails(false);
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setImageBusy(true);
    try {
      const up = await uploadChatFileApi(file);
      if (!up.success || !up.data?.url) {
        toast.error("Failed to upload image");
        return;
      }
      await onUpdateGroup({ groupImage: up.data.url });
    } catch {
      toast.error("Failed to upload image");
    } finally {
      setImageBusy(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!group.groupImage) return;
    setImageBusy(true);
    try {
      await onUpdateGroup({ groupImage: null });
    } finally {
      setImageBusy(false);
    }
  };

  return (
    <div className="flex h-full w-72 flex-col border-l border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">Group Info</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Group identity */}
        <div className="flex flex-col items-center px-4 py-5">
          <div className="relative mb-3">
            <Avatar name={group.name} image={group.groupImage} shape="rounded" size="lg" />
            {canEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImagePick}
                />
                <button
                  type="button"
                  title="Change group photo"
                  disabled={imageBusy}
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-violet-600 text-white shadow-md transition hover:bg-violet-700 disabled:opacity-50"
                >
                  {imageBusy ? (
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="h-3.5 w-3.5" />
                  )}
                </button>
              </>
            )}
          </div>

          {canEdit && group.groupImage && (
            <button
              type="button"
              disabled={imageBusy}
              onClick={() => void handleRemoveImage()}
              className="mb-2 flex items-center gap-1 text-[11px] font-medium text-red-500 hover:underline disabled:opacity-50"
            >
              <ImageOff className="h-3 w-3" />
              Remove photo
            </button>
          )}

          {canEdit && editingDetails ? (
            <div className="w-full space-y-2">
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                maxLength={100}
                placeholder="Group name"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
              />
              <textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Description (optional)"
                className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-500/15"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={savingDetails}
                  className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveDetails()}
                  disabled={savingDetails}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-violet-600 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                >
                  {savingDetails ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Save
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex w-full max-w-[220px] items-start justify-center gap-1">
                <h2 className="flex-1 text-center text-base font-bold text-gray-900">
                  {group.name}
                </h2>
                {canEdit && (
                  <button
                    type="button"
                    title="Edit name & description"
                    onClick={() => setEditingDetails(true)}
                    className="shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-violet-600"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              {group.description && (
                <p className="mt-1 text-center text-xs text-gray-500">{group.description}</p>
              )}
            </>
          )}

          <p className="mt-2 text-xs text-gray-400">{group.members.length} members</p>
        </div>

        {/* Members list */}
        <div className="px-4 pb-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Members
          </p>
          <div className="space-y-1">
            {group.members.map((member) => {
              const memberIsAdmin = group.admins.some((a) => a._id === member._id);
              const memberIsCreator = group.createdBy._id === member._id;
              const isSelf = member._id === currentUserId;

              return (
                <div
                  key={member._id}
                  className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition hover:bg-gray-50"
                >
                  <Avatar name={member.name} image={member.profileImage} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-800">
                      {member.name}
                      {isSelf && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                    </p>
                    {memberIsCreator ? (
                      <span className="text-[10px] font-medium text-violet-600">Creator</span>
                    ) : memberIsAdmin ? (
                      <span className="text-[10px] font-medium text-amber-600">Admin</span>
                    ) : null}
                  </div>
                  {memberIsAdmin && !memberIsCreator && (
                    <Shield className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                  )}
                  {isAdmin && !isSelf && !memberIsCreator && (
                    <button
                      type="button"
                      title="Remove member"
                      onClick={() => onRemoveMember(member._id)}
                      className="rounded-md p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="space-y-1 border-t border-gray-100 px-4 py-3">
        {!isCreator && (
          <>
            {confirmLeave ? (
              <div className="rounded-xl bg-red-50 p-3">
                <p className="mb-2 text-xs font-medium text-red-700">Leave this group?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmLeave(false)}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onLeave}
                    className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                  >
                    Leave
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Leave Group
              </button>
            )}
          </>
        )}

        {isCreator && (
          <>
            {confirmDelete ? (
              <div className="rounded-xl bg-red-50 p-3">
                <p className="mb-2 text-xs font-medium text-red-700">
                  Delete group and all messages?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete Group
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
