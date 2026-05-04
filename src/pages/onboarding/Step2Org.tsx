import { useState } from "react";
import toast from "react-hot-toast";
import { Building2, SkipForward } from "lucide-react";
import { useCreateOrganization } from "../../apis/api/organization";
import { ApiError } from "../../apis/apiService";

type Step2OrgProps = {
  onSkip: () => void;
  onDone: () => void;
};

export function Step2Org({ onSkip, onDone }: Step2OrgProps) {
  const [orgName, setOrgName] = useState("");
  const createOrg = useCreateOrganization();

  const handleCreate = async () => {
    if (!orgName.trim()) return;
    try {
      await createOrg.mutateAsync(orgName.trim());
      toast.success("Organization created!");
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to create organization.");
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Organization Name</label>
        <input
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="e.g. Acme Pvt Ltd"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleCreate}
          disabled={!orgName.trim() || createOrg.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Building2 className="h-4 w-4" />
          {createOrg.isPending ? "Creating…" : "Create Organization"}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          <SkipForward className="h-4 w-4" />
          Skip for now
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        You can create an organization anytime from the sidebar.
      </p>
    </div>
  );
}
