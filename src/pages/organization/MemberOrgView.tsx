import { Building2, UserCircle2, Users } from "lucide-react";
import type { Organization } from "../../apis/api/organization";
import { OrganizationMemberAvatar } from "./OrganizationMemberAvatar";
import { formatOrgDate } from "./organizationUtils";

type MemberOrgViewProps = {
  org: Organization;
  userId: string;
};

export function MemberOrgView({ org, userId }: MemberOrgViewProps) {
  const roleLabel = (m: Organization["members"][number]) =>
    Array.isArray(m.role) ? m.role[0] : (m.role ?? "member");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 shadow">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
            <p className="text-sm text-gray-500">
              Created {formatOrgDate(org.createdAt)} &bull; {org.members.length} member
              {org.members.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
          <UserCircle2 className="h-3.5 w-3.5" /> You are a member of this organization
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800">
            <Users className="h-4 w-4 text-sky-500" /> Members
          </h3>
          <span className="text-sm text-gray-400">{org.members.length} total</span>
        </div>
        <div className="divide-y divide-gray-50">
          {org.members.map((member) => {
            const isCreator = String(member._id) === String(org.createdBy?._id ?? "");
            const isSelf = String(member._id) === String(userId);
            return (
              <div key={member._id} className="flex items-center gap-3 px-6 py-3">
                <OrganizationMemberAvatar user={member} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {member.name}
                    {isCreator && (
                      <span className="ml-2 text-xs font-normal text-sky-500">(Owner)</span>
                    )}
                    {isSelf && (
                      <span className="ml-2 text-xs font-normal text-gray-400">(You)</span>
                    )}
                  </p>
                  <p className="truncate text-xs capitalize text-gray-400">
                    {member.email} &bull; {roleLabel(member)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
