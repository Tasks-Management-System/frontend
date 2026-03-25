import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import {
  getUserById,
  getUsers,
  useCreateUserByAdmin,
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

const tabs = [
  { key: "user-management", label: "User Management" },
  { key: "role-management", label: "Role & Access Control" },
  { key: "projects", label: "Projects" },
];

const Settings = () => {
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
  });
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") ?? "" : "";
  const { data: sessionUser } = getUserById(userId);
  const createUserMutation = useCreateUserByAdmin();
  const createProjectMutation = useCreateProject();
  const sessionRole = sessionUser?.role?.[0];
  const canCreateUsers = sessionRole === "admin" || sessionRole === "super-admin";
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
    });
    setOpenModal("createUser");
  };

  const handleSubmitCreateUser = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreateUsers) return;
    try {
      await createUserMutation.mutateAsync(employeeForm);
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

  const columns = [
    {
      key: "name",
      label: "Name",
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
        const isVerified = Boolean((row as any).isEmailVerified);
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
  ];

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
                <p className="text-gray-500">Loading users...</p>
              ) : (
                <Table columns={columns} data={users} />
              )}
            </div>
          )}
          {activeTab === "role-management" && (
            <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-600">
              Security settings section coming soon.
            </div>
          )}
          {activeTab === "projects" && (
            <div className="rounded-xl p-4 text-sm text-gray-600">
              {projectsLoading ? (
                <p className="text-gray-500">Loading projects...</p>
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