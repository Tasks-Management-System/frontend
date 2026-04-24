import { useState } from "react";
import { Building2, CheckCircle2, XCircle, Mail, Search, Send, Clock, Users } from "lucide-react";
import toast from "react-hot-toast";
import {
  useMyInvites,
  useAcceptInvite,
  useRejectInvite,
  useAllOrganizations,
  useSendJoinRequest,
  useMyJoinRequests,
  useMyOrganization,
  type OrgInvite,
  type JoinRequest,
} from "../../apis/api/organization";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { ApiError } from "../../apis/apiService";
import Button from "../../components/UI/Button";
import { getUserId } from "../../utils/auth";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function RequestStatusBadge({ status }: { status: JoinRequest["status"] }) {
  if (status === "accepted")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <CheckCircle2 className="h-3 w-3" /> Accepted
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function InviteCard({ invite }: { invite: OrgInvite }) {
  const acceptMutation = useAcceptInvite();
  const rejectMutation = useRejectInvite();

  const adminAvatarUrl = resolveProfileImageUrl(invite.invitedBy?.profileImage);
  const adminInitials = invite.invitedBy?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAccept = async () => {
    try {
      const res = await acceptMutation.mutateAsync(invite._id);
      toast.success(res.message ?? "Joined organization!");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to accept invite");
    }
  };

  const handleReject = async () => {
    try {
      const res = await rejectMutation.mutateAsync(invite._id);
      toast.success(res.message ?? "Invitation declined");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to decline invite");
    }
  };

  const busy = acceptMutation.isPending || rejectMutation.isPending;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            {invite.organization?.name ?? "Unknown Organization"}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-[10px] font-semibold text-white">
                {adminAvatarUrl ? (
                  <img src={adminAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{adminInitials}</span>
                )}
              </div>
              <span>Invited by {invite.invitedBy?.name}</span>
            </div>
            <span>&bull;</span>
            <span>{formatDate(invite.createdAt)}</span>
            <span>&bull;</span>
            <span className="text-amber-600">Expires {formatDate(invite.expiresAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleReject}
          disabled={busy}
          className="border-red-200 text-red-500 hover:bg-red-50"
        >
          <XCircle className="mr-1.5 h-4 w-4" />
          Decline
        </Button>
        <Button type="button" onClick={handleAccept} disabled={busy}>
          <CheckCircle2 className="mr-1.5 h-4 w-4" />
          {acceptMutation.isPending ? "Joining…" : "Accept"}
        </Button>
      </div>
    </div>
  );
}

export default function InvitesPage() {
  const userId = getUserId();
  const { data: invites = [], isLoading } = useMyInvites();
  const { data: allOrgs = [], isLoading: orgsLoading } = useAllOrganizations();
  const { data: myJoinRequests = [] } = useMyJoinRequests();
  const { data: myOrg } = useMyOrganization();
  const sendJoinRequestMutation = useSendJoinRequest();

  const [orgSearch, setOrgSearch] = useState("");
  const [joinMessage, setJoinMessage] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  // Filter out orgs user is already in or has pending requests for
  const pendingRequestOrgIds = new Set(
    myJoinRequests.filter((r) => r.status === "pending").map((r) => r.organization._id)
  );

  const browsableOrgs = allOrgs.filter((org) => {
    if (myOrg && org._id === myOrg._id) return false;
    if (pendingRequestOrgIds.has(org._id)) return false;
    if (orgSearch && !org.name.toLowerCase().includes(orgSearch.toLowerCase())) return false;
    return true;
  });

  const handleSendJoinRequest = async (orgId: string) => {
    try {
      const res = await sendJoinRequestMutation.mutateAsync({
        organizationId: orgId,
        message: joinMessage.trim() || undefined,
      });
      toast.success(res.message ?? "Join request sent!");
      setSelectedOrgId(null);
      setJoinMessage("");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed to send request");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
        <p className="mt-1 text-sm text-gray-500">
          View invitations, browse organizations, and request to join.
        </p>
      </div>

      {/* Current Org */}
      {myOrg && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-violet-600">Your Organization</p>
              <h3 className="text-lg font-bold text-gray-900">{myOrg.name}</h3>
              <p className="text-xs text-gray-500">
                {myOrg.members.length} member{myOrg.members.length !== 1 ? "s" : ""} &bull; Joined{" "}
                {formatDate(myOrg.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Invites */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Mail className="h-5 w-5 text-violet-500" /> Invitations
          {invites.length > 0 && (
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-violet-100 px-1.5 text-xs font-semibold text-violet-700">
              {invites.length}
            </span>
          )}
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400">
            No pending invitations
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <InviteCard key={invite._id} invite={invite} />
            ))}
          </div>
        )}
      </div>

      {/* My Join Requests */}
      {myJoinRequests.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
            <Send className="h-5 w-5 text-violet-500" /> My Join Requests
          </h2>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm divide-y divide-gray-50">
            {myJoinRequests.map((jr) => (
              <div
                key={jr._id}
                className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{jr.organization?.name}</p>
                    <p className="text-xs text-gray-400">
                      Requested {formatDate(jr.createdAt)}
                      {jr.message && <span> &bull; "{jr.message}"</span>}
                    </p>
                  </div>
                </div>
                <RequestStatusBadge status={jr.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Browse Organizations */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Search className="h-5 w-5 text-violet-500" /> Browse Organizations
        </h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search organizations…"
            value={orgSearch}
            onChange={(e) => setOrgSearch(e.target.value)}
            className="w-full max-w-md rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20"
          />
        </div>

        {orgsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        ) : browsableOrgs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center text-sm text-gray-400">
            {orgSearch
              ? "No organizations match your search"
              : "No organizations available to join"}
          </div>
        ) : (
          <div className="space-y-3">
            {browsableOrgs.map((org) => (
              <div
                key={org._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-gray-900">{org.name}</h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {org.memberCount} member
                          {org.memberCount !== 1 ? "s" : ""}
                        </span>
                        <span>&bull;</span>
                        <span>Created by {org.createdBy?.name}</span>
                        <span>&bull;</span>
                        <span>{formatDate(org.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedOrgId === org._id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Message (optional)"
                        value={joinMessage}
                        onChange={(e) => setJoinMessage(e.target.value)}
                        className="w-48 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm outline-none focus:border-violet-400"
                      />
                      <Button
                        type="button"
                        onClick={() => handleSendJoinRequest(org._id)}
                        disabled={sendJoinRequestMutation.isPending}
                      >
                        {sendJoinRequestMutation.isPending ? "Sending…" : "Send"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSelectedOrgId(null);
                          setJoinMessage("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedOrgId(org._id)}
                    >
                      <Send className="mr-1.5 h-4 w-4" />
                      Request to Join
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
