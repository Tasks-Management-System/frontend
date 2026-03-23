import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getUserById } from "../../apis/api/auth";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tasks",
  "/projects": "Projects",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/salary": "Salary",
  "/hiring": "Hiring",
  "/settings": "Settings",
};

const profileMenuItems = [
  { path: "/profile", label: "My Profile", icon: User },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/logout", label: "Sign out", icon: LogOut },
];

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const userId = localStorage.getItem("userId") ?? ""

  const location = useLocation()
  const title = routeTitles[location.pathname]

  const {  data: user} = getUserById(userId)

  const handleAttendanceToggle = () => {
    if (!isCheckedIn) {
      setStartTime(new Date());
    } else {
      setStartTime(null);
      setElapsedTime("00:00:00");
    }
    setIsCheckedIn((prev) => !prev);
  };

  useEffect(() => {
    let interval: any;

    if (isCheckedIn && startTime) {
      interval = setInterval(() => {
        const now = new Date().getTime();
        const start = startTime.getTime();
        const diff = now - start;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setElapsedTime(
          `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
            2,
            "0"
          )}:${String(seconds).padStart(2, "0")}`
        );
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isCheckedIn, startTime]);

  const menuRef = useRef<HTMLDivElement>(null);
  const initials = user?.name
    ?.split(" ")
    ?.map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 h-22">
      <div className="flex items-center justify-between h-full px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
        <div className="relative flex items-center gap-2" ref={menuRef} >
          <div className="flex items-center gap-4">

            <button
              onClick={handleAttendanceToggle}
              className={`
    flex items-center justify-between gap-4
    px-4 py-2.5 rounded-xl min-w-[180px]
    transition-all duration-300 shadow-sm
    ${isCheckedIn
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}
  `}
            >

              <div className="flex items-center gap-2">
                <span
                  className={`
        w-2.5 h-2.5 rounded-full
        ${isCheckedIn ? "bg-white animate-pulse" : "bg-gray-400"}
      `}
                />
                <span className="text-sm font-medium">
                  {isCheckedIn ? "IN" : "OUT"}
                </span>
              </div>


              <div className="text-sm font-semibold tabular-nums">
                {isCheckedIn ? elapsedTime : "Start"}
              </div>
            </button>

          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-2"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex flex-col items-end">
              <p className="text-sm font-medium capitalize">{user?.name ?? "—"}</p>
              <p className="text-xs text-gray-500 uppercase">{user?.role?.[0] ?? "—"}</p>
            </div>

            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shrink-0 overflow-hidden ring-2 ring-white shadow-sm">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="select-none">{initials}</span>
              )}
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-out ${isMenuOpen ? "rotate-180" : ""
                }`}
            />
          </button>

          <div
            className={`
              absolute right-0 top-full mt-2 w-56 origin-top-right
              rounded-xl bg-white shadow-lg ring-1 ring-black/5
              transition-all duration-200 ease-out
              ${isMenuOpen
                ? "opacity-100 scale-100 translate-y-0 visible"
                : "opacity-0 scale-95 -translate-y-1 invisible pointer-events-none"
              }
            `}
            role="menu"
          >
            <div className="py-1.5">
              {profileMenuItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-violet-700 transition-colors duration-150 first:rounded-t-xl last:rounded-b-xl"
                  role="menuitem"
                >
                  <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
