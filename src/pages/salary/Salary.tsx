import { useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Edit3,
  Inbox,
  Plus,
  Trash2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useUsers } from "../../apis/api/auth";
import {
  useCreateSalary,
  useDeleteSalary,
  useGenerateSalaryPdf,
  useGetSalary,
  useUpdateSalary,
  type SalaryRecord,
} from "../../apis/api/salary";
import { ApiError } from "../../apis/apiService";
import Button from "../../components/UI/Button";
import Dropdown from "../../components/UI/Dropdown";
import Input from "../../components/UI/Input";
import Modal from "../../components/UI/Model";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const PAGE_SIZE = 10;

const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

function employeeName(record: SalaryRecord): string {
  const emp = record.employee;
  if (typeof emp === "object" && emp !== null && "name" in emp) {
    return emp.name ?? "—";
  }
  return "—";
}

function localYmd() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function Salary() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetSalary(page, PAGE_SIZE);

  const salaryList = data?.salary ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const hasNextPage = data?.hasNextPage ?? false;
  const hasPreviousPage = data?.hasPreviousPage ?? false;

  // Employee list for the create form
  const { data: users = [] } = useUsers();
  const employeeOptions = (users as { _id: string; name: string }[]).map((u) => ({
    label: u.name,
    value: u._id,
  }));

  // --- Create modal ---
  const [createOpen, setCreateOpen] = useState(false);
  const [employee, setEmployee] = useState("");
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [basicSalary, setBasicSalary] = useState("");
  const [bonus, setBonus] = useState("0");
  const [deductions, setDeductions] = useState("0");
  const [payDate, setPayDate] = useState(() => localYmd());
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateSalary();

  const openCreate = () => {
    setEmployee("");
    setMonth(MONTHS[new Date().getMonth()]);
    setYear(new Date().getFullYear().toString());
    setBasicSalary("");
    setBonus("0");
    setDeductions("0");
    setPayDate(localYmd());
    setFormError(null);
    setCreateOpen(true);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!employee) {
      setFormError("Please select an employee.");
      return;
    }
    if (!basicSalary || Number(basicSalary) <= 0) {
      setFormError("Basic salary must be greater than 0.");
      return;
    }

    try {
      const res = await createMutation.mutateAsync({
        employee,
        month,
        year: Number(year),
        basicSalary: Number(basicSalary),
        bonus: Number(bonus) || 0,
        deductions: Number(deductions) || 0,
        payDate,
      });
      toast.success(res.message ?? "Salary slip created");
      setCreateOpen(false);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not create salary slip");
    }
  };

  // --- Edit modal ---
  const [editRecord, setEditRecord] = useState<SalaryRecord | null>(null);
  const [editBasic, setEditBasic] = useState("");
  const [editBonus, setEditBonus] = useState("");
  const [editDeductions, setEditDeductions] = useState("");

  const updateMutation = useUpdateSalary();

  const openEdit = (record: SalaryRecord) => {
    setEditRecord(record);
    setEditBasic(String(record.basicSalary));
    setEditBonus(String(record.bonus));
    setEditDeductions(String(record.deductions));
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    if (!editRecord) return;

    try {
      const res = await updateMutation.mutateAsync({
        id: editRecord._id,
        body: {
          basicSalary: Number(editBasic),
          bonus: Number(editBonus) || 0,
          deductions: Number(editDeductions) || 0,
        },
      });
      toast.success(res.message ?? "Salary updated");
      setEditRecord(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not update salary");
    }
  };

  // --- Delete ---
  const deleteMutation = useDeleteSalary();
  const [deleteTarget, setDeleteTarget] = useState<SalaryRecord | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteMutation.mutateAsync(deleteTarget._id);
      toast.success(res.message ?? "Salary slip deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not delete salary");
    }
  };

  // --- PDF ---
  const pdfMutation = useGenerateSalaryPdf();

  const handleDownloadPdf = async (id: string) => {
    try {
      const blob = await pdfMutation.mutateAsync(id);

      // Create URL
      const url = window.URL.createObjectURL(blob);

      // Create anchor
      const a = document.createElement("a");
      a.href = url;
      // eslint-disable-next-line react-hooks/purity
      a.download = `salary-slip-${Date.now()}.pdf`;

      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF downloaded successfully");
    } catch {
      toast.error("Failed to download PDF");
    }
  };

  // Reset page when navigating beyond bounds
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const sliceStart = (page - 1) * PAGE_SIZE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Salary Slips</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create, manage, and download employee salary slips.
          </p>
        </div>
        <Button type="button" leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
          Create Salary
        </Button>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Total Records</p>
              <p className="text-xl font-semibold text-slate-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Total Net Salary</p>
              <p className="text-xl font-semibold text-slate-900">
                {currencyFmt.format(salaryList.reduce((sum, s) => sum + s.netSalary, 0))}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <DollarSign className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-slate-500">Current Page</p>
              <p className="text-xl font-semibold text-slate-900">
                {page} / {totalPages}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Month / Year</th>
                <th className="px-4 py-3">Basic Salary</th>
                <th className="px-4 py-3">Bonus</th>
                <th className="px-4 py-3">Deductions</th>
                <th className="px-4 py-3">Net Salary</th>
                <th className="px-4 py-3">Pay Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 animate-pulse">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-3/4 rounded bg-slate-200" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : salaryList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <Inbox className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                    No salary slips found. Create one to get started.
                  </td>
                </tr>
              ) : (
                salaryList.map((row) => (
                  <tr
                    key={row._id}
                    className="border-b border-slate-100 text-slate-800 hover:bg-slate-50/50 transition"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">{employeeName(row)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {row.month} {row.year}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {currencyFmt.format(row.basicSalary)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-emerald-700">
                      +{currencyFmt.format(row.bonus)}
                    </td>
                    <td className="px-4 py-3 tabular-nums text-red-600">
                      -{currencyFmt.format(row.deductions)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold tabular-nums text-slate-900">
                        {currencyFmt.format(row.netSalary)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(row.payDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          title="Download PDF"
                          onClick={() => handleDownloadPdf(row._id)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget(row)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!isLoading && total > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 text-slate-600 sm:flex-row">
            <p className="text-sm tabular-nums">
              Showing{" "}
              <span className="font-medium text-slate-900">
                {sliceStart + 1}–{Math.min(sliceStart + PAGE_SIZE, total)}
              </span>{" "}
              of <span className="font-medium text-slate-900">{total}</span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!hasPreviousPage}
                onClick={() => setPage(page - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous
              </button>
              <span className="min-w-20 text-center text-sm tabular-nums">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={!hasNextPage}
                onClick={() => setPage(page + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Salary Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => !createMutation.isPending && setCreateOpen(false)}
        title="Create Salary Slip"
        panelClassName="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Dropdown
            label="Employee"
            placeholder="Select employee"
            options={employeeOptions}
            value={employee}
            onChange={(val) => setEmployee(val)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Dropdown
              label="Month"
              options={MONTHS.map((m) => ({ label: m, value: m }))}
              value={month}
              onChange={(val) => setMonth(val)}
            />
            <Input
              label="Year"
              name="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min={2020}
              max={2099}
              required
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Basic Salary"
              name="basicSalary"
              type="number"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              placeholder="e.g. 50000"
              min={0}
              required
            />
            <Input
              label="Bonus"
              name="bonus"
              type="number"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              placeholder="0"
              min={0}
            />
            <Input
              label="Deductions"
              name="deductions"
              type="number"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              placeholder="0"
              min={0}
            />
          </div>

          {(basicSalary || bonus || deductions) && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">Net Salary: </span>
              <span className="font-semibold text-slate-900">
                {currencyFmt.format(
                  (Number(basicSalary) || 0) + (Number(bonus) || 0) - (Number(deductions) || 0)
                )}
              </span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Pay Date</label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {formError && (
            <p className="text-sm text-red-600" role="alert">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={createMutation.isPending}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending}>
              Create Slip
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Salary Modal */}
      <Modal
        isOpen={!!editRecord}
        onClose={() => !updateMutation.isPending && setEditRecord(null)}
        title="Edit Salary Slip"
        panelClassName="max-w-md"
      >
        {editRecord && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900">{employeeName(editRecord)}</p>
              <p className="mt-1 text-slate-500">
                {editRecord.month} {editRecord.year}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Basic Salary"
                name="editBasic"
                type="number"
                value={editBasic}
                onChange={(e) => setEditBasic(e.target.value)}
                min={0}
                required
              />
              <Input
                label="Bonus"
                name="editBonus"
                type="number"
                value={editBonus}
                onChange={(e) => setEditBonus(e.target.value)}
                min={0}
              />
              <Input
                label="Deductions"
                name="editDeductions"
                type="number"
                value={editDeductions}
                onChange={(e) => setEditDeductions(e.target.value)}
                min={0}
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <span className="text-slate-500">Net Salary: </span>
              <span className="font-semibold text-slate-900">
                {currencyFmt.format(
                  (Number(editBasic) || 0) +
                    (Number(editBonus) || 0) -
                    (Number(editDeductions) || 0)
                )}
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={updateMutation.isPending}
                onClick={() => setEditRecord(null)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Update Salary
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteMutation.isPending && setDeleteTarget(null)}
        title="Delete Salary Slip"
        panelClassName="max-w-sm"
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete the salary slip for{" "}
              <span className="font-semibold text-slate-900">{employeeName(deleteTarget)}</span> (
              {deleteTarget.month} {deleteTarget.year})? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleteMutation.isPending}
                onClick={() => void handleDelete()}
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
