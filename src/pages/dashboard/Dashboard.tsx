import { getUserId } from "../../utils/auth";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { CircleCheckBig, Download, FolderPlus, NotebookPen, Presentation, User, UserPlus } from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/UI/Model";
import { getUserById, useCreateUserByAdmin, type AdminCreateUserInput } from "../../apis/api/auth";
import { ApiError } from "../../apis/apiService";

const dashboardData = [
  {
    title: "Total Employees",
    value: "1,248",
    change: "+12%",
    positive: true,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <User size={18} />
  },
  {
    title: "Present Today",
    value: "1,180",
    change: "+2%",
    positive: true,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    icon: <User size={18} />
  },
  {
    title: "Absent Today",
    value: "68",
    change: "-5%",
    positive: false,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    icon: <User size={18} />
  },
  {
    title: "Active Projects",
    value: "24",
    change: "+4%",
    positive: true,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: <Presentation size={18} />
  },
];

const attendanceData = [
  { day: "Mon", value: 30 },
  { day: "Tue", value: 50 },
  { day: "Wed", value: 40 },
  { day: "Thu", value: 60 },
  { day: "Fri", value: 30 },
  { day: "Sat", value: 80 },
  { day: "Sun", value: 50 },
];

const taskData = [
  { name: "W1", value: 20 },
  { name: "W2", value: 40 },
  { name: "W3", value: 30 },
  { name: "W4", value: 50 },
  { name: "W5", value: 35 },
];

