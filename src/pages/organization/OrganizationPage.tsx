import { useState } from "react";
import {
  Building2,
  UserPlus,
  Users,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Send,
  UserCheck,
  Inbox,
  ShieldCheck,
  UserCircle2,
  ArrowLeftRight,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateOrganization,
  useMyOrgContext,
  useSendInvite,
  useAdminInvites,
  useRemoveMember,
  useJoinRequests,
  useAcceptJoinRequest,
  useRejectJoinRequest,
  useInvitableUsers,
  type OrgMember,
  type OrgInvite,
  type Organization,
} from "../../apis/api/organization";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/auth";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { ApiError } from "../../apis/apiService";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { useActiveOrg, type OrgMode } from "../../contexts/ActiveOrgContext";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: OrgInvite["status"] }) {
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Accepted
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
        <XCircle className="h-3 w-3" /> Declined
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function Avatar({ user }: { user: OrgMember }) {
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

// ── Member view (read-only) shown when the user has joined someone else's org ──
function MemberOrgView({ org, userId }: { org: Organization; userId: string }) {
  const roleLabel = (m: OrgMember) =>
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
              Created {formatDate(org.createdAt)} &bull; {org.members.length} member
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
                <Avatar user={member} />
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

// ── Admin view shown for the org the user owns ──
function AdminOrgView({
  org,
  userId,
}: {
  org: Organization;
  userId: string;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [removeTarget, setRemoveTarget] = useState<OrgMember | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const { data: allUsers = [] } = useInvitableUsers();
  const { data: invites = [], isLoading: invitesLoading } = useAdminInvites();
  const { data: joinRequests = [], isLoading: joinRequestsLoading } = useJoinRequests();
  const sendInviteMutation = useSendInvite();
  const removeMemberMutation = useRemoveMember();
  const acceptJoinRequestMutation = useAcceptJoinRequest();
  const rejectJoinRequestMutation = useRejectJoinRequest();

  const pendingJoinRequests = joinRequests.filter((jr) => jr.status === "pending");

  const invitableUsers = allUsers.filter(
    (u) =>
      userSearch === "" ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a user to invite");
      return;
    }
    try {
      const res = await sendInviteMutation.mutateAsync(selectedUserId);
      toast.success(res.message ?? "Invitation sent!");
      setInviteOpen(false);
      setSelectedUserId("");
      setUserSearch("");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to send invite");
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget) return;
    try {
      await removeMemberMutation.mutateAsync({ orgId: org._id, userId: removeTarget._id });
      toast.success(`${removeTarget.name} removed from organization`);
      setRemoveTarget(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to remove member");
    }
  };

  const roleLabel = (m: OrgMember) =>
    Array.isArray(m.role) ? m.role[0] : (m.role ?? "member");

  return (
    <div className="space-y-6">
      {/* Org info */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{org.name}</h2>
              <p className="text-sm text-gray-500">
                Created {formatDate(org.createdAt)} &bull; {org.members.length} member
                {org.members.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-1.5 h-4 w-4" /> Invite User
          </Button>
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
          <ShieldCheck className="h-3.5 w-3.5" /> You are the owner of this organization
        </div>
      </div>

      {/* Members */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800">
            <Users className="h-4 w-4 text-violet-500" /> Members
          </h3>
          <span className="text-sm text-gray-400">{org.members.length} total</span>
        </div>
        <div className="divide-y divide-gray-50">
          {org.members.map((member) => {
            const isCreator = String(member._id) === String(org.createdBy?._id ?? "");
            const isSelf = String(member._id) === String(userId);
            return (
              <div
                key={member._id}
                className="flex items-center justify-between gap-3 px-6 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={member} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {member.name}
                      {isCreator && (
                        <span className="ml-2 text-xs font-normal text-violet-500">(Owner)</span>
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
                {!isCreator && !isSelf && (
                  <button
                    type="button"
                    title="Remove member"
                    onClick={() => setRemoveTarget(member)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Join Requests */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800">
            <Inbox className="h-4 w-4 text-violet-500" /> Join Requests
            {pendingJoinRequests.length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-100 px-1.5 text-xs font-semibold text-violet-700">
                {pendingJoinRequests.length}
              </span>
            )}
          </h3>
          <span className="text-sm text-gray-400">{joinRequests.length} total</span>
        </div>
        {joinRequestsLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : joinRequests.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No join requests yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {joinRequests.map((jr) => (
              <div
                key={jr._id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={jr.requestedBy} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {jr.requestedBy?.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {jr.requestedBy?.email} &bull; {formatDate(jr.createdAt)}
                      {jr.message && (
                        <span className="ml-1 text-gray-500">&bull; "{jr.message}"</span>
                      )}
                    </p>
                  </div>
                </div>
                {jr.status === "pending" ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await rejectJoinRequestMutation.mutateAsync(jr._id);
                          toast.success(res.message ?? "Request rejected");
                        } catch (err) {
                          toast.error((err as ApiError)?.message ?? "Failed to reject");
                        }
                      }}
                      disabled={rejectJoinRequestMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await acceptJoinRequestMutation.mutateAsync(jr._id);
                          toast.success(res.message ?? "Request accepted");
                        } catch (err) {
                          toast.error((err as ApiError)?.message ?? "Failed to accept");
                        }
                      }}
                      disabled={acceptJoinRequestMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      {acceptJoinRequestMutation.isPending ? "Accepting…" : "Accept"}
                    </button>
                  </div>
                ) : (
                  <StatusBadge status={jr.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invitations */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="flex items-center gap-2 font-semibold text-gray-800">
            <Send className="h-4 w-4 text-violet-500" /> Invitations Sent
          </h3>
          <span className="text-sm text-gray-400">{invites.length} total</span>
        </div>
        {invitesLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-400">
            No invitations sent yet. Click <strong>Invite User</strong> to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invites.map((inv) => (
              <div
                key={inv._id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar user={inv.invitedUser} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {inv.invitedUser?.name}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      {inv.invitedUser?.email} &bull; Sent {formatDate(inv.createdAt)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      <Modal
        isOpen={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setSelectedUserId("");
          setUserSearch("");
        }}
        title="Invite User to Organization"
      >
        <form onSubmit={handleSendInvite} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Search user</label>
            <input
              type="text"
              placeholder="Search by name or email…"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setSelectedUserId("");
              }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
            />
          </div>

          {userSearch && (
            <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50">
              {invitableUsers.length === 0 ? (
                <p className="px-4 py-3 text-sm text-gray-400">No users found</p>
              ) : (
                invitableUsers.map((u) => (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => {
                      setSelectedUserId(u._id);
                      setUserSearch(u.name);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition hover:bg-violet-50 ${
                      selectedUserId === u._id ? "bg-violet-50" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-xs font-semibold text-white">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">{u.name}</p>
                      <p className="truncate text-xs text-gray-400">{u.email}</p>
                    </div>
                    {selectedUserId === u._id && (
                      <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-violet-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {selectedUserId && (
            <p className="rounded-xl bg-violet-50 px-3 py-2 text-sm text-violet-700">
              Selected: <strong>{allUsers.find((u) => u._id === selectedUserId)?.name}</strong>
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInviteOpen(false);
                setSelectedUserId("");
                setUserSearch("");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!selectedUserId || sendInviteMutation.isPending}>
              {sendInviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Remove Confirm Modal */}
      <Modal isOpen={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove Member">
        <p className="mb-6 text-sm text-gray-600">
          Are you sure you want to remove <strong>{removeTarget?.name}</strong> from the
          organization?
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setRemoveTarget(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleRemoveMember}
            disabled={removeMemberMutation.isPending}
            className="bg-red-500 hover:bg-red-600"
          >
            {removeMemberMutation.isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Main page ──
export default function OrganizationPage() {
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const roles = sessionUser?.role ?? [];
  const isAdmin = roles.some((r: string) => ["admin", "super-admin"].includes(r));

  const { data: context, isLoading } = useMyOrgContext();
  const createOrgMutation = useCreateOrganization();

  // Sync with global org context so sidebar switcher and this page stay in lock-step
  const { activeMode, setActiveMode, hasBoth } = useActiveOrg();

  const ownedOrg = context?.ownedOrg ?? null;
  const memberOrg = context?.memberOrg ?? null;

  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [orgName, setOrgName] = useState("");

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrgMutation.mutateAsync(orgName.trim());
      toast.success("Organization created!");
      setCreateOrgOpen(false);
      setOrgName("");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to create organization");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organization</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization, members, and invitations.
          </p>
        </div>
        {!isLoading && !ownedOrg && isAdmin && (
          <Button onClick={() => setCreateOrgOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Create Organization
          </Button>
        )}
      </div>

      {/* Org switch tabs — only shown when user has BOTH an owned org and a joined org */}
      {hasBoth && (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <ArrowLeftRight className="h-3.5 w-3.5" /> Switch Organization
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveMode("owned" as OrgMode)}
              className={`flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                activeMode === "owned"
                  ? "border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
                  : "border-gray-100 bg-gray-50 text-gray-500 hover:border-violet-100 hover:bg-violet-50/50 hover:text-violet-600"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  activeMode === "owned"
                    ? "bg-violet-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate font-semibold">{ownedOrg?.name ?? "My Organization"}</p>
                <p className="text-xs font-normal text-gray-400">Owner · Admin access</p>
              </div>
              {activeMode === "owned" && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-violet-500" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMode("member" as OrgMode)}
              className={`flex flex-1 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                activeMode === "member"
                  ? "border-sky-200 bg-sky-50 text-sky-700 shadow-sm"
                  : "border-gray-100 bg-gray-50 text-gray-500 hover:border-sky-100 hover:bg-sky-50/50 hover:text-sky-600"
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  activeMode === "member"
                    ? "bg-sky-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                <UserCircle2 className="h-4 w-4" />
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate font-semibold">{memberOrg?.name ?? "Joined Org"}</p>
                <p className="text-xs font-normal text-gray-400">Employee · Member access</p>
              </div>
              {activeMode === "member" && (
                <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-sky-500" />
              )}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            Switching org changes your navigation and available features across the whole app.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />}

      {/* No org at all */}
      {!isLoading && !ownedOrg && !memberOrg && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-20 text-center">
          <Building2 className="mb-4 h-12 w-12 text-gray-300" />
          <h3 className="mb-1 text-base font-semibold text-gray-700">No organization yet</h3>
          <p className="mb-6 text-sm text-gray-400">
            Create your organization to start inviting team members, or wait to be invited.
          </p>
          {isAdmin && (
            <Button onClick={() => setCreateOrgOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Organization
            </Button>
          )}
        </div>
      )}

      {/* Org content */}
      {!isLoading && (
        <>
          {/* User has both orgs — show whichever is active */}
          {hasBoth && activeMode === "owned" && <AdminOrgView org={ownedOrg!} userId={userId} />}
          {hasBoth && activeMode === "member" && <MemberOrgView org={memberOrg!} userId={userId} />}
          {/* User only has their own org */}
          {!hasBoth && ownedOrg && <AdminOrgView org={ownedOrg} userId={userId} />}
          {/* User only joined someone else's org */}
          {!hasBoth && !ownedOrg && memberOrg && <MemberOrgView org={memberOrg} userId={userId} />}
        </>
      )}

      {/* Create Org Modal */}
      <Modal
        isOpen={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
        title="Create Organization"
      >
        <form onSubmit={handleCreateOrg} className="flex flex-col gap-4">
          <Input
            label="Organization name"
            name="orgName"
            placeholder="e.g. Acme Corp"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setCreateOrgOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
