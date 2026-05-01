import { getUserId } from "../../utils/session";
import { useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  MessageSquare,
  Pencil,
  Camera,
  Briefcase,
  FolderKanban,
  CheckCircle2,
  TreePalm,
  Clock,
  Loader2,
} from "lucide-react";
import { useUserById, useUpdateProfileImage, useUpdateUser } from "../../apis/api/auth";
import toast from "react-hot-toast";
import Modal from "../../components/UI/Model";
import { PillTabBar } from "../../components/UI/PillTabBar";
import type { User as UserType } from "../../types/user.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { ProfilePageSkeleton } from "../../components/UI/Skeleton";
import { ProfileLeaveDashboard } from "../../components/leave/MyLeaveSection";

const tabs = [
  { key: "Profile", label: "Profile" },
  { key: "Attendance", label: "Attendance" },
  { key: "Leave History", label: "Leave History" },
  { key: "Payroll", label: "Payroll" },
  { key: "Documents", label: "Documents" },
];

function ProfileCover({ url }: { url: string | null }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showPhoto = Boolean(url) && failedUrl !== url;
  return (
    <div className="relative h-32 overflow-hidden rounded-t-2xl sm:h-40 md:h-44">
      {showPhoto && url ? (
        <>
          <img
            key={url}
            src={url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            loading="eager"
            decoding="async"
            onError={() => setFailedUrl(url)}
          />
          <div
            className="absolute inset-0 bg-linear-to-t from-black/55 via-black/20 to-transparent"
            aria-hidden
          />
        </>
      ) : (
        <div
          className="h-full w-full bg-linear-to-r from-indigo-600 via-violet-600 to-purple-600"
          aria-hidden
        />
      )}
    </div>
  );
}

/** Avatar with graceful fallback when URL is missing or fails to load (CORS, 404, etc.). */
function ProfileAvatarFace({
  url,
  alt,
  initials,
}: {
  url: string | null;
  alt: string;
  initials: string;
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) {
    return <span className="select-none">{initials}</span>;
  }
  return (
    <img
      key={url}
      src={url}
      alt={alt}
      className="h-full w-full object-cover object-center"
      onError={() => setFailedUrl(url)}
      loading="lazy"
    />
  );
}

function PreviewModalImage({ url, alt }: { url: string | null; alt: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!url || failedUrl === url) {
    return (
      <p className="py-8 text-center text-sm text-gray-500">
        No preview available or image failed to load.
      </p>
    );
  }
  return (
    <img
      key={url}
      src={url}
      alt={alt}
      className="max-h-[70vh] w-full max-w-full rounded-xl object-contain"
      onError={() => setFailedUrl(url)}
    />
  );
}

const Profile = () => {
  const [activeTab, setActiveTab] = useState("Profile");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "" as "male" | "female" | "other" | "",
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

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <ProfilePageSkeleton />;
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
            items={tabs.map((t) => ({ key: t.key, label: t.label }))}
            activeKey={activeTab}
            onTabChange={setActiveTab}
            className="min-w-max"
          />
        </div>
      </div>

      {/* Content */}
      {activeTab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Personal Information
                  </h2>
                </div>
                {!isEditing ? (
                  <button
                    onClick={startEditing}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    Edit Info
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updateUser.isPending}
                      className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {updateUser.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Save
                    </button>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <InfoField
                    icon={<User className="w-4 h-4" />}
                    label="FULL NAME"
                    value={user?.name}
                  />
                  <InfoField
                    icon={<Mail className="w-4 h-4" />}
                    label="EMAIL ADDRESS"
                    value={user?.email}
                  />
                  <InfoField
                    icon={<Phone className="w-4 h-4" />}
                    label="PHONE NUMBER"
                    value={user?.phone}
                  />
                  <InfoField
                    icon={<Calendar className="w-4 h-4" />}
                    label="DATE OF BIRTH"
                    value={formatDate(user?.dob)}
                  />
                  <InfoField
                    icon={<User className="w-4 h-4" />}
                    label="GENDER"
                    value={user?.gender}
                    className="capitalize"
                  />
                  <div className="sm:col-span-2">
                    <InfoField
                      icon={<MapPin className="w-4 h-4" />}
                      label="ADDRESS"
                      value={
                        user?.address?.length
                          ? `${user.address[0]?.address ?? ""}${user.address[0]?.city ? `, ${user.address[0].city}` : ""}`.trim() ||
                            "—"
                          : undefined
                      }
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <EditField
                    label="FULL NAME"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter full name"
                  />
                  <EditField
                    label="EMAIL ADDRESS"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    placeholder="Enter email"
                  />
                  <EditField
                    label="PHONE NUMBER"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleFormChange}
                    placeholder="Enter phone number"
                  />
                  <EditField
                    label="DATE OF BIRTH"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleFormChange}
                  />
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                      GENDER
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <EditField
                    label="ADDRESS"
                    name="addressLine"
                    value={formData.addressLine}
                    onChange={handleFormChange}
                    placeholder="Street / apartment"
                  />
                  <EditField
                    label="CITY"
                    name="addressCity"
                    value={formData.addressCity}
                    onChange={handleFormChange}
                    placeholder="City"
                  />
                </div>
              )}
            </div>

            {/* Employment Details */}
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Employment Details
                  </h2>
                </div>
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
                  View History
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <InfoField
                  icon={<Briefcase className="w-4 h-4" />}
                  label="EMPLOYEE ID"
                  value={user?._id?.slice(-8).toUpperCase()}
                />
                <InfoField
                  icon={<FolderKanban className="w-4 h-4" />}
                  label="ROLE"
                  value={user?.role?.join(", ")}
                  className="capitalize"
                />
                <InfoField
                  icon={<Calendar className="w-4 h-4" />}
                  label="JOINED"
                  value={formatDate(user?.createdAt)}
                />
              </div>
            </div>

            {/* Identity & Banking */}
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Identity & Banking
                  </h2>
                </div>
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <InfoField
                    label="AADHAR"
                    value={user?.aadharCardNumber}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                  <InfoField
                    label="PAN"
                    value={user?.panCardNumber}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                  <InfoField
                    label="BANK ACCOUNT"
                    value={user?.bankAccountNo}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                  <InfoField
                    label="BANK NAME"
                    value={user?.bankName}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                  <InfoField
                    label="IFSC"
                    value={user?.bankIFSC}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                  <InfoField
                    label="BRANCH"
                    value={user?.bankBranch}
                    icon={<CheckCircle2 className="w-4 h-4" />}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <EditField
                    label="AADHAR"
                    name="aadharCardNumber"
                    value={formData.aadharCardNumber}
                    onChange={handleFormChange}
                  />
                  <EditField
                    label="PAN"
                    name="panCardNumber"
                    value={formData.panCardNumber}
                    onChange={handleFormChange}
                  />
                  <EditField
                    label="BANK ACCOUNT"
                    name="bankAccountNo"
                    value={formData.bankAccountNo}
                    onChange={handleFormChange}
                  />
                  <EditField
                    label="BANK NAME"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleFormChange}
                  />
                  <EditField
                    label="IFSC"
                    name="bankIFSC"
                    value={formData.bankIFSC}
                    onChange={handleFormChange}
                  />
                  <EditField
                    label="BRANCH"
                    name="bankBranch"
                    value={formData.bankBranch}
                    onChange={handleFormChange}
                  />
                </div>
              )}
            </div>

            {/* Skills / Education / Experience / Leaves */}
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    Structured Details
                  </h2>
                </div>
              </div>
              {!isEditing ? (
                <div className="space-y-4">
                  <InfoField
                    icon={<FolderKanban className="w-4 h-4" />}
                    label="SKILLS"
                    value={
                      user?.skills?.length
                        ? user.skills
                            .map((s) => s.skill)
                            .filter(Boolean)
                            .join(", ")
                        : undefined
                    }
                    className="wrap-break-word"
                  />
                  <InfoField
                    icon={<FolderKanban className="w-4 h-4" />}
                    label="EDUCATION"
                    value={
                      user?.education?.length
                        ? user.education
                            .map((e) => e.degree)
                            .filter(Boolean)
                            .join(", ")
                        : undefined
                    }
                    className="wrap-break-word"
                  />
                  <InfoField
                    icon={<FolderKanban className="w-4 h-4" />}
                    label="EXPERIENCE"
                    value={
                      user?.experience?.length
                        ? user.experience
                            .map((e) => e.company)
                            .filter(Boolean)
                            .join(", ")
                        : undefined
                    }
                    className="wrap-break-word"
                  />
                  <InfoField
                    icon={<FolderKanban className="w-4 h-4" />}
                    label="LEAVES"
                    value={
                      user?.leaves?.length
                        ? user.leaves
                            .map((l) =>
                              typeof l.totalBalance === "number" ? String(l.totalBalance) : ""
                            )
                            .filter(Boolean)
                            .join(", ")
                        : undefined
                    }
                    className="wrap-break-word"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <EditField
                    label="SKILLS"
                    name="skillsJson"
                    value={formData.skillsJson}
                    onChange={handleFormChange}
                    placeholder="test, test1"
                  />
                  <EditField
                    label="EDUCATION"
                    name="educationJson"
                    value={formData.educationJson}
                    onChange={handleFormChange}
                    placeholder="BSc, MSc"
                  />
                  <EditField
                    label="EXPERIENCE"
                    name="experienceJson"
                    value={formData.experienceJson}
                    onChange={handleFormChange}
                    placeholder="Company A, Company B"
                  />
                  <p className="text-xs text-gray-500">
                    You can type comma-separated values (like "test, test1") or paste a JSON array.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <FolderKanban className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base sm:text-lg font-semibold ">Quick Stats</h2>
              </div>

              <div className="space-y-4">
                <StatRow
                  icon={<FolderKanban className="w-4 h-4" />}
                  label="Total Projects"
                  value="—"
                  iconBg="bg-indigo-500/20"
                  iconColor="text-indigo-400"
                />
                <StatRow
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  label="Tasks Completed"
                  value="—"
                  iconBg="bg-emerald-500/20"
                  iconColor="text-emerald-400"
                />
                <StatRow
                  icon={<TreePalm className="w-4 h-4" />}
                  label="Annual leave (pool)"
                  value={
                    user?.leaves?.[0] &&
                    typeof user.leaves[0] === "object" &&
                    "totalBalance" in user.leaves[0]
                      ? `${String((user.leaves[0] as { totalBalance?: number }).totalBalance ?? "—")} days`
                      : "—"
                  }
                  iconBg="bg-amber-500/20"
                  iconColor="text-amber-400"
                />
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-xs uppercase tracking-wider text-gray-900 mb-2">
                  <span>Performance Review</span>
                  <span className=" font-semibold text-sm">—</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-linear-to-r from-indigo-500 to-purple-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
              </div>

              <div className="text-sm text-gray-400 text-center py-6">No recent activity</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Leave History" && user && (
        <ProfileLeaveDashboard user={user} userLoading={false} />
      )}

      {activeTab !== "Profile" && activeTab !== "Leave History" && (
        <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
          <p className="text-sm text-gray-400">{activeTab} section coming soon.</p>
        </div>
      )}

      {/* Image Preview Modal */}
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

function InfoField({
  icon,
  label,
  value,
  className = "",
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | null;
  className?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className={`text-sm font-medium text-gray-900 ${className}`}>{value || "—"}</p>
    </div>
  );
}

function EditField({
  label,
  name,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
      />
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center`}
        >
          {icon}
        </div>
        <span className="text-sm text-gray-900">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

export default Profile;
