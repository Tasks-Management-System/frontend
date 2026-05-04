import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Briefcase,
  FolderKanban,
  CheckCircle2,
  TreePalm,
  Clock,
  Loader2,
} from "lucide-react";
import type { User as UserType } from "../../types/user.types";
import type { ProfileEditFormState } from "./profileFormTypes";
import { formatProfileDate } from "./profileFormat";
import {
  ProfileInfoField as InfoField,
  ProfileEditField as EditField,
  ProfileStatRow as StatRow,
} from "./ProfileFieldPrimitives";

type ProfileOverviewTabProps = {
  user: UserType;
  updateUserPending: boolean;
  isEditing: boolean;
  formData: ProfileEditFormState;
  startEditing: () => void;
  cancelEditing: () => void;
  handleFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSave: () => void;
};

export function ProfileOverviewTab({
  user,
  updateUserPending,
  isEditing,
  formData,
  startEditing,
  cancelEditing,
  handleFormChange,
  handleSave,
}: ProfileOverviewTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
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
                type="button"
                onClick={startEditing}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Edit Info
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateUserPending}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {updateUserPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <InfoField icon={<User className="w-4 h-4" />} label="FULL NAME" value={user?.name} />
              <InfoField icon={<Mail className="w-4 h-4" />} label="EMAIL ADDRESS" value={user?.email} />
              <InfoField icon={<Phone className="w-4 h-4" />} label="PHONE NUMBER" value={user?.phone} />
              <InfoField
                icon={<Calendar className="w-4 h-4" />}
                label="DATE OF BIRTH"
                value={formatProfileDate(user?.dob)}
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

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Employment Details</h2>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
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
              value={formatProfileDate(user?.createdAt)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Identity & Banking</h2>
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
              <InfoField label="BANK NAME" value={user?.bankName} icon={<CheckCircle2 className="w-4 h-4" />} />
              <InfoField label="IFSC" value={user?.bankIFSC} icon={<CheckCircle2 className="w-4 h-4" />} />
              <InfoField label="BRANCH" value={user?.bankBranch} icon={<CheckCircle2 className="w-4 h-4" />} />
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

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">Structured Details</h2>
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
                You can type comma-separated values (like &quot;test, test1&quot;) or paste a JSON array.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
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

        <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-5">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</h2>
          </div>

          <div className="text-sm text-gray-400 text-center py-6">No recent activity</div>
        </div>
      </div>
    </div>
  );
}
