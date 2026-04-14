import { getUserId } from "../../utils/auth";
import { useCallback, useMemo, useState, type FormEvent } from "react";

type AssignableRole =
  | "super-admin"
  | "admin"
  | "employee"
  | "hr"
  | "manager";

function roleOptionsForActor(
  sessionRole: string | undefined
): AssignableRole[] {
  if (sessionRole === "super-admin") {
    return ["super-admin", "admin", "employee", "hr", "manager"];
  }
  if (sessionRole === "admin") {
    return ["employee", "hr", "manager"];
  }
  return [];
}

function formatRoleLabel(role: string) {
  return role
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("-");
}

function primaryRole(user: User): AssignableRole {
  const r = user.role?.[0];
  if (
    r === "super-admin" ||
    r === "admin" ||
    r === "employee" ||
    r === "hr" ||
    r === "manager"
  ) {
    return r;
  }
  return "employee";
}
import toast from "react-hot-toast";
import {
  getUserById,
  getUsers,
  useCreateUserByAdmin,
  useUpdateUser,
  type AdminCreateUserInput,
} from "../../apis/api/auth";
import { ApiError } from "../../apis/apiService";
import {
  useCreateProject,
  useProjectsList,
  type CreateProjectInput,
} from "../../apis/api/projects";
import Table from "../../components/UI/Table";
import type { Project } from "../../types/project.types";
import type { User } from "../../types/user.types";
import { PlusIcon } from "lucide-react";
import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Model";
import Input from "../../components/UI/Input";
import { PillTabBar } from "../../components/UI/PillTabBar";
import { SettingsTableSkeleton } from "../../components/UI/Skeleton";
import { useNavigate } from "react-router-dom";

const tabs = [
  { key: "user-management", label: "User Management" },
  { key: "role-management", label: "Role & Access Control" },
  { key: "projects", label: "Projects" },
];

