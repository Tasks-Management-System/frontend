import { getUserId } from "../../utils/auth";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import {
  Activity,
  Cake,
  CalendarCheck,
  CircleCheckBig,
  Download,
  FolderPlus,
  ListTodo,
  NotebookPen,
  Presentation,
  User,
  UserPlus,
} from "lucide-react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useMemo, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import Modal from "../../components/UI/Model";
import { getUserById, useCreateUserByAdmin, type AdminCreateUserInput } from "../../apis/api/auth";
import { useTasksList } from "../../apis/api/tasks";
import { ApiError } from "../../apis/apiService";

type ChartRange = "today" | "week" | "month" | "custom";

const dashboardData = [
  {
    title: "Total Employees",
    value: "1,248",
    change: "+12%",
    positive: true,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: <User size={18} />,
  },
  {
    title: "Present Today",
    value: "1,180",
    change: "+2%",
    positive: true,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    icon: <User size={18} />,
  },
  {
    title: "Absent Today",
    value: "68",
    change: "-5%",
    positive: false,
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    icon: <User size={18} />,
  },
  {
    title: "Active Projects",
    value: "24",
    change: "+4%",
    positive: true,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: <Presentation size={18} />,
  },
];

const attendanceDataSets: Record<string, { day: string; value: number }[]> = {
  today: [
    { day: "6AM", value: 10 },
    { day: "8AM", value: 45 },
    { day: "10AM", value: 80 },
    { day: "12PM", value: 75 },
    { day: "2PM", value: 70 },
    { day: "4PM", value: 60 },
    { day: "6PM", value: 30 },
  ],
  week: [
    { day: "Mon", value: 30 },
    { day: "Tue", value: 50 },
    { day: "Wed", value: 40 },
    { day: "Thu", value: 60 },
    { day: "Fri", value: 30 },
    { day: "Sat", value: 80 },
    { day: "Sun", value: 50 },
  ],
  month: [
    { day: "W1", value: 220 },
    { day: "W2", value: 280 },
    { day: "W3", value: 310 },
    { day: "W4", value: 290 },
  ],
  custom: [
    { day: "Mon", value: 30 },
    { day: "Tue", value: 50 },
    { day: "Wed", value: 40 },
    { day: "Thu", value: 60 },
    { day: "Fri", value: 30 },
    { day: "Sat", value: 80 },
    { day: "Sun", value: 50 },
  ],
};

const taskDataSets: Record<string, { name: string; value: number }[]> = {
  today: [
    { name: "9AM", value: 5 },
    { name: "12PM", value: 12 },
    { name: "3PM", value: 8 },
    { name: "6PM", value: 15 },
  ],
  week: [
    { name: "W1", value: 20 },
    { name: "W2", value: 40 },
    { name: "W3", value: 30 },
    { name: "W4", value: 50 },
    { name: "W5", value: 35 },
  ],
  month: [
    { name: "Week 1", value: 45 },
    { name: "Week 2", value: 62 },
    { name: "Week 3", value: 55 },
    { name: "Week 4", value: 71 },
  ],
  custom: [
    { name: "W1", value: 20 },
    { name: "W2", value: 40 },
    { name: "W3", value: 30 },
    { name: "W4", value: 50 },
    { name: "W5", value: 35 },
  ],
};

const projectData = [
  { name: "Active", value: 12, color: "#6366F1" },
  { name: "Done", value: 8, color: "#10B981" },
  { name: "On Hold", value: 4, color: "#F59E0B" },
];

// Mock birthdays data
const birthdaysThisWeek = [
  { name: "Sarah Johnson", date: "Apr 16", department: "Engineering" },
  { name: "Mike Chen", date: "Apr 17", department: "Design" },
  { name: "Emma Wilson", date: "Apr 19", department: "Marketing" },
];

// Mock activity feed
const recentActivity = [
  { action: "Task completed", detail: "API Integration - by John D.", time: "5m ago", type: "task" },
  { action: "Leave approved", detail: "Sarah J. - 2 days sick leave", time: "15m ago", type: "leave" },
  { action: "New employee", detail: "Alex Kim joined Engineering", time: "1h ago", type: "user" },
  { action: "Project updated", detail: "Mobile App v2.0 - milestone reached", time: "2h ago", type: "project" },
  { action: "Attendance alert", detail: "3 employees late today", time: "3h ago", type: "attendance" },
  { action: "Task created", detail: "Design System Update - assigned to Design team", time: "3h ago", type: "task" },
  { action: "Leave request", detail: "Mike C. requested 3 days vacation", time: "4h ago", type: "leave" },
  { action: "Salary processed", detail: "March payroll completed", time: "5h ago", type: "salary" },
  { action: "Event created", detail: "All-hands meeting scheduled for Friday", time: "6h ago", type: "event" },
  { action: "Task review", detail: "Homepage redesign - sent for review", time: "7h ago", type: "task" },
];

const ACTIVITY_COLORS: Record<string, string> = {
  task: "bg-violet-100 text-violet-600",
  leave: "bg-orange-100 text-orange-600",
  user: "bg-blue-100 text-blue-600",
  project: "bg-emerald-100 text-emerald-600",
  attendance: "bg-red-100 text-red-600",
  salary: "bg-green-100 text-green-600",
  event: "bg-purple-100 text-purple-600",
};

