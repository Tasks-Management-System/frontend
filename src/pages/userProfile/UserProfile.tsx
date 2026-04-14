import { getUserId } from "../../utils/auth";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  CheckCircle2,
  FolderKanban,
  ArrowLeft,
} from "lucide-react";
import { getUserById } from "../../apis/api/auth";
import { PillTabBar } from "../../components/UI/PillTabBar";
import { Skeleton } from "../../components/UI/Skeleton";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "employment", label: "Employment & records" },
  { key: "details", label: "Skills & experience" },
];

function formatRoleLabel(role: string) {
  return role
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function ProfileAvatar({
  url,
  name,
}: {
  url: string | null;
  name: string;
}) {
  const resolved = resolveProfileImageUrl(url);
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (!resolved) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600 to-indigo-600 text-lg font-bold text-white shadow-md ring-1 ring-black/5 sm:h-20 sm:w-20 sm:text-xl">
        {initials || "?"}
      </div>
    );
  }
  return (
    <img
      src={resolved}
      alt=""
      className="h-16 w-16 shrink-0 rounded-2xl object-cover shadow-md ring-1 ring-black/5 sm:h-20 sm:w-20"
    />
  );
}

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
    <div className="min-w-0">
      <div className="mb-1 flex items-center gap-1.5">
        <span className="text-gray-400">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className={`text-sm font-medium text-gray-900 wrap-break-word ${className}`}>
        {value != null && String(value).trim() ? value : "—"}
      </p>
    </div>
  );
}

function UserProfileSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Skeleton className="h-9 w-48 max-w-full sm:h-10" />
        <Skeleton className="mt-2 h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center">
          <Skeleton className="h-20 w-20 shrink-0 rounded-2xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-56 max-w-full" />
            <Skeleton className="h-4 w-40 max-w-full" />
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-40 rounded-full" />
          <Skeleton className="h-9 w-36 rounded-full" />
        </div>
        <div className="mt-6 space-y-4 rounded-xl border border-gray-100 p-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const UserProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  const sessionUserId =
    getUserId();

  const { data: user, isLoading, isError } = getUserById(id ?? "");

  const isSelf = Boolean(id && sessionUserId && id === sessionUserId);
  const backHref = "/settings";

  if (!id) {
    return (
      <div className="min-h-screen space-y-4 bg-gray-50 p-3 sm:space-y-6 sm:p-6">
        <p className="text-sm text-gray-600">Missing user id.</p>
        <Link
          to="/"
          className="inline-flex text-sm font-medium text-violet-600 hover:text-violet-700"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
        <UserProfileSkeleton />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen space-y-4 bg-gray-50 p-3 sm:space-y-6 sm:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Profile
          </h1>
          <p className="text-gray-500">
            We couldn&apos;t load this team member.
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p>
            The user may not exist or you may not have permission to view this
            profile.
          </p>
          <Link
            to={backHref}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-gray-50 p-3 sm:space-y-6 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Team member
          </h1>
          <p className="text-gray-500">
            View directory details for{" "}
            <span className="font-medium text-gray-700">{user.name}</span>.
          </p>
        </div>
        {isSelf ? (
          <Link
            to="/profile"
            className="inline-flex shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
          >
            Edit my profile
          </Link>
        ) : null}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:gap-6">
          <ProfileAvatar url={user.profileImage} name={user.name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {user.name}
              </h2>
              {user.isActive ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                  Inactive
                </span>
              )}
            </div>
            <p className="mt-1 text-sm capitalize text-gray-500">
              {(user.role ?? [])
                .map((r) => formatRoleLabel(r))
                .join(" · ") || "—"}
            </p>
            <p className="mt-0.5 text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="scrollbar-hide mt-6 overflow-x-auto border-t border-gray-100 pt-5">
          <PillTabBar
            items={tabs.map((t) => ({ key: t.key, label: t.label }))}
            activeKey={activeTab}
            onTabChange={setActiveTab}
            className="min-w-max"
          />
        </div>

        <div className="mt-6">
          {activeTab === "overview" && (
            <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-violet-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Personal information
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                <InfoField
                  icon={<User className="h-4 w-4" />}
                  label="Full name"
                  value={user.name}
                />
                <InfoField
                  icon={<Mail className="h-4 w-4" />}
                  label="Email"
                  value={user.email}
                />
                <InfoField
                  icon={<Phone className="h-4 w-4" />}
                  label="Phone"
                  value={user.phone}
                />
                <InfoField
                  icon={<Calendar className="h-4 w-4" />}
                  label="Date of birth"
                  value={formatDate(user.dob)}
                />
                <InfoField
                  icon={<User className="h-4 w-4" />}
                  label="Gender"
                  value={user.gender}
                  className="capitalize"
                />
                <div className="sm:col-span-2">
                  <InfoField
                    icon={<MapPin className="h-4 w-4" />}
                    label="Address"
                    value={
                      user.address?.length
                        ? `${user.address[0]?.address ?? ""}${
                            user.address[0]?.city
                              ? `, ${user.address[0].city}`
                              : ""
                          }`.trim() || null
                        : null
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "employment" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-100 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-violet-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Employment
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <InfoField
                    icon={<Briefcase className="h-4 w-4" />}
                    label="Employee id"
                    value={user._id?.slice(-8).toUpperCase()}
                  />
                  <InfoField
                    icon={<FolderKanban className="h-4 w-4" />}
                    label="Roles"
                    value={(user.role ?? []).map(formatRoleLabel).join(", ")}
                    className="capitalize"
                  />
                  <InfoField
                    icon={<Calendar className="h-4 w-4" />}
                    label="Joined"
                    value={formatDate(user.createdAt)}
                  />
                </div>
              </div>
              <div className="rounded-xl border border-gray-100 p-4 sm:p-6">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-violet-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Identity & banking
                  </h3>
                </div>
                <p className="mb-4 text-xs text-gray-500">
                  Shown for authorized staff only; handle according to your
                  company policy.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                  <InfoField
                    label="Aadhar"
                    value={user.aadharCardNumber}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <InfoField
                    label="PAN"
                    value={user.panCardNumber}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <InfoField
                    label="Bank account"
                    value={user.bankAccountNo}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <InfoField
                    label="Bank name"
                    value={user.bankName}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <InfoField
                    label="IFSC"
                    value={user.bankIFSC}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                  <InfoField
                    label="Branch"
                    value={user.bankBranch}
                    icon={<CheckCircle2 className="h-4 w-4" />}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="rounded-xl border border-gray-100 p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-violet-600" />
                <h3 className="text-base font-semibold text-gray-900">
                  Skills, education & experience
                </h3>
              </div>
              <div className="space-y-5">
                <InfoField
                  icon={<FolderKanban className="h-4 w-4" />}
                  label="Skills"
                  value={
                    user.skills?.length
                      ? user.skills
                          .map((s) => s.skill)
                          .filter(Boolean)
                          .join(", ")
                      : null
                  }
                />
                <InfoField
                  icon={<FolderKanban className="h-4 w-4" />}
                  label="Education"
                  value={
                    user.education?.length
                      ? user.education
                          .map((e) =>
                            [e.degree, e.institution, e.year]
                              .filter(Boolean)
                              .join(" · ")
                          )
                          .filter(Boolean)
                          .join("; ")
                      : null
                  }
                />
                <InfoField
                  icon={<FolderKanban className="h-4 w-4" />}
                  label="Experience"
                  value={
                    user.experience?.length
                      ? user.experience
                          .map((e) =>
                            [e.company, e.position].filter(Boolean).join(" — ")
                          )
                          .filter(Boolean)
                          .join("; ")
                      : null
                  }
                />
                <InfoField
                  icon={<FolderKanban className="h-4 w-4" />}
                  label="Leave balances"
                  value={
                    user.leaves?.length
                      ? user.leaves
                          .map((l) =>
                            typeof l.totalBalance === "number"
                              ? `${l.totalBalance} days`
                              : ""
                          )
                          .filter(Boolean)
                          .join(", ")
                      : null
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



export default UserProfile;
