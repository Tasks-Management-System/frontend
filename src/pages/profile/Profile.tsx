import { getUserId } from "../../utils/session";
import { useRef, useState } from "react";
import { MessageSquare, Pencil, Camera, Loader2 } from "lucide-react";
import { useUserById, useUpdateProfileImage, useUpdateUser } from "../../apis/api/auth";
import toast from "react-hot-toast";
import Modal from "../../components/UI/Model";
import { PillTabBar } from "../../components/UI/PillTabBar";
import type { User as UserType } from "../../types/user.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { ProfilePageSkeleton } from "../../components/UI/Skeleton";
import { ProfileLeaveDashboard } from "../../components/leave/MyLeaveSection";
import { PROFILE_PAGE_TABS } from "./profileConstants";
import type { ProfileEditFormState } from "./profileFormTypes";
import { PreviewModalImage, ProfileAvatarFace, ProfileCover } from "./ProfileMedia";
import { ProfileOverviewTab } from "./ProfileOverviewTab";

const Profile = () => {
  const [activeTab, setActiveTab] = useState<string>(PROFILE_PAGE_TABS[0]!.key);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileEditFormState>({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    addressLine: "",
    addressCity: "",
    aadharCardNumber: "",
    panCardNumber: "",
    bankAccountNo: "",
    bankName: "",
    bankIFSC: "",
    bankBranch: "",
    skillsJson: "[]",
    educationJson: "[]",
    experienceJson: "[]",
    leavesJson: "[]",
  });
  const userId = getUserId();
  const { data: user, isLoading } = useUserById(userId);
  const updateImage = useUpdateProfileImage();
  const updateUser = useUpdateUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    if (!user) return;
    setFormData({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      dob: user?.dob?.slice(0, 10) ?? "",
      gender: user?.gender ?? "",
      addressLine: user?.address?.[0]?.address ?? "",
      addressCity: user?.address?.[0]?.city ?? "",
      aadharCardNumber: user?.aadharCardNumber ?? "",
      panCardNumber: user?.panCardNumber ?? "",
      bankAccountNo: user?.bankAccountNo ?? "",
      bankName: user?.bankName ?? "",
      bankIFSC: user?.bankIFSC ?? "",
      bankBranch: user?.bankBranch ?? "",
      skillsJson: (user?.skills ?? [])
        .map((s) => s.skill)
        .filter(Boolean)
        .join(", "),
      educationJson: (user?.education ?? [])
        .map((e) => e.degree)
        .filter(Boolean)
        .join(", "),
      experienceJson: (user?.experience ?? [])
        .map((e) => e.company)
        .filter(Boolean)
        .join(", "),
      leavesJson: (user?.leaves ?? [])
        .map((l) => (typeof l.totalBalance === "number" ? String(l.totalBalance) : ""))
        .filter(Boolean)
        .join(", "),
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    if (!userId) return;
    const payload: Partial<UserType> = {};
    if (formData.name && formData.name !== user?.name) payload.name = formData.name;
    if (formData.email && formData.email !== user?.email) payload.email = formData.email;
    if (formData.phone !== (user?.phone ?? "")) payload.phone = formData.phone || null;
    if (formData.dob !== (user?.dob?.slice(0, 10) ?? "")) payload.dob = formData.dob || null;
    if (formData.gender && formData.gender !== user?.gender)
      payload.gender = formData.gender as UserType["gender"];

    const nextAddress =
      formData.addressLine.trim() || formData.addressCity.trim()
        ? [
            {
              address: formData.addressLine.trim() || undefined,
              city: formData.addressCity.trim() || undefined,
            },
          ]
        : [];
    const prevAddress = user?.address ?? [];
    const prevA0 = prevAddress?.[0] ?? {};
    const nextA0 = nextAddress?.[0] ?? {};
    const addressChanged =
      (prevA0?.address ?? "") !== (nextA0?.address ?? "") ||
      (prevA0?.city ?? "") !== (nextA0?.city ?? "");
    if (addressChanged) payload.address = nextAddress;

    if ((formData.aadharCardNumber ?? "") !== (user?.aadharCardNumber ?? ""))
      payload.aadharCardNumber = formData.aadharCardNumber || undefined;
    if ((formData.panCardNumber ?? "") !== (user?.panCardNumber ?? ""))
      payload.panCardNumber = formData.panCardNumber || undefined;
    if ((formData.bankAccountNo ?? "") !== (user?.bankAccountNo ?? ""))
      payload.bankAccountNo = formData.bankAccountNo || undefined;
    if ((formData.bankName ?? "") !== (user?.bankName ?? ""))
      payload.bankName = formData.bankName || undefined;
    if ((formData.bankIFSC ?? "") !== (user?.bankIFSC ?? ""))
      payload.bankIFSC = formData.bankIFSC || undefined;
    if ((formData.bankBranch ?? "") !== (user?.bankBranch ?? ""))
      payload.bankBranch = formData.bankBranch || undefined;

    try {
      const parseFlexibleList = (raw: string): unknown[] | undefined => {
        const txt = raw.trim();
        if (!txt) return undefined;
        if (txt.startsWith("[")) {
          const parsed = JSON.parse(txt);
          return Array.isArray(parsed) ? parsed : undefined;
        }
        return txt
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      };

      const skillsList = parseFlexibleList(formData.skillsJson);
      if (skillsList) {
        payload.skills =
          skillsList.length && typeof skillsList[0] === "object"
            ? (skillsList as UserType["skills"])
            : (skillsList as string[]).map((skill) => ({ skill }));
      }

      const eduList = parseFlexibleList(formData.educationJson);
      if (eduList) {
        payload.education =
          eduList.length && typeof eduList[0] === "object"
            ? (eduList as UserType["education"])
            : (eduList as string[]).map((degree) => ({ degree }));
      }

      const expList = parseFlexibleList(formData.experienceJson);
      if (expList) {
        payload.experience =
          expList.length && typeof expList[0] === "object"
            ? (expList as UserType["experience"])
            : (expList as string[]).map((company) => ({ company }));
      }

      const leavesList = parseFlexibleList(formData.leavesJson);
      if (leavesList) {
        payload.leaves =
          leavesList.length && typeof leavesList[0] === "object"
            ? (leavesList as UserType["leaves"])
            : (leavesList as string[])
                .map((v) => Number(v))
                .filter((n) => Number.isFinite(n))
                .map((totalBalance) => ({ totalBalance }));
      }
    } catch {
      toast.error(
        "Invalid input for structured details. Use comma-separated text or a valid JSON array."
      );
      return;
    }

    if (Object.keys(payload).length === 0) {
      setIsEditing(false);
      return;
    }

    updateUser.mutate(
      { id: userId, data: payload },
      {
        onSuccess: () => {
          toast.success("Profile updated successfully");
          setIsEditing(false);
        },
        onError: (err) => toast.error(err.message || "Failed to update profile"),
      }
    );
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    updateImage.mutate(
      { id: userId, file },
      {
        onSuccess: () => toast.success("Profile image updated"),
        onError: (err) => toast.error(err.message || "Failed to update image"),
      }
    );
    e.target.value = "";
  };

  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const profileImageUrl = resolveProfileImageUrl(user?.profileImage);

  if (isLoading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-white p-12 text-center shadow-sm text-gray-500">
        Could not load profile.
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-gray-50 p-3 sm:space-y-6 sm:p-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <ProfileCover url={profileImageUrl} />

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-14 flex flex-col items-center gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
            <div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-end sm:gap-5">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => profileImageUrl && setIsPreviewOpen(true)}
                  disabled={!profileImageUrl}
                  className={`relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-linear-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white shadow-lg ring-1 ring-black/5 sm:h-28 sm:w-28 sm:text-3xl md:h-32 md:w-32 ${
                    profileImageUrl
                      ? "cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                      : "cursor-default"
                  }`}
                >
                  <ProfileAvatarFace
                    url={profileImageUrl}
                    alt={user?.name ?? "Profile"}
                    initials={initials ?? "?"}
                  />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateImage.isPending}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:h-9 sm:w-9"
                  aria-label="Change profile photo"
                >
                  {updateImage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1 pb-0.5 text-center sm:pb-1 sm:text-left">
                <div className="flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <h1 className="text-balance text-xl font-bold uppercase tracking-tight text-gray-900 sm:text-2xl md:text-3xl">
                    {user?.name ?? "—"}
                  </h1>
                  {user?.isActive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm capitalize text-gray-500">{user?.role?.[0] ?? "—"}</p>
              </div>
            </div>

            <div className="flex w-full max-w-md flex-col gap-2 sm:max-w-none sm:w-auto sm:flex-row sm:justify-end sm:gap-3">
              <button
                type="button"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 sm:flex-none sm:py-2.5"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                Message
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 sm:flex-none sm:py-2.5"
              >
                <Pencil className="h-4 w-4 shrink-0" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="scrollbar-hide overflow-x-auto border-t border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
          <PillTabBar
            items={PROFILE_PAGE_TABS.map((t) => ({ key: t.key, label: t.label }))}
            activeKey={activeTab}
            onTabChange={setActiveTab}
            className="min-w-max"
          />
        </div>
      </div>

      {activeTab === "Profile" && (
        <ProfileOverviewTab
          user={user}
          updateUserPending={updateUser.isPending}
          isEditing={isEditing}
          formData={formData}
          startEditing={startEditing}
          cancelEditing={cancelEditing}
          handleFormChange={handleFormChange}
          handleSave={handleSave}
        />
      )}

      {activeTab === "Leave History" && (
        <ProfileLeaveDashboard user={user} userLoading={false} />
      )}

      {activeTab !== "Profile" && activeTab !== "Leave History" && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-400">{activeTab} section coming soon.</p>
        </div>
      )}

      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={user?.name ?? "Profile Image"}
        panelClassName="max-w-2xl"
      >
        <div className="flex justify-center">
          <PreviewModalImage url={profileImageUrl} alt={user?.name ?? "Profile"} />
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
