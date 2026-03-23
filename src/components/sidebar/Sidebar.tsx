import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Clock,
  Calendar,
  GitBranch,
  CheckSquare,
  Banknote,
  UserPlus,
  Settings,
} from "lucide-react";
import logo from "../../assets/MainLogo.png";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tasks", label: "Tasks", icon: CheckSquare },
  { path: "/projects", label: "Projects", icon: GitBranch },
  { path: "/attendance", label: "Attendance", icon: Clock },
  { path: "/leave", label: "Leave", icon: Calendar },
  { path: "/salary", label: "Salary", icon: Banknote },
  { path: "/hiring", label: "Hiring", icon: UserPlus },
  // { path: "/settings", label: "Settings", icon: Settings },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
      className={`
        sticky top-0 h-screen flex flex-col shrink-0
        bg-white/80 backdrop-blur-xl border-r border-gray-200
        shadow-[2px_0_10px_rgba(0,0,0,0.04)]
        transition-all duration-300 ease-in-out
        ${isOpen ? "w-[260px]" : "w-[80px]"}
      `}
    >
      {/* 🔹 LOGO */}
      <div
        onClick={() => navigate("/")}
        className="px-3 py-4 flex justify-center border-b border-gray-100 cursor-pointer"
      >
        <img
          src={logo}
          alt="OrganiX"
          className={`transition-all duration-300 ${
            isOpen ? "h-12" : "h-10"
          }`}
        />
      </div>

      {/* 🔹 NAVIGATION */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path !== "/" && location.pathname.startsWith(path));

          return (
            <Link
              key={path}
              to={path}
              title={!isOpen ? label : ""}
              className={`
                group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200
                ${
                  isActive
                    ? "bg-gradient-to-r from-violet-100 to-violet-50 text-violet-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }
                ${!isOpen ? "justify-center" : ""}
              `}
            >
              {/* Active Indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-violet-600 rounded-r-full" />
              )}

              <Icon className="w-5 h-5 shrink-0" />

              {/* Label */}
              <span
                className={`transition-all duration-200 ${
                  isOpen ? "opacity-100" : "opacity-0 hidden"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 🔹 USER PROFILE */}
      <div className="px-2 pb-4 mt-auto">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 shadow-sm">

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
            JD
          </div>

          {/* Info */}
          {isOpen && (
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Software Engineer</p>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;