const RANGE_LABELS: Record<ChartRange, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
  custom: "Custom",
};

function formatDueDate(d?: string | null): string {
  if (!d) return "";
  try {
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

const Dashboard = () => {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("week");
  const userId = getUserId();
  const { data: sessionUser } = getUserById(userId);
  const createUserMutation = useCreateUserByAdmin();

  // Fetch tasks due today
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const { data: myTasksRes } = useTasksList({
    scope: "my",
    limit: 10,
    archived: false,
  });

  const tasksDueToday = useMemo(() => {
    if (!myTasksRes?.tasks) return [];
    return myTasksRes.tasks.filter((t) => {
      if (!t.dueDate) return false;
      return t.dueDate.slice(0, 10) === todayStr && t.status !== "completed";
    });
  }, [myTasksRes?.tasks, todayStr]);

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

  const attendanceData = attendanceDataSets[chartRange] || attendanceDataSets.week;
  const taskData = taskDataSets[chartRange] || taskDataSets.week;

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard Overview</h1>
          <p className="mt-2 text-gray-600">Welcome back! Here's what's happening today.</p>
        </div>
        <div>
          <Button variant="primary" type="button">
            <Download size={16} /> Export
          </Button>
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
                className={`text-xs font-semibold ${
                  item.positive ? "text-green-600" : "text-red-500"
                }`}
              >
                {item.change}
              </span>
            </div>
            <p className="mt-4 text-sm text-gray-500 uppercase tracking-wide">{item.title}</p>
            <h2 className="mt-1 text-2xl font-bold text-gray-900">{item.value}</h2>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* LEFT SIDE */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Range Selector */}
          <div className="flex items-center gap-2">
            {(Object.keys(RANGE_LABELS) as ChartRange[]).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  chartRange === range
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {RANGE_LABELS[range]}
              </button>
            ))}
          </div>

          {/* Attendance Overview */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Attendance Overview</h2>
              <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                {RANGE_LABELS[chartRange]}
              </span>
            </div>

            <ResponsiveContainer className="w-full h-full" width="100%" height={250}>
              <LineChart data={attendanceData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} />
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
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <Tooltip />
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
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center mt-4 gap-4">
                <span className="text-gray-500 gap-2 text-sm">
                  <span className="text-blue-700 gap-2 space-x-2.5 mx-1 rounded-full px-2 bg-[#6366F1]"></span>
                  Active
                </span>
                <span className="text-gray-500 gap-2 text-sm">
                  <span className="text-green-700 gap-2 space-x-2.5 mx-1 rounded-full px-2 bg-[#10B981]"></span>
                  Done
                </span>
                <span className="text-gray-500 gap-2 text-sm">
                  <span className="text-yellow-700 gap-2 space-x-2.5 mx-1 rounded-full px-2 bg-[#F59E0B]"></span>
                  On Hold
                </span>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-800">Recent Activity</h2>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {recentActivity.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      ACTIVITY_COLORS[item.type] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.action.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{item.action}</p>
                    <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">
          {/* My Tasks Due Today */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <ListTodo size={18} className="text-indigo-600" />
              <h2 className="font-semibold">My Tasks Due Today</h2>
            </div>
            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CalendarCheck size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No tasks due today</p>
                <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {tasksDueToday.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50 transition"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        task.priority === "urgent"
                          ? "bg-red-500"
                          : task.priority === "medium"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{task.taskName}</p>
                      <p className="text-xs text-gray-400">{formatDueDate(task.dueDate)}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        task.status === "in_progress"
                          ? "bg-blue-50 text-blue-700"
                          : task.status === "review"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {task.status.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Birthdays This Week */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Cake size={18} className="text-pink-500" />
              <h2 className="font-semibold">Birthdays This Week</h2>
            </div>
            {birthdaysThisWeek.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No birthdays this week</p>
            ) : (
              <div className="space-y-3">
                {birthdaysThisWeek.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-600">
                      {b.name.charAt(0)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{b.name}</p>
                      <p className="text-xs text-gray-400">{b.department}</p>
                    </div>
                    <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
                      {b.date}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleOpen("employee")}
                className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                <div className="p-2 rounded-lg bg-indigo-100">
                  <UserPlus size={22} className="text-indigo-600" />
                </div>
                <span className="text-gray-700 font-medium">Add Employee</span>
              </button>

              <button
                onClick={() => handleOpen("project")}
                className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                <div className="p-2 rounded-lg bg-purple-100">
                  <FolderPlus size={22} className="text-purple-600" />
                </div>
                <span className="text-gray-700 font-medium">Create Project</span>
              </button>

              <button
                onClick={() => handleOpen("task")}
                className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition"
              >
                <div className="p-2 rounded-lg bg-blue-100">
                  <NotebookPen size={22} className="text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">Assign Task</span>
              </button>

              <button
                onClick={() => handleOpen("leave")}
                className="p-2 flex flex-col items-center gap-2 border border-gray-100 rounded-xl text-sm hover:bg-gray-50 transition"
              >
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
            <p className="text-sm opacity-80 mb-4">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>

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
                  {createUserMutation.isPending ? "Creating..." : "Create user"}
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
