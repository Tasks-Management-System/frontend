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
import { getUserById, useUpdateProfileImage, useUpdateUser } from "../../apis/api/auth";
import toast from "react-hot-toast";
import Modal from "../../components/UI/Model";
import { PillTabBar } from "../../components/UI/PillTabBar";
import type { User as UserType } from "../../types/user.types";

const tabs = [
  { key: "Profile", label: "Profile" },
  { key: "Attendance", label: "Attendance" },
  { key: "Leave History", label: "Leave History" },
  { key: "Payroll", label: "Payroll" },
  { key: "Documents", label: "Documents" },
];

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
  });
  const userId = localStorage.getItem("userId") ?? "";
  const { data: user, isLoading } = getUserById(userId);
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
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen space-y-4 sm:space-y-6">
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">

        <div
        style={{ background: "linear-gradient(to right, #6366f1, #8b5cf6)", backgroundImage: `url(${user?.profileImage})`, backgroundSize: "cover", backgroundPosition: "center" }}
        className="h-28 sm:h-36" />

        <div className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-10 sm:-mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-5">
              <div className="relative group shrink-0">
                <div
                  onClick={() => user?.profileImage && setIsPreviewOpen(true)}
                  className={`w-20 h-20 sm:w-28 sm:h-28 rounded-2xl border-2 border-white shadow-lg bg-linear-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold overflow-hidden ${user?.profileImage ? "cursor-pointer" : ""}`}
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="select-none">{initials}</span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={updateImage.isPending}
                  className="absolute bottom-0.5 right-0.5 sm:-bottom-1 sm:-right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {updateImage.isPending ? (
                    <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3 h-3 sm:w-3.5 sm:h-3.5 cursor-pointer" />
                  )}
                </button>
              </div>

              <div className="pb-1">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {user?.name ?? "—"}
                  </h1>
                  {user?.isActive && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {user?.role?.[0] ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 mt-3 sm:mt-0 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                <MessageSquare className="w-4 h-4" />
                Message
              </button>
              <button
                onClick={startEditing}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 border-t border-gray-100 py-4 sm:py-5 overflow-x-auto scrollbar-hide">
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
                      {updateUser.isPending && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
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
                          ? user.address.join(", ")
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
                  label="Leave Balance"
                  value={`${user?.leaves?.length ?? 0} Days`}
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

              <div className="text-sm text-gray-400 text-center py-6">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab !== "Profile" && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">
            {activeTab} section coming soon.
          </p>
        </div>
      )}

      {/* Image Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={user?.name ?? "Profile Image"}
        
      >
        <div className="flex items-center justify-center">
          <img
            src={user?.profileImage ?? ""}
            alt={user?.name}
            className="max-w-full max-h-[70vh] rounded-xl object-contain"
          />
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
      <p className={`text-sm font-medium text-gray-900 ${className}`}>
        {value || "—"}
      </p>
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