const Settings = () => {

  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("user-management");
  const { data: users = [], isLoading } = getUsers();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsList(100);
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<CreateProjectInput>({
    projectName: "",
    description: "",
  });
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as AdminCreateUserInput["role"],
    phone: "",
    gender: "" as "" | "male" | "female",
    dob: "",
    addressLine: "",
    addressCity: "",
    aadharCardNumber: "",
    panCardNumber: "",
    bankAccountNo: "",
    bankName: "",
    bankIFSC: "",
    bankBranch: "",
    skillsJson: "",
    educationJson: "",
    experienceJson: "",
    leavesJson: "",
  });
  const userId = getUserId();
  const { data: sessionUser } = getUserById(userId);
  const createUserMutation = useCreateUserByAdmin();
  const createProjectMutation = useCreateProject();
  const updateUserMutation = useUpdateUser();
  const sessionRole = sessionUser?.role?.[0];
  const canCreateUsers = sessionRole === "admin" || sessionRole === "super-admin";
  const canToggleUserActive =
    sessionRole === "admin" || sessionRole === "super-admin";
  const canManageRoles =
    sessionRole === "admin" || sessionRole === "super-admin";
  const canCreateProjects =
    sessionRole === "admin" ||
    sessionRole === "manager" ||
    sessionRole === "super-admin";
  const roleOptions: AdminCreateUserInput["role"][] =
    sessionRole === "super-admin"
      ? ["admin", "employee", "hr", "manager"]
      : ["employee", "hr", "manager"];

  const handleClose = () => {
    setOpenModal(null);
  };

  const handleOpenCreateUser = () => {
    if (!canCreateUsers) {
      toast.error("Only an admin or super-admin can create users.");
      return;
    }
    setEmployeeForm({
      name: "",
      email: "",
      password: "",
      role: roleOptions[0],
      phone: "",
      gender: "",
      dob: "",
      addressLine: "",
      addressCity: "",
      aadharCardNumber: "",
      panCardNumber: "",
      bankAccountNo: "",
      bankName: "",
      bankIFSC: "",
      bankBranch: "",
      skillsJson: "",
      educationJson: "",
      experienceJson: "",
      leavesJson: "",
    });
    setOpenModal("createUser");
  };

  const handleSubmitCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreateUsers) return;
    try {
      const parseFlexibleList = (raw: string): unknown[] | undefined => {
        const txt = raw.trim();
        if (!txt) return undefined;
        if (txt.startsWith("[")) {
          const parsed = JSON.parse(txt);
          return Array.isArray(parsed) ? parsed : undefined;
        }
        return txt
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      };

      const body: AdminCreateUserInput = {
        name: employeeForm.name,
        email: employeeForm.email,
        password: employeeForm.password,
        role: employeeForm.role,
        phone: employeeForm.phone.trim() ? employeeForm.phone.trim() : undefined,
        gender: employeeForm.gender ? (employeeForm.gender as "male" | "female") : undefined,
        dob: employeeForm.dob.trim() ? employeeForm.dob.trim() : undefined,
        address:
          employeeForm.addressLine.trim() || employeeForm.addressCity.trim()
            ? [{ address: employeeForm.addressLine.trim() || undefined, city: employeeForm.addressCity.trim() || undefined }]
            : undefined,
        aadharCardNumber: employeeForm.aadharCardNumber.trim() || undefined,
        panCardNumber: employeeForm.panCardNumber.trim() || undefined,
        bankAccountNo: employeeForm.bankAccountNo.trim() || undefined,
        bankName: employeeForm.bankName.trim() || undefined,
        bankIFSC: employeeForm.bankIFSC.trim() || undefined,
        bankBranch: employeeForm.bankBranch.trim() || undefined,
        skills: (() => {
          const list = parseFlexibleList(employeeForm.skillsJson);
          if (!list) return undefined;
          // If user pasted objects, keep as-is. If they typed "a, b", map to {skill}.
          if (list.length && typeof list[0] === "object") return list as any;
          return (list as string[]).map((skill) => ({ skill }));
        })(),
        education: (() => {
          const list = parseFlexibleList(employeeForm.educationJson);
          if (!list) return undefined;
          if (list.length && typeof list[0] === "object") return list as any;
          return (list as string[]).map((degree) => ({ degree }));
        })(),
        experience: (() => {
          const list = parseFlexibleList(employeeForm.experienceJson);
          if (!list) return undefined;
          if (list.length && typeof list[0] === "object") return list as any;
          return (list as string[]).map((company) => ({ company }));
        })(),
        leaves: (() => {
          const list = parseFlexibleList(employeeForm.leavesJson);
          if (!list) return undefined;
          if (list.length && typeof list[0] === "object") return list as any;
          // allow "24, 12" -> [{totalBalance:24},{totalBalance:12}]
          return (list as string[])
            .map((v) => Number(v))
            .filter((n) => Number.isFinite(n))
            .map((totalBalance) => ({ totalBalance }));
        })(),
      };

      await createUserMutation.mutateAsync(body);
      toast.success("User created with the selected role.");
      handleClose();
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not create user");
    }
  };

  const handleOpenCreateProject = () => {
    if (!canCreateProjects) {
      toast.error("Only an admin, manager, or super-admin can create projects.");
      return;
    }
    setProjectForm({ projectName: "", description: "" });
    setOpenModal("createProject");
  };

  const handleSubmitCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreateProjects) return;
    try {
      await createProjectMutation.mutateAsync(projectForm);
      toast.success("Project created.");
      handleClose();
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not create project");
    }
  };

  const [savingRoleUserId, setSavingRoleUserId] = useState<string | null>(null);

  const handleRoleAssignmentChange = useCallback(
    async (row: User, newRole: AssignableRole) => {
      if (!canManageRoles) return;
      const current = primaryRole(row);
      if (newRole === current) return;
      if (row._id === sessionUser?._id) {
        toast.error("You cannot change your own role here.");
        return;
      }
      if (sessionRole === "admin" && row.role?.includes("super-admin")) {
        toast.error("Only a super-admin can change roles for a super-admin account.");
        return;
      }
      setSavingRoleUserId(row._id);
      try {
        await updateUserMutation.mutateAsync({
          id: row._id,
          data: { role: newRole } as unknown as Partial<User>,
        });
        toast.success(`Role updated to ${formatRoleLabel(newRole)}.`);
      } catch (err) {
        toast.error((err as ApiError)?.message || "Could not update role");
      } finally {
        setSavingRoleUserId(null);
      }
    },
    [canManageRoles, sessionRole, sessionUser?._id, updateUserMutation]
  );

  const handleToggleUserActive = useCallback(
    async (row: User) => {
      if (!canToggleUserActive) return;
      if (row._id === sessionUser?._id) {
        toast.error("You cannot change your own account status here.");
        return;
      }
      try {
        await updateUserMutation.mutateAsync({
          id: row._id,
          data: { isActive: !row.isActive },
        });
        toast.success(row.isActive ? "User deactivated." : "User activated.");
      } catch (err) {
        toast.error((err as ApiError)?.message || "Could not update status");
      }
    },
    [canToggleUserActive, sessionUser?._id, updateUserMutation]
  );

  const columns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (row: User) => {

          return (
            <div className="flex min-w-0 items-center gap-2 cursor-pointer hover:text-blue-500 hover:underline " onClick={() => navigate(`/user/${row._id}`)}>
              <div className="flex items-center gap-2">
                <img
                  src={row.profileImage ?? ""}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover"
                />
                <span className="min-w-0 truncate" title={row.name}>
                  {row.name}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        key: "email",
        label: "Email",
      },
      {
        key: "role",
        label: "Role",
        render: (row: User) => row.role?.join(", ") || "employee",
      },
      {
        key: "verified",
        label: "Verified",
        render: (row: User) => {
          const isVerified = Boolean((row as User & { isEmailVerified?: boolean }).isEmailVerified);
          return (
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isVerified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
            >
              {isVerified ? "Yes" : "No"}
            </span>
          );
        },
      },
      {
        key: "status",
        label: "Status",
        render: (row: User) => (
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${row.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              }`}
          >
            {row.isActive ? "Active" : "Inactive"}
          </span>
        ),
      },
      ...(canToggleUserActive
        ? [
            {
              key: "actions",
              label: "Account",
              render: (row: User) => {
                if (row._id === sessionUser?._id) {
                  return <span className="text-xs text-gray-400">—</span>;
                }
                return (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-lg px-3 py-1.5 text-xs font-medium"
                    disabled={updateUserMutation.isPending}
                    onClick={() => void handleToggleUserActive(row)}
                  >
                    {row.isActive ? "Deactivate" : "Activate"}
                  </Button>
                );
              },
            },
          ]
        : []),
    ],
    [
      canToggleUserActive,
      sessionUser?._id,
      handleToggleUserActive,
      updateUserMutation.isPending,
    ]
  );

  const roleManagementColumns = useMemo(
    () => [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      {
        key: "roleDisplay",
        label: "Current role",
        render: (row: User) => (
          <span className="font-medium text-gray-800">
            {formatRoleLabel(primaryRole(row))}
          </span>
        ),
      },
      ...(canManageRoles
        ? [
            {
              key: "assignRole",
              label: "Change role",
              render: (row: User) => {
                if (row._id === sessionUser?._id) {
                  return (
                    <span className="text-xs text-gray-400">Your account</span>
                  );
                }
                if (sessionRole === "admin" && row.role?.includes("super-admin")) {
                  return (
                    <span className="text-xs text-gray-500">
                      Super-admin accounts are read-only for admins
                    </span>
                  );
                }
                const current = primaryRole(row);
                const base = roleOptionsForActor(sessionRole);
                const optionSet = new Set<AssignableRole>(base);
                optionSet.add(current);
                const options = Array.from(optionSet).sort((a, b) =>
                  a.localeCompare(b)
                );
                const busy =
                  savingRoleUserId === row._id || updateUserMutation.isPending;
                return (
                  <select
                    className="w-full max-w-[220px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-50"
                    value={current}
                    disabled={busy}
                    aria-label={`Role for ${row.name}`}
                    onChange={(e) =>
                      void handleRoleAssignmentChange(
                        row,
                        e.target.value as AssignableRole
                      )
                    }
                  >
                    {options.map((r) => (
                      <option key={r} value={r}>
                        {formatRoleLabel(r)}
                      </option>
                    ))}
                  </select>
                );
              },
            },
          ]
        : []),
    ],
    [
      canManageRoles,
      sessionRole,
      sessionUser?._id,
      savingRoleUserId,
      updateUserMutation.isPending,
      handleRoleAssignmentChange,
    ]
  );

  const projectColumns = [
    { key: "projectName", label: "Project" },
    {
      key: "description",
      label: "Description",
      render: (row: Project) => (
        <span className="line-clamp-2 text-gray-700">
          {row.description?.trim() || "—"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row: Project) =>
        row.createdAt
          ? new Date(row.createdAt).toLocaleDateString()
          : "—",
    },
  ];

  const projectsForTable = projects.map((p) => ({
    ...p,
    id: p._id,
  }));

  return (
    <div className="p-3 sm:p-6 bg-gray-50 min-h-screen space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500">
          Manage your company preferences and personal account settings.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PillTabBar
            items={tabs.map((t) => ({ key: t.key, label: t.label }))}
            activeKey={activeTab}
            onTabChange={setActiveTab}
          />

          {activeTab === "user-management" && canCreateUsers ? (
            <Button
              type="button"
              onClick={handleOpenCreateUser}
              variant="primary"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add user
            </Button>
          ) : null}
          {activeTab === "projects" && canCreateProjects ? (
            <Button
              type="button"
              onClick={handleOpenCreateProject}
              variant="primary"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add project
            </Button>
          ) : null}
        </div>

        <Modal
          isOpen={openModal === "createUser"}
          onClose={handleClose}
          title="Create user"
        >
          {canCreateUsers ? (
            <form
              onSubmit={handleSubmitCreateUser}
              className="mt-1 flex flex-col gap-3"
            >
              <Input
                label="Name"
                name="name"
                type="text"
                value={employeeForm.name}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, name: e.target.value }))
                }
                required
                placeholder="Full name"
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={employeeForm.email}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, email: e.target.value }))
                }
                required
                placeholder="email@company.com"
              />
              <Input
                label="Temporary password"
                name="password"
                type="password"
                value={employeeForm.password}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, password: e.target.value }))
                }
                required
                placeholder="At least 6 characters"
              />
              <Input
                label="Phone"
                name="phone"
                type="tel"
                value={employeeForm.phone}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, phone: e.target.value }))
                }
                placeholder="+91 9876543210"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="settings-create-user-gender">
                    Gender
                  </label>
                  <select
                    id="settings-create-user-gender"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                    value={employeeForm.gender}
                    onChange={(e) =>
                      setEmployeeForm((s) => ({
                        ...s,
                        gender: e.target.value as "" | "male" | "female",
                      }))
                    }
                  >
                    <option value="">—</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <Input
                  label="Date of birth"
                  name="dob"
                  type="date"
                  value={employeeForm.dob}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, dob: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Address"
                  name="addressLine"
                  type="text"
                  value={employeeForm.addressLine}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, addressLine: e.target.value }))
                  }
                  placeholder="Street / apartment"
                />
                <Input
                  label="City"
                  name="addressCity"
                  type="text"
                  value={employeeForm.addressCity}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, addressCity: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Aadhar card number"
                  name="aadharCardNumber"
                  type="text"
                  value={employeeForm.aadharCardNumber}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, aadharCardNumber: e.target.value }))
                  }
                />
                <Input
                  label="PAN card number"
                  name="panCardNumber"
                  type="text"
                  value={employeeForm.panCardNumber}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, panCardNumber: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Bank account no"
                  name="bankAccountNo"
                  type="text"
                  value={employeeForm.bankAccountNo}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, bankAccountNo: e.target.value }))
                  }
                />
                <Input
                  label="Bank name"
                  name="bankName"
                  type="text"
                  value={employeeForm.bankName}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, bankName: e.target.value }))
                  }
                />
                <Input
                  label="IFSC"
                  name="bankIFSC"
                  type="text"
                  value={employeeForm.bankIFSC}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, bankIFSC: e.target.value }))
                  }
                />
                <Input
                  label="Branch"
                  name="bankBranch"
                  type="text"
                  value={employeeForm.bankBranch}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({ ...s, bankBranch: e.target.value }))
                  }
                />
              </div>
              <Input
                label="Skills"
                name="skillsJson"
                type="textarea"
                value={employeeForm.skillsJson}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, skillsJson: e.target.value }))
                }
                placeholder='e.g. React, Node, MongoDB'
              />
              <Input
                label="Education"
                name="educationJson"
                type="textarea"
                value={employeeForm.educationJson}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, educationJson: e.target.value }))
                }
                placeholder='e.g. BSc, MSc'
              />
              <Input
                label="Experience"
                name="experienceJson"
                type="textarea"
                value={employeeForm.experienceJson}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, experienceJson: e.target.value }))
                }
                placeholder='e.g. Company A, Company B'
              />
              <div className="flex flex-col gap-1">
                <label
                  className="text-sm font-medium text-gray-700"
                  htmlFor="settings-create-user-role"
                >
                  Role
                </label>
                <select
                  id="settings-create-user-role"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                  value={employeeForm.role}
                  onChange={(e) =>
                    setEmployeeForm((s) => ({
                      ...s,
                      role: e.target.value as AdminCreateUserInput["role"],
                    }))
                  }
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  This role is saved on the new account and controls what they
                  can access.
                </p>
              </div>
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Creating…" : "Create user"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600">
              Only an admin or super-admin can create users.
            </p>
          )}
        </Modal>

        <Modal
          isOpen={openModal === "createProject"}
          onClose={handleClose}
          title="Create project"
        >
          {canCreateProjects ? (
            <form
              onSubmit={handleSubmitCreateProject}
              className="mt-1 flex flex-col gap-3"
            >
              <Input
                label="Project name"
                name="projectName"
                value={projectForm.projectName}
                onChange={(e) =>
                  setProjectForm((s) => ({
                    ...s,
                    projectName: e.target.value,
                  }))
                }
                required
                placeholder="e.g. Website redesign"
              />
              <Input
                label="Description"
                name="description"
                type="textarea"
                value={projectForm.description}
                onChange={(e) =>
                  setProjectForm((s) => ({
                    ...s,
                    description: e.target.value,
                  }))
                }
                required
                placeholder="What this project is about"
              />
              <div className="mt-2 flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProjectMutation.isPending}>
                  {createProjectMutation.isPending ? "Creating…" : "Create project"}
                </Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-gray-600">
              Only an admin, manager, or super-admin can create projects.
            </p>
          )}
        </Modal>

        <div className="mt-6">
          {activeTab === "user-management" && (
            <div className="rounded-xl p-4 text-sm text-gray-600">
              {isLoading ? (
                <SettingsTableSkeleton rows={8} />
              ) : (
                <Table columns={columns} data={users} />
              )}
            </div>
          )}
          {activeTab === "role-management" && (
            <div className="rounded-xl p-4 text-sm text-gray-600 space-y-3">
              <p className="text-gray-600">
                {canManageRoles
                  ? "Assign roles to control what each user can access. Changes apply on the user’s next request."
                  : "Only an administrator or super-admin can change user roles. You can still view the list below."}
              </p>
              {isLoading ? (
                <SettingsTableSkeleton rows={8} />
              ) : (
                <Table columns={roleManagementColumns} data={users} />
              )}
            </div>
          )}
          {activeTab === "projects" && (
            <div className="rounded-xl p-4 text-sm text-gray-600">
              {projectsLoading ? (
                <SettingsTableSkeleton rows={5} />
              ) : projectsForTable.length === 0 ? (
                <p className="text-gray-500">
                  No projects yet. Use &quot;Add project&quot; to create one.
                </p>
              ) : (
                <Table columns={projectColumns} data={projectsForTable} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;