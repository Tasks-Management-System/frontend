import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  FolderKanban,
  CheckSquare,
  Banknote,
  UserPlus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import logo from "../../assets/Mainlogo.png";
import { useMemo, useState } from "react";
import { useProjectsList } from "../../apis/api/projects";
import { getUserById } from "../../apis/api/auth";
import type { Project } from "../../types/project.types";

const PROJECT_ACCENTS = [
  "bg-violet-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-fuchsia-500",
];

function accentForId(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return PROJECT_ACCENTS[Math.abs(h) % PROJECT_ACCENTS.length];
}

const mainNav = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { path: "/tasks", label: "Tasks", icon: CheckSquare, end: false },
  { path: "/attendance", label: "Attendance", icon: Clock, end: false },
  { path: "/leave", label: "Leave", icon: Calendar, end: false },
  { path: "/salary", label: "Salary", icon: Banknote, end: false },
  { path: "/employee", label: "Employee", icon: UserPlus, end: false },
];

type SidebarProps = {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
};

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useProjectsList(100);
  const userId = localStorage.getItem("userId") ?? "";
  const { data: user } = getUserById(userId);
  const [projectsOpen, setProjectsOpen] = useState(true);

  const selectedProjectId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("project");
  }, [location.search]);

  const isTasksRoute = location.pathname.startsWith("/tasks");

  const initials = user?.name
    ?.split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = user?.role?.[0] ?? "Member";

  const linkClass = ({
    isActive,
    nested,
  }: {
    isActive: boolean;
    nested?: boolean;
  }) =>
    [
      "group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden",
      nested ? "pl-9 pr-3 py-2" : "px-3 py-2.5",
      isActive
        ? "bg-gradient-to-r from-violet-600/10 to-indigo-600/5 text-violet-800 shadow-[0_1px_0_rgba(255,255,255,0.8)] ring-1 ring-violet-500/15"
        : "text-gray-600 hover:bg-gray-100/90 hover:text-gray-900",
    ].join(" ");

  const shell = (
    <>
      <div
        className="flex h-16 items-center gap-2 border-b border-gray-200/80 px-4 cursor-pointer"
        onClick={() => navigate("/")}
        role="presentation"
      >
        <img src={logo} alt="TMS" className="h-9 w-auto object-contain" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-gray-900">
            TMS
          </p>
          <p className="truncate text-xs text-gray-500">Task Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {mainNav
          .filter((item) => item.path !== "/tasks")
          .map(({ path, label, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => onMobileClose?.()}
              className={({ isActive }) => linkClass({ isActive })}
            >
              {({ isActive }) => (
                <>
                  {isActive ? (
                    <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
                  ) : null}
                  <Icon className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-gray-700" />
                  <span className="truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}

        <NavLink
          to="/tasks"
          onClick={() => onMobileClose?.()}
          className={() =>
            linkClass({
              isActive: location.pathname === "/tasks" && !selectedProjectId,
            })
          }
        >
          {location.pathname === "/tasks" && !selectedProjectId ? (
            <span className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-violet-600" />
          ) : null}
          <CheckSquare className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-gray-700" />
          <span className="truncate">Tasks</span>
        </NavLink>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => setProjectsOpen((o) => !o)}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100/90"
          >
            <FolderKanban className="h-5 w-5 shrink-0 text-gray-500" />
            <span className="flex-1 truncate">Projects</span>
            {projectsOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            )}
          </button>

          {projectsOpen ? (
            <div className="mt-1 space-y-0.5 border-l border-gray-200/80 ml-4 pl-2">
              {projectsLoading ? (
                <p className="px-2 py-2 text-xs text-gray-500">Loading projects…</p>
              ) : projects.length === 0 ? (
                <p className="px-2 py-2 text-xs text-gray-500">No projects yet</p>
              ) : (
                projects.map((p: Project) => {
                  const active = isTasksRoute && selectedProjectId === p._id;
                  return (
                    <NavLink
                      key={p._id}
                      to={`/tasks?project=${p._id}`}
                      onClick={() => onMobileClose?.()}
                      className={() => linkClass({ isActive: active, nested: true })}
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${accentForId(p._id)} shadow-sm ring-2 ring-white`}
                        aria-hidden
                      />
                      <span className="truncate">{p.projectName}</span>
                    </NavLink>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="border-t border-gray-200/80 p-3">
        <button
          type="button"
          onClick={() => {
            navigate("/profile");
            onMobileClose?.();
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50 p-3 text-left shadow-[0_8px_30px_rgba(15,23,42,0.06)] transition hover:shadow-[0_12px_36px_rgba(15,23,42,0.08)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-sm font-semibold text-white shadow-inner">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="select-none">{initials ?? "—"}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {user?.name ?? "Account"}
            </p>
            <p className="truncate text-xs capitalize text-gray-500">{roleLabel}</p>
          </div>
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
        onClick={onMobileClose}
      />
      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200/80 bg-white/95 shadow-[4px_0_24px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-transform duration-300 ease-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        ].join(" ")}
      >
        {shell}
      </aside>
    </>
  );
};

export default Sidebar;
