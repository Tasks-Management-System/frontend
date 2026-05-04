import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import type { OrgMember } from "../../apis/api/organization";

type OrganizationMemberAvatarProps = {
  user: OrgMember;
};

export function OrganizationMemberAvatar({ user }: OrganizationMemberAvatarProps) {
  const url = resolveProfileImageUrl(user.profileImage);
  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-xs font-semibold text-white">
      {url ? (
        <img src={url} alt={user.name} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