const projectData = [
  { name: "Active", value: 12, color: "#6366F1" },
  { name: "Done", value: 8, color: "#10B981" },
  { name: "On Hold", value: 4, color: "#F59E0B" },
];
const Dashboard = () => {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const userId = getUserId();
  const { data: sessionUser } = getUserById(userId);
  const createUserMutation = useCreateUserByAdmin();

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as AdminCreateUserInput["role"],
  });

  const sessionRole = sessionUser?.role?.[0];
  const canCreateUsers = sessionRole === "admin" || sessionRole === "super-admin";
  const roleOptions: AdminCreateUserInput["role"][] =
    sessionRole === "super-admin"
      ? ["admin", "employee", "hr", "manager"]
      : ["employee", "hr", "manager"];

  const handleOpen = (modal: string) => {
    setOpenModal(modal);
    if (modal === "employee") {
      setEmployeeForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        password: "",
        role: roleOptions.includes(prev.role) ? prev.role : roleOptions[0],
      }));
    }
  };
  const handleClose = () => {
    setOpenModal(null);
  };

  const handleCreateEmployee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreateUsers) {
      toast.error("Only administrators can create users.");
      return;
    }
    try {
      await createUserMutation.mutateAsync(employeeForm);
      toast.success("User created with the selected role.");
      handleClose();
    } catch (err) {
      const msg = (err as ApiError)?.message || "Could not create user";
      toast.error(msg);
    }
  };
  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div>
          <Button variant="primary" type="button">< Download size={16} /> Export</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
        {dashboardData.map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
          >

            <div className="flex items-center justify-between">


              <div className={`p-2 rounded-lg ${item.iconBg}`}>
                <span className={item.iconColor}>{item.icon}</span>
              </div>


              <span
                className={`text-xs font-semibold ${item.positive ? "text-green-600" : "text-red-500"
                  }`}
              >
                {item.change}
              </span>
            </div>


            <p className="mt-4 text-sm text-gray-500 uppercase tracking-wide">
              {item.title}
            </p>


            <h2 className="mt-1 text-2xl font-bold text-gray-900">
              {item.value}
            </h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">

          {/* Attendance Overview */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Attendance Overview</h2>
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">Last 7 Days</span>
            </div>

            <ResponsiveContainer className="w-full h-full" width="100%" height={250}>
              <LineChart data={attendanceData}>
                <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bottom Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Task Completion */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4">Task Completion Rate</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={taskData}>
                  <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Project Status */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4">Project Status</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={projectData} dataKey="value" innerRadius={50} outerRadius={70}>
                    {projectData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-4 gap-4">
                <span className="text-gray-500 gap-2  text-sm"> <span className="text-blue-700 gap-2 space-x-2.5 mx-1 rounded-full px-2 bg-[#6366F1]"></span> Active </span>
                <span className="text-gray-500 gap-2 text-sm">  <span className="text-green-700 gap-2 space-x-2.5 mx-1 rounded-full px-2 bg-[#10B981]"></span> Done </span>
                <span className="text-gray-500 gap-2 text-sm">  <span className="text-yellow-700 gap-2 space-x-2.5 mx-1 rounded-full px-2 bg-[#F59E0B]"></span> On Hold </span>
              </div>
            </div>
          </div>
        </div>


        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleOpen("employee")} className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <UserPlus size={22} className="text-indigo-600" />
                </div>
                <span className="text-gray-700 font-medium">Add Employee</span>
              </button>

              <button onClick={() => handleOpen("project")} className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition">
                <div className="p-2 rounded-lg bg-purple-100">
                  <FolderPlus size={22} className="text-purple-600" />
                </div>
                <span className="text-gray-700 font-medium">Create Project</span>
              </button>

              <button onClick={() => handleOpen("task")} className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition">
                <div className="p-2 rounded-lg bg-blue-100">
                  <NotebookPen size={22} className="text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">Assign Task</span>
              </button>

              <button onClick={() => handleOpen("leave")} className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition">
                <div className="p-2 rounded-lg bg-green-100">
                  <CircleCheckBig size={22} className="text-green-600" />
                </div>
                <span className="text-gray-700 font-medium">Approve Leave</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Leave Requests</h2>
              <span className="text-xs text-indigo-600 cursor-pointer">View All</span>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span>Sarah Jenkins</span>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-indigo-500 text-white rounded">Approve</button>
                  <button className="px-2 py-1 bg-gray-200 rounded">Decline</button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span>Michael Chen</span>
                <div className="flex gap-2">
                  <button className="px-2 py-1 bg-indigo-500 text-white rounded">Approve</button>
                  <button className="px-2 py-1 bg-gray-200 rounded">Decline</button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-2xl shadow-lg">
            <h2 className="font-semibold mb-2">Today's Summary</h2>
            <p className="text-sm opacity-80 mb-4">Monday, Oct 24th, 2023</p>

            <div className="space-y-3">
              <div className="flex justify-between bg-white/20 px-3 py-2 rounded-lg">
                <span>Meeting with UX Team</span>
                <span>10:00 AM</span>
              </div>
              <div className="flex justify-between bg-white/20 px-3 py-2 rounded-lg">
                <span>HR Policy Review</span>
                <span>02:30 PM</span>
              </div>
              <div className="flex justify-between bg-white/20 px-3 py-2 rounded-lg">
                <span>System Maintenance</span>
                <span>06:00 PM</span>
              </div>
            </div>
          </div>

        </div>
      </div>
      <Modal
        isOpen={!!openModal}
        onClose={handleClose}
        title={
          openModal === "employee"
            ? "Add Employee"
            : openModal === "project"
              ? "Create Project"
              : openModal === "task"
                ? "Assign Task"
                : openModal === "leave"
                  ? "Approve Leave"
                  : ""
        }
      >
        {/* Dynamic Content */}
        {openModal === "employee" &&
          (canCreateUsers ? (
            <form onSubmit={handleCreateEmployee} className="flex flex-col gap-3 mt-1">
              <Input
                label="Full name"
                name="name"
                value={employeeForm.name}
                onChange={(e) =>
                  setEmployeeForm((s) => ({ ...s, name: e.target.value }))
                }
                required
                placeholder="Jane Doe"
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
                placeholder="jane@company.com"
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
                <label className="text-sm font-medium text-gray-700" htmlFor="create-user-role">
                  Role
                </label>
                <select
                  id="create-user-role"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
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
                  This role is saved on the new account and controls what they can access.
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-2">
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
              Only an admin or super-admin can add users and assign roles.
            </p>
          ))}
        {openModal === "project" && <p>Create Project Form Here</p>}
        {openModal === "task" && <p>Assign Task Form Here</p>}
        {openModal === "leave" && <p>Approve Leave UI Here</p>}

        {openModal !== "employee" ? (
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button>Save</Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default Dashboard;
