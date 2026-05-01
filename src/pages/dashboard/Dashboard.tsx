import { useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Cake,
  CalendarCheck,
  CheckCircle2,
  CircleCheckBig,
  Clock,
  Download,
  ListTodo,
  Presentation,
  User,
  Users,
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
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";

import { getUserId } from "../../utils/session";
import { useActiveOrg } from "../../contexts/ActiveOrgContext";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Modal from "../../components/UI/Model";
import { ApiError } from "../../apis/apiService";
import {
  useUserById,
  useAssignableUsers,
  useCreateUserByAdmin,
  useTeamBirthdays,
  type AdminCreateUserInput,
  type TeamBirthdayUser,
} from "../../apis/api/auth";
import { useTasksList, useCreateTask } from "../../apis/api/tasks";
import { useProjectsList, useCreateProject } from "../../apis/api/projects";
import {
  useTodayAttendance,
  useAttendanceRange,
  localYmd,
  startOfWeekMonday,
  addDays,
} from "../../apis/api/attendance";
import { usePendingLeaveRequests, useUpdateLeaveStatus } from "../../apis/api/leave";
import { useAnnouncements } from "../../apis/api/announcements";
import type { Task } from "../../types/task.types";
import type { AttendanceListResponse, AttendanceRecord } from "../../types/attendance.types";
import type { User as AppUser } from "../../types/user.types";
import type { LeaveRecord } from "../../types/leave.types";

// ---------- helpers ----------

type ChartRange = "today" | "week" | "month";

const RANGE_LABELS: Record<ChartRange, string> = {
  today: "Today",
  week: "This Week",
  month: "This Month",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: "#94A3B8",
  in_progress: "#6366F1",
  review: "#A855F7",
  completed: "#10B981",
};

const ACTIVITY_COLORS: Record<string, string> = {
  task: "bg-violet-100 text-violet-600",
  leave: "bg-orange-100 text-orange-600",
  user: "bg-blue-100 text-blue-600",
  announcement: "bg-emerald-100 text-emerald-600",
};

function formatDate(d?: string | null, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString(undefined, opts ?? { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function formatTime(d?: string | null) {
  if (!d) return "";
  try {
    return new Date(d).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatRelative(iso?: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "just now";
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return "0h 0m";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

function firstSegment(r: AttendanceRecord | null | undefined): string {
  if (!r?.punchInTime) return "";
  return formatTime(r.punchInTime);
}

function getUserIdFromAttendance(a: AttendanceRecord): string | null {
  const u = a.user;
  if (typeof u === "object" && u !== null && "_id" in u) return String(u._id);
  if (typeof u === "string") return u;
  return null;
}

function pickMyRecord(
  res: AttendanceListResponse | undefined,
  myId: string
): AttendanceRecord | null {
  if (!res?.attendance?.length || !myId) return null;
  return res.attendance.find((a) => getUserIdFromAttendance(a) === String(myId)) ?? null;
}

/** Distinct users with a punchInTime in the given attendance list. */
function countPresent(records: AttendanceRecord[] = []): number {
  const s = new Set<string>();
  for (const r of records) {
    if (!r.punchInTime) continue;
    const uid = getUserIdFromAttendance(r);
    if (uid) s.add(uid);
  }
  return s.size;
}

/** Bucket a week of attendance data Mon..Sun. */
function buildWeekAttendanceSeries(records: AttendanceRecord[], weekMonday: Date) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const buckets: Record<string, Set<string>> = {};
  const ymds: string[] = [];
  for (let i = 0; i < 7; i++) {
    const ymd = localYmd(addDays(weekMonday, i));
    ymds.push(ymd);
    buckets[ymd] = new Set();
  }
  for (const r of records) {
    if (!r.date || !r.punchInTime) continue;
    const ymd = String(r.date).slice(0, 10);
    if (!buckets[ymd]) continue;
    const uid = getUserIdFromAttendance(r);
    if (uid) buckets[ymd].add(uid);
  }
  return labels.map((day, i) => ({ day, value: buckets[ymds[i]].size }));
}

/** Bucket today's attendance by hour of punch-in. */
function buildTodayAttendanceSeries(records: AttendanceRecord[]) {
  const hours = [6, 8, 10, 12, 14, 16, 18];
  const buckets = new Array(hours.length).fill(0);
  for (const r of records) {
    if (!r.punchInTime) continue;
    const hr = new Date(r.punchInTime).getHours();
    let idx = 0;
    for (let i = 0; i < hours.length; i++) {
      if (hr >= hours[i]) idx = i;
    }
    buckets[idx] += 1;
  }
  return hours.map((h, i) => ({
    day: `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "AM" : "PM"}`,
    value: buckets[i],
  }));
}

/** Bucket a month of attendance data into 4 weeks. */
function buildMonthAttendanceSeries(records: AttendanceRecord[], monthStart: Date) {
  const weeks = [0, 0, 0, 0];
  const seen: Set<string>[] = [new Set(), new Set(), new Set(), new Set()];
  for (const r of records) {
    if (!r.date || !r.punchInTime) continue;
    const dt = new Date(String(r.date));
    const diffDays = Math.floor((dt.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const weekIdx = Math.min(3, Math.max(0, Math.floor(diffDays / 7)));
    const uid = getUserIdFromAttendance(r);
    if (uid && !seen[weekIdx].has(uid + dt.toDateString())) {
      seen[weekIdx].add(uid + dt.toDateString());
      weeks[weekIdx] += 1;
    }
  }
  return weeks.map((v, i) => ({ day: `W${i + 1}`, value: v }));
}

/** Count tasks completed per weekday for the current week. */
function buildTaskCompletionSeries(tasks: Task[], weekMonday: Date) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = new Array(7).fill(0);
  for (const t of tasks) {
    if (t.status !== "completed" || !t.updatedAt) continue;
    const d = new Date(t.updatedAt);
    const diffDays = Math.floor((d.getTime() - weekMonday.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) counts[diffDays] += 1;
  }
  return labels.map((name, i) => ({ name, value: counts[i] }));
}

function buildTaskStatusPie(tasks: Task[]) {
  const counts: Record<string, number> = {
    pending: 0,
    in_progress: 0,
    review: 0,
    completed: 0,
  };
  for (const t of tasks) {
    if (counts[t.status] !== undefined) counts[t.status] += 1;
  }
  return [
    { name: "Pending", value: counts.pending, color: TASK_STATUS_COLORS.pending },
    {
      name: "In Progress",
      value: counts.in_progress,
      color: TASK_STATUS_COLORS.in_progress,
    },
    { name: "Review", value: counts.review, color: TASK_STATUS_COLORS.review },
    {
      name: "Completed",
      value: counts.completed,
      color: TASK_STATUS_COLORS.completed,
    },
  ];
}

/**
 * All team members with a DOB, ordered by the next upcoming birthday (today first,
 * then wrapping around the calendar). Today's birthdays are flagged with isToday.
 */
type BirthdayEntry = {
  id: string;
  name: string;
  department: string;
  profileImage?: string | null;
  date: string;
  isToday: boolean;
  daysUntil: number;
};

function upcomingBirthdays(users: TeamBirthdayUser[]): BirthdayEntry[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entries: BirthdayEntry[] = [];

  for (const u of users) {
    if (!u.dob) continue;
    const dob = new Date(u.dob);
    if (Number.isNaN(dob.getTime())) continue;

    let next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) {
      next = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
    }
    const daysUntil = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const roleLabel = Array.isArray(u.role) ? u.role[0] : u.role;

    entries.push({
      id: u._id,
      name: u.name,
      department: roleLabel ?? "Team",
      profileImage: u.profileImage ?? null,
      date: next.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      isToday: daysUntil === 0,
      daysUntil,
    });
  }

  return entries.sort((a, b) => a.daysUntil - b.daysUntil);
}

type Activity = {
  id: string;
  type: "task" | "leave" | "user" | "announcement";
  action: string;
  detail: string;
  time: string;
  at: number;
};

function buildRecentActivity(args: {
  tasks: Task[];
  leaves: LeaveRecord[];
  announcements: {
    _id: string;
    title: string;
    createdAt: string;
    postedBy?: { name?: string } | null;
  }[];
  newUsers: AppUser[];
}): Activity[] {
  const items: Activity[] = [];

  for (const t of args.tasks) {
    const at = new Date(t.updatedAt ?? t.createdAt ?? Date.now()).getTime();
    items.push({
      id: `t-${t._id}`,
      type: "task",
      action:
        t.status === "completed"
          ? "Task completed"
          : t.status === "review"
            ? "Task in review"
            : "Task updated",
      detail: t.taskName,
      time: formatRelative(t.updatedAt ?? t.createdAt),
      at,
    });
  }
  for (const l of args.leaves) {
    const userName = typeof l.user === "object" && l.user ? l.user.name : "Someone";
    items.push({
      id: `l-${l._id}`,
      type: "leave",
      action: "Leave requested",
      detail: `${userName} – ${formatDate(l.fromDate)} ${
        l.toDate ? `to ${formatDate(l.toDate)}` : ""
      }`.trim(),
      time: formatRelative(l.createdAt),
      at: new Date(l.createdAt).getTime(),
    });
  }
  for (const a of args.announcements) {
    items.push({
      id: `a-${a._id}`,
      type: "announcement",
      action: "Announcement",
      detail: a.title,
      time: formatRelative(a.createdAt),
      at: new Date(a.createdAt).getTime(),
    });
  }
  for (const u of args.newUsers) {
    items.push({
      id: `u-${u._id}`,
      type: "user",
      action: "New teammate",
      detail: `${u.name} joined ${u.role?.[0] ?? "team"}`,
      time: formatRelative(u.createdAt),
      at: new Date(u.createdAt).getTime(),
    });
  }

  return items.sort((a, b) => b.at - a.at).slice(0, 10);
}

// ---------- component ----------

type ModalKind = "employee" | "project" | "task" | null;

const Dashboard = () => {
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const { activeMode } = useActiveOrg();

  const roles = sessionUser?.role ?? [];
  const isSuperAdmin = roles.includes("super-admin");
  const isAdmin = roles.some((r) => ["admin", "super-admin"].includes(r));
  const isHr = roles.includes("hr");
  const isManager = isAdmin || isHr; // who sees admin-style dashboard

  const [openModal, setOpenModal] = useState<ModalKind>(null);
  const [chartRange, setChartRange] = useState<ChartRange>("week");

  // ------ data ------
  const { data: users = [] } = useAssignableUsers(activeMode);
  const { data: teamBirthdayUsers = [] } = useTeamBirthdays();
  const { data: projects = [] } = useProjectsList(100, activeMode);
  const { data: announcements = [] } = useAnnouncements(activeMode);
  const { data: pendingLeaves = [] } = usePendingLeaveRequests(isManager, activeMode);

  const { data: myTasksRes } = useTasksList({
    scope: "my",
    limit: 50,
    archived: false,
    orgContext: activeMode,
  });
  const { data: orgTasksRes } = useTasksList({
    scope: isManager ? "all" : "my",
    limit: 200,
    archived: false,
    orgContext: activeMode,
  });

  const today = new Date();
  const todayDateStr = today.toDateString();
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const weekMonday = useMemo(() => startOfWeekMonday(new Date(todayDateStr)), [todayDateStr]);
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const monthStart = useMemo(() => {
    const d = new Date(todayDateStr);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [todayDateStr]); // eslint-disable-line react-hooks/preserve-manual-memoization

  const { data: todayAttendance } = useTodayAttendance(true, activeMode);
  const weekFrom = localYmd(weekMonday);
  const weekTo = localYmd(addDays(weekMonday, 6));
  const { data: weekAttendance } = useAttendanceRange(weekFrom, weekTo, true, activeMode);
  const monthFrom = localYmd(monthStart);
  const monthTo = localYmd(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const { data: monthAttendance } = useAttendanceRange(monthFrom, monthTo, true, activeMode);

  const updateLeaveMutation = useUpdateLeaveStatus();
  const createUserMutation = useCreateUserByAdmin();
  const createProjectMutation = useCreateProject();
  const createTaskMutation = useCreateTask();

  // ------ computed stats ------
  const totalEmployees = users.length;
  const presentToday = countPresent(todayAttendance?.attendance ?? []);
  const absentToday = Math.max(0, totalEmployees - presentToday);
  const activeProjects = projects.length;

  const orgTasksData = orgTasksRes?.tasks;
  const myTasksData = myTasksRes?.tasks;
  const orgTasks = useMemo(() => orgTasksData ?? [], [orgTasksData]);
  const myTasks = useMemo(() => myTasksData ?? [], [myTasksData]);

  const myOpenTasks = myTasks.filter((t) => t.status !== "completed").length;

  const myCompletedThisWeek = useMemo(
    () =>
      myTasks.filter(
        (t) => t.status === "completed" && t.updatedAt && new Date(t.updatedAt) >= weekMonday
      ).length,
    [myTasks, weekMonday]
  );

  const todayStr = localYmd(today);
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const tasksDueToday = useMemo(
    () =>
      myTasks.filter((t) => {
        if (!t.dueDate) return false;
        return String(t.dueDate).slice(0, 10) === todayStr && t.status !== "completed";
      }),
    [myTasks, todayStr] // eslint-disable-line react-hooks/preserve-manual-memoization
  );

  // my attendance today
  const myRecord = pickMyRecord(todayAttendance, userId);
  const myHoursTodayMs = myRecord?.dayWorkedMs ?? myRecord?.dayTotalMs ?? 0;

  // my leave balance
  const myLeaveBalance = sessionUser?.leaves?.[0];
  const leaveRemaining = (myLeaveBalance?.totalBalance ?? 0) - (myLeaveBalance?.leaveTaken ?? 0);

  // ------ chart data ------
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const attendanceSeries = useMemo(() => {
    if (chartRange === "today")
      return buildTodayAttendanceSeries(todayAttendance?.attendance ?? []);
    if (chartRange === "month")
      return buildMonthAttendanceSeries(monthAttendance?.attendance ?? [], monthStart);
    return buildWeekAttendanceSeries(weekAttendance?.attendance ?? [], weekMonday);
  }, [
    chartRange,
    todayAttendance?.attendance,
    weekAttendance?.attendance,
    monthAttendance?.attendance,
    weekMonday,
    monthStart,
  ]);

  const taskCompletionSeries = useMemo(
    () => buildTaskCompletionSeries(orgTasks, weekMonday),
    [orgTasks, weekMonday]
  );

  const taskStatusPie = useMemo(() => buildTaskStatusPie(orgTasks), [orgTasks]);

  const newUsers = useMemo(
    () =>
      users
        .filter((u) => u.createdAt)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3),
    [users]
  );

  const recentTasks = useMemo(
    () =>
      [...orgTasks]
        .filter((t) => t.updatedAt)
        .sort(
          (a, b) => new Date(b.updatedAt ?? "").getTime() - new Date(a.updatedAt ?? "").getTime()
        )
        .slice(0, 5),
    [orgTasks]
  );

  const activity = useMemo(
    () =>
      buildRecentActivity({
        tasks: recentTasks,
        leaves: pendingLeaves.slice(0, 5),
        announcements: announcements.slice(0, 5),
        newUsers,
      }),
    [recentTasks, pendingLeaves, announcements, newUsers]
  );

  const birthdays = useMemo(() => upcomingBirthdays(teamBirthdayUsers), [teamBirthdayUsers]);

  // ------ stat cards ------
  const managerStats = [
    {
      title: "Total Employees",
      value: String(totalEmployees),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: <Users size={18} />,
    },
    {
      title: "Present Today",
      value: String(presentToday),
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: <User size={18} />,
    },
    {
      title: "Absent Today",
      value: String(absentToday),
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      icon: <User size={18} />,
    },
    {
      title: "Active Projects",
      value: String(activeProjects),
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      icon: <Presentation size={18} />,
    },
  ];

  const personalStats = [
    {
      title: "Hours Today",
      value: formatMs(myHoursTodayMs),
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      icon: <Clock size={18} />,
    },
    {
      title: "Open Tasks",
      value: String(myOpenTasks),
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      icon: <ListTodo size={18} />,
    },
    {
      title: "Done This Week",
      value: String(myCompletedThisWeek),
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: <CheckCircle2 size={18} />,
    },
    {
      title: "Leave Balance",
      value: String(Math.max(0, leaveRemaining)),
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      icon: <CalendarCheck size={18} />,
    },
  ];

  const statCards = isManager ? managerStats : personalStats;

  // ------ forms ------
  const canCreateUsers = isAdmin;
  const roleOptions: AdminCreateUserInput["role"][] = isSuperAdmin
    ? ["admin", "employee", "hr", "manager"]
    : ["employee", "hr", "manager"];

  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee" as AdminCreateUserInput["role"],
  });
  const [projectForm, setProjectForm] = useState({
    projectName: "",
    description: "",
  });
  const [taskForm, setTaskForm] = useState({
    taskName: "",
    project: "",
    assignedTo: "",
    priority: "medium" as "low" | "medium" | "urgent",
    dueDate: "",
  });

  const handleClose = () => setOpenModal(null);

  const handleCreateEmployee = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canCreateUsers) {
      toast.error("Only administrators can create users.");
      return;
    }
    try {
      await createUserMutation.mutateAsync(employeeForm);
      toast.success("User created.");
      handleClose();
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not create user");
    }
  };

  const handleCreateProject = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectForm.projectName.trim()) {
      toast.error("Project name is required");
      return;
    }
    try {
      await createProjectMutation.mutateAsync(projectForm);
      toast.success("Project created.");
      handleClose();
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not create project");
    }
  };

  const handleCreateTask = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!taskForm.taskName.trim() || !taskForm.project) {
      toast.error("Task name and project are required");
      return;
    }
    try {
      await createTaskMutation.mutateAsync({
        taskName: taskForm.taskName.trim(),
        project: taskForm.project,
        assignedTo: taskForm.assignedTo || undefined,
        priority: taskForm.priority,
        dueDate: taskForm.dueDate || undefined,
      });
      toast.success("Task assigned.");
      handleClose();
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not assign task");
    }
  };

  const handleLeaveDecision = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateLeaveMutation.mutateAsync({ id, body: { status } });
      toast.success(`Leave ${status}.`);
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not update leave");
    }
  };

  // ------ render ------
  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {isManager
              ? "Dashboard Overview"
              : `Welcome back, ${sessionUser?.name?.split(" ")[0] ?? ""} 👋`}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {today.toLocaleDateString(undefined, {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
          <Download size={15} />
          Export
        </Button>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
            >
              <span className={item.iconColor}>{item.icon}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-400">
                {item.title}
              </p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900 leading-none">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN (2/3) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance chart — range tabs live inside the card header */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">Attendance Overview</h2>
              <div className="flex items-center gap-1.5">
                {(Object.keys(RANGE_LABELS) as ChartRange[]).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setChartRange(range)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      chartRange === range
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {RANGE_LABELS[range]}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pt-4 pb-2">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={attendanceSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "none",
                      boxShadow: "0 4px 20px #0001",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#6366F1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366F1", stroke: "#fff", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {attendanceSeries.every((p) => p.value === 0) && (
                <p className="pb-3 text-center text-xs text-gray-400">
                  No attendance data for this range yet.
                </p>
              )}
            </div>
          </div>

          {/* Task charts — equal height via flex */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Tasks Completed</h2>
                <p className="text-xs text-gray-400 mt-0.5">This week</p>
              </div>
              <div className="flex-1 px-4 py-4">
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={taskCompletionSeries} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "none",
                        boxShadow: "0 4px 20px #0001",
                      }}
                    />
                    <Bar dataKey="value" fill="#6366F1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Task Status</h2>
                <p className="text-xs text-gray-400 mt-0.5">All open tasks</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={taskStatusPie}
                      dataKey="value"
                      innerRadius={48}
                      outerRadius={68}
                      paddingAngle={3}
                    >
                      {taskStatusPie.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "none",
                        boxShadow: "0 4px 20px #0001",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                  {taskStatusPie.map((s) => (
                    <span key={s.name} className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span
                        className="inline-block h-2 w-2 shrink-0 rounded-full"
                        style={{ background: s.color }}
                      />
                      {s.name}
                      <span className="font-semibold text-gray-700">{s.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Activity size={16} className="text-gray-400" />
              <h2 className="font-semibold text-gray-800">Recent Activity</h2>
            </div>
            {activity.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Activity size={30} className="text-gray-200" />
                <p className="text-sm text-gray-400">Nothing happening yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-[340px] overflow-y-auto">
                {activity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        ACTIVITY_COLORS[item.type] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.action.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{item.action}</p>
                      <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                    </div>
                    <span className="shrink-0 text-[11px] text-gray-400 pt-0.5">{item.time}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ── */}
        <div className="flex flex-col gap-6">
          {/* My Tasks Due Today */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-indigo-500" />
                <h2 className="font-semibold text-gray-800">Due Today</h2>
              </div>
              <Link to="/tasks" className="text-xs font-medium text-indigo-600 hover:underline">
                View all
              </Link>
            </div>
            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarCheck size={28} className="text-gray-200" />
                <p className="text-sm text-gray-500">No tasks due today</p>
                <p className="text-xs text-gray-400">You're all caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {tasksDueToday.map((task) => (
                  <li key={task._id}>
                    <Link
                      to="/tasks"
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          task.priority === "urgent"
                            ? "bg-red-500"
                            : task.priority === "medium"
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {task.taskName}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(task.dueDate)}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          task.status === "in_progress"
                            ? "bg-blue-50 text-blue-700"
                            : task.status === "review"
                              ? "bg-purple-50 text-purple-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {task.status.replace("_", " ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming Birthdays */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm h-72">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Cake size={16} className="text-pink-500" />
                <h2 className="font-semibold text-gray-800">Upcoming Birthdays</h2>
              </div>
              {birthdays.length > 0 && (
                <span className="text-xs text-gray-400">
                  {birthdays.length} {birthdays.length === 1 ? "person" : "people"}
                </span>
              )}
            </div>
            {birthdays.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Cake size={28} className="text-gray-200" />
                <p className="text-sm text-gray-400">No birthdays on record yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                {birthdays.map((b) => (
                  <li
                    key={b.id}
                    className={`flex items-center gap-3 px-5 py-3 transition ${
                      b.isToday ? "bg-pink-50" : "hover:bg-gray-50"
                    }`}
                  >
                    {b.profileImage ? (
                      <img
                        src={b.profileImage}
                        alt={b.name}
                        className={`h-9 w-9 shrink-0 rounded-full object-cover ${
                          b.isToday ? "ring-2 ring-pink-400" : ""
                        }`}
                      />
                    ) : (
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                          b.isToday
                            ? "bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white ring-2 ring-pink-300"
                            : "bg-pink-100 text-pink-600"
                        }`}
                      >
                        {b.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {b.name}
                        {b.isToday && (
                          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-pink-500">
                            Today
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs capitalize text-gray-400">{b.department}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.isToday
                          ? "bg-pink-500 text-white"
                          : b.daysUntil <= 7
                            ? "bg-pink-50 text-pink-600"
                            : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {b.isToday
                        ? "🎉 Today"
                        : b.daysUntil === 1
                          ? "Tomorrow"
                          : b.daysUntil <= 14
                            ? `In ${b.daysUntil}d`
                            : b.date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Leave Requests / My Leave Balance */}
          {isManager ? (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm h-62">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Leave Requests</h2>
                <Link to="/leave" className="text-xs font-medium text-indigo-600 hover:underline">
                  View all
                </Link>
              </div>
              {pendingLeaves.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <CircleCheckBig size={28} className="text-gray-200" />
                  <p className="text-sm text-gray-400">No pending requests</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {pendingLeaves.slice(0, 4).map((l) => {
                    const uName = typeof l.user === "object" && l.user ? l.user.name : "Unknown";
                    const pending = updateLeaveMutation.isPending;
                    return (
                      <li key={l._id} className="flex items-center gap-3 px-5 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
                          {uName.charAt(0).toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800">{uName}</p>
                          <p className="truncate text-xs text-gray-400">
                            {formatDate(l.fromDate)}
                            {l.toDate ? ` → ${formatDate(l.toDate)}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            disabled={pending}
                            onClick={() => handleLeaveDecision(l._id, "approved")}
                            className="rounded-lg bg-indigo-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-600 disabled:opacity-50 transition"
                          >
                            ✓
                          </button>
                          <button
                            disabled={pending}
                            onClick={() => handleLeaveDecision(l._id, "rejected")}
                            className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm h-62">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Leave Balance</h2>
                <Link to="/leave" className="text-xs font-medium text-indigo-600 hover:underline">
                  Apply
                </Link>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 text-center py-4">
                {[
                  { label: "Balance", value: myLeaveBalance?.totalBalance ?? 0 },
                  { label: "Taken", value: myLeaveBalance?.leaveTaken ?? 0 },
                  { label: "Paid", value: myLeaveBalance?.paidLeave ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="px-3">
                    <p className="text-xs text-gray-400">{s.label}</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today's Summary */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Today</p>
              <p className="mt-0.5 text-sm font-medium text-white/90">
                {today.toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Punch in", value: firstSegment(myRecord) || "Not yet" },
                  { label: "Hours worked", value: formatMs(myHoursTodayMs) },
                  { label: "Tasks due today", value: String(tasksDueToday.length) },
                  ...(isManager
                    ? [{ label: "Pending leaves", value: String(pendingLeaves.length) }]
                    : []),
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm"
                  >
                    <span className="text-sm text-white/80">{row.label}</span>
                    <span className="text-sm font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          {/* <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4">
              {canCreateUsers && (
                <QuickAction
                  icon={<UserPlus size={20} className="text-indigo-600" />}
                  bg="bg-indigo-50"
                  label="Add Employee"
                  onClick={() => handleOpen("employee")}
                />
              )}
              {isManager && (
                <QuickAction
                  icon={<FolderPlus size={20} className="text-purple-600" />}
                  bg="bg-purple-50"
                  label="New Project"
                  onClick={() => handleOpen("project")}
                />
              )}
              {isManager && (
                <QuickAction
                  icon={<NotebookPen size={20} className="text-blue-600" />}
                  bg="bg-blue-50"
                  label="Assign Task"
                  onClick={() => handleOpen("task")}
                />
              )}
              <QuickAction
                icon={<CircleCheckBig size={20} className="text-green-600" />}
                bg="bg-green-50"
                label={isManager ? "Approve Leave" : "Request Leave"}
                onClick={() => navigate("/leave")}
              />
              <QuickAction
                icon={<Megaphone size={20} className="text-emerald-600" />}
                bg="bg-emerald-50"
                label="Announcements"
                onClick={() => navigate("/announcements")}
              />
              <QuickAction
                icon={<Clock size={20} className="text-amber-600" />}
                bg="bg-amber-50"
                label="Attendance"
                onClick={() => navigate("/attendance")}
              />
            </div>
          </div> */}
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={openModal === "employee"} onClose={handleClose} title="Add Employee">
        {canCreateUsers ? (
          <form onSubmit={handleCreateEmployee} className="flex flex-col gap-3 mt-1">
            <Input
              label="Full name"
              name="name"
              value={employeeForm.name}
              onChange={(e) => setEmployeeForm((s) => ({ ...s, name: e.target.value }))}
              required
              placeholder="Jane Doe"
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={employeeForm.email}
              onChange={(e) => setEmployeeForm((s) => ({ ...s, email: e.target.value }))}
              required
              placeholder="jane@company.com"
            />
            <Input
              label="Temporary password"
              name="password"
              type="password"
              value={employeeForm.password}
              onChange={(e) => setEmployeeForm((s) => ({ ...s, password: e.target.value }))}
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
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" loading={createUserMutation.isPending}>
                Create user
              </Button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-600">
            Only an admin or super-admin can add users and assign roles.
          </p>
        )}
      </Modal>

      <Modal isOpen={openModal === "project"} onClose={handleClose} title="Create Project">
        <form onSubmit={handleCreateProject} className="flex flex-col gap-3 mt-1">
          <Input
            label="Project name"
            name="projectName"
            value={projectForm.projectName}
            onChange={(e) => setProjectForm((s) => ({ ...s, projectName: e.target.value }))}
            required
            placeholder="e.g. Website redesign"
          />
          <Input
            label="Description"
            name="description"
            type="textarea"
            value={projectForm.description}
            onChange={(e) => setProjectForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="Brief description of the project…"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createProjectMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={openModal === "task"} onClose={handleClose} title="Assign Task">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-3 mt-1">
          <Input
            label="Task name"
            name="taskName"
            value={taskForm.taskName}
            onChange={(e) => setTaskForm((s) => ({ ...s, taskName: e.target.value }))}
            required
            placeholder="e.g. Prepare Q3 report"
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="task-project">
              Project
            </label>
            <select
              id="task-project"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              value={taskForm.project}
              onChange={(e) => setTaskForm((s) => ({ ...s, project: e.target.value }))}
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.projectName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="task-assignee">
              Assign to
            </label>
            <select
              id="task-assignee"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              value={taskForm.assignedTo}
              onChange={(e) => setTaskForm((s) => ({ ...s, assignedTo: e.target.value }))}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700" htmlFor="task-priority">
                Priority
              </label>
              <select
                id="task-priority"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                value={taskForm.priority}
                onChange={(e) =>
                  setTaskForm((s) => ({
                    ...s,
                    priority: e.target.value as "low" | "medium" | "urgent",
                  }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <Input
              label="Due date"
              name="dueDate"
              type="date"
              value={taskForm.dueDate}
              onChange={(e) => setTaskForm((s) => ({ ...s, dueDate: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" type="button" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={createTaskMutation.isPending}>
              Assign
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Dashboard;
