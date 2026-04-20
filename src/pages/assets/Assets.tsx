import { useState } from "react";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  RotateCcw,
  History,
  Laptop,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useAssets,
  useCreateAsset,
  useUpdateAsset,
  useAssignAsset,
  useReturnAsset,
  useDeleteAsset,
} from "../../apis/api/assets";
import { getUserById, useAssignableUsers } from "../../apis/api/auth";
import { getUserId } from "../../utils/auth";
import type {
  Asset,
  AssetCondition,
  AssetStatus,
} from "../../types/asset.types";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { ApiError } from "../../apis/apiService";

const STATUS_COLORS: Record<AssetStatus, string> = {
  available: "bg-emerald-100 text-emerald-700",
  assigned: "bg-blue-100 text-blue-700",
  under_repair: "bg-amber-100 text-amber-700",
  retired: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<AssetStatus, string> = {
  available: "Available",
  assigned: "Assigned",
  under_repair: "Under Repair",
  retired: "Retired",
};

const CONDITION_COLORS: Record<AssetCondition, string> = {
  new: "text-emerald-600",
  good: "text-blue-600",
  fair: "text-amber-600",
  poor: "text-red-600",
};

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type CreateForm = {
  name: string;
  type: string;
  serialNumber: string;
  notes: string;
  conditionOnHandover: AssetCondition;
};

export default function Assets() {
  const userId = getUserId();
  const { data: user } = getUserById(userId);
  const roles = user?.role ?? [];
  const canManage = roles.some((r: string) =>
    ["admin", "hr", "super-admin"].includes(r)
  );
  const { data: employees = [] } = useAssignableUsers();

  const [statusFilter, setStatusFilter] = useState<AssetStatus | "">("");
  const { data: assets = [], isLoading } = useAssets(
    statusFilter ? { status: statusFilter } : {}
  );

  const createMutation = useCreateAsset();
  const updateMutation = useUpdateAsset();
  const assignMutation = useAssignAsset();
  const returnMutation = useReturnAsset();
  const deleteMutation = useDeleteAsset();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Asset | null>(null);
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null);
  const [returnTarget, setReturnTarget] = useState<Asset | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);

  const [form, setForm] = useState<CreateForm>({
    name: "",
    type: "",
    serialNumber: "",
    notes: "",
    conditionOnHandover: "good",
  });

  const [assignForm, setAssignForm] = useState({
    userId: "",
    condition: "good" as AssetCondition,
    note: "",
  });

  const [returnForm, setReturnForm] = useState({
    condition: "good" as AssetCondition,
    note: "",
  });

  const openCreate = () => {
    setForm({ name: "", type: "", serialNumber: "", notes: "", conditionOnHandover: "good" });
    setCreateOpen(true);
  };

  const openEdit = (a: Asset) => {
    setForm({
      name: a.name,
      type: a.type,
      serialNumber: a.serialNumber,
      notes: a.notes,
      conditionOnHandover: a.conditionOnHandover,
    });
    setEditTarget(a);
  };

  const closeAll = () => {
    setCreateOpen(false);
    setEditTarget(null);
    setAssignTarget(null);
    setReturnTarget(null);
    setHistoryTarget(null);
    setDeleteTarget(null);
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.type.trim()) {
      toast.error("Name and type are required");
      return;
    }
    try {
      await createMutation.mutateAsync(form);
      toast.success("Asset created");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    try {
      await updateMutation.mutateAsync({ id: editTarget._id, body: form });
      toast.success("Asset updated");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleAssign = async () => {
    if (!assignTarget || !assignForm.userId) {
      toast.error("Please select an employee");
      return;
    }
    try {
      await assignMutation.mutateAsync({
        id: assignTarget._id,
        ...assignForm,
      });
      toast.success("Asset assigned");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    try {
      await returnMutation.mutateAsync({ id: returnTarget._id, ...returnForm });
      toast.success("Asset returned");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast.success("Asset deleted");
      closeAll();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Failed");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-violet-600" />
            Assets
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track company equipment assigned to employees.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AssetStatus | "")}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="under_repair">Under Repair</option>
            <option value="retired">Retired</option>
          </select>
          {canManage && (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
              Add asset
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Laptop className="h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No assets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Serial</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Assigned Date</th>
                  {canManage && <th className="px-4 py-3">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {asset.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{asset.type}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {asset.serialNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[asset.status]}`}
                      >
                        {STATUS_LABELS[asset.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 flex items-center gap-2">
                      {asset.assignedTo?.profileImage ? <img src={asset.assignedTo.profileImage} alt={asset.assignedTo.name} className="h-6 w-6 rounded-full" /> : <User className="h-6 w-6" />} {asset.assignedTo?.name ?? "—"}
                    </td>
                    <td className={`px-4 py-3 capitalize font-medium ${CONDITION_COLORS[asset.conditionOnHandover]}`}>
                      {asset.conditionOnHandover}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {formatDate(asset.assignedDate)}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setHistoryTarget(asset)}
                            title="History"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          {asset.status !== "assigned" && (
                            <button
                              onClick={() => {
                                setAssignForm({ userId: "", condition: "good", note: "" });
                                setAssignTarget(asset);
                              }}
                              title="Assign"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                          {asset.status === "assigned" && (
                            <button
                              onClick={() => {
                                setReturnForm({ condition: "good", note: "" });
                                setReturnTarget(asset);
                              }}
                              title="Return"
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(asset)}
                            title="Edit"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(asset)}
                            title="Delete"
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={closeAll} title="Add asset" panelClassName="max-w-lg">
        <AssetForm form={form} setForm={setForm} onSubmit={handleCreate} onCancel={closeAll} loading={createMutation.isPending} submitLabel="Create" />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={closeAll} title="Edit asset" panelClassName="max-w-lg">
        <AssetForm form={form} setForm={setForm} onSubmit={handleUpdate} onCancel={closeAll} loading={updateMutation.isPending} submitLabel="Save" />
      </Modal>

      {/* Assign Modal */}
      <Modal isOpen={!!assignTarget} onClose={closeAll} title={`Assign "${assignTarget?.name}"`} panelClassName="max-w-md">
        <div className="flex flex-col gap-4">
          {/* Employee dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="assign-employee">
              Employee <span className="text-red-500">*</span>
            </label>
            <select
              id="assign-employee"
              value={assignForm.userId}
              onChange={(e) => setAssignForm((s) => ({ ...s, userId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">— Select an employee —</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                  {emp.email ? ` (${emp.email})` : ""}
                </option>
              ))}
            </select>
            {employees.length === 0 && (
              <p className="text-xs text-gray-400">No employees found.</p>
            )}
          </div>

          {/* Condition */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="assign-condition">
              Condition on handover
            </label>
            <select
              id="assign-condition"
              value={assignForm.condition}
              onChange={(e) => setAssignForm((s) => ({ ...s, condition: e.target.value as AssetCondition }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>

          {/* Note */}
          <Input
            label="Note (optional)"
            name="note"
            value={assignForm.note}
            onChange={(e) => setAssignForm((s) => ({ ...s, note: e.target.value }))}
            placeholder="Any additional notes"
          />

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closeAll}>Cancel</Button>
            <Button loading={assignMutation.isPending} onClick={handleAssign}>Assign</Button>
          </div>
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal isOpen={!!returnTarget} onClose={closeAll} title={`Return "${returnTarget?.name}"`} panelClassName="max-w-md">
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Condition on return</label>
            <select
              value={returnForm.condition}
              onChange={(e) => setReturnForm((s) => ({ ...s, condition: e.target.value as AssetCondition }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="new">New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
          </div>
          <Input
            label="Note (optional)"
            name="note"
            value={returnForm.note}
            onChange={(e) => setReturnForm((s) => ({ ...s, note: e.target.value }))}
            placeholder="Condition notes on return"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={closeAll}>Cancel</Button>
            <Button loading={returnMutation.isPending} onClick={handleReturn}>Confirm Return</Button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={!!historyTarget} onClose={closeAll} title={`History: ${historyTarget?.name}`} panelClassName="max-w-lg">
        {historyTarget?.transferHistory.length === 0 ? (
          <p className="text-sm text-gray-500">No transfer history yet.</p>
        ) : (
          <ol className="relative border-l border-gray-200 space-y-4 pl-4">
            {historyTarget?.transferHistory.map((t, i) => (
              <li key={i} className="text-sm">
                <span className="absolute -left-1.5 h-3 w-3 rounded-full bg-violet-400 border-2 border-white" />
                <p className="font-medium text-gray-800">
                  {t.fromUser?.name ?? "—"} → {t.toUser?.name ?? "Returned"}
                </p>
                <p className="text-gray-500 text-xs mt-0.5">
                  {formatDate(t.date)} · Condition: {t.condition}
                </p>
                {t.note && <p className="text-gray-500 text-xs">{t.note}</p>}
              </li>
            ))}
          </ol>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={closeAll}>Close</Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteTarget} onClose={closeAll} title="Delete asset">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete{" "}
          <span className="font-medium">"{deleteTarget?.name}"</span>?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={closeAll}>Cancel</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function AssetForm({
  form,
  setForm,
  onSubmit,
  onCancel,
  loading,
  submitLabel,
}: {
  form: CreateForm;
  setForm: React.Dispatch<React.SetStateAction<CreateForm>>;
  onSubmit: () => void;
  onCancel: () => void;
  loading: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Asset name"
        name="name"
        value={form.name}
        onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
        placeholder="e.g. MacBook Pro"
        required
      />
      <Input
        label="Type"
        name="type"
        value={form.type}
        onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}
        placeholder="e.g. Laptop, Phone, Access Card"
        required
      />
      <Input
        label="Serial number"
        name="serialNumber"
        value={form.serialNumber}
        onChange={(e) => setForm((s) => ({ ...s, serialNumber: e.target.value }))}
        placeholder="Optional"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
        <select
          value={form.conditionOnHandover}
          onChange={(e) =>
            setForm((s) => ({ ...s, conditionOnHandover: e.target.value as AssetCondition }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="new">New</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
        </select>
      </div>
      <Input
        label="Notes"
        name="notes"
        type="textarea"
        value={form.notes}
        onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))}
        placeholder="Additional notes"
      />
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
        <Button loading={loading} onClick={onSubmit}>{submitLabel}</Button>
      </div>
    </div>
  );
}
