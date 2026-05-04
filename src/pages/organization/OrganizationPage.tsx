import { useState } from "react";
import {
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCreateOrganization, useMyOrgContext } from "../../apis/api/organization";
import { useUserById } from "../../apis/api/auth";
import { getUserId } from "../../utils/session";
import { ApiError } from "../../apis/apiService";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { useActiveOrg, type OrgMode } from "../../contexts/ActiveOrgContext";
import { AdminOrgView } from "./AdminOrgView";
import { MemberOrgView } from "./MemberOrgView";

export default function OrganizationPage() {
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const roles = sessionUser?.role ?? [];
  const isAdmin = roles.some((r: string) => ["admin", "super-admin"].includes(r));

  const { data: context, isLoading } = useMyOrgContext();
  const createOrgMutation = useCreateOrganization();

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
                  activeMode === "owned" ? "bg-violet-600 text-white" : "bg-gray-200 text-gray-500"
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
                  activeMode === "member" ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-500"
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

      {isLoading && <div className="h-40 animate-pulse rounded-2xl bg-gray-100" />}

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

      {!isLoading && (
        <>
          {hasBoth && activeMode === "owned" && <AdminOrgView org={ownedOrg!} userId={userId} />}
          {hasBoth && activeMode === "member" && (
            <MemberOrgView org={memberOrg!} userId={userId} />
          )}
          {!hasBoth && ownedOrg && <AdminOrgView org={ownedOrg} userId={userId} />}
          {!hasBoth && !ownedOrg && memberOrg && (
            <MemberOrgView org={memberOrg} userId={userId} />
          )}
        </>
      )}

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
