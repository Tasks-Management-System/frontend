import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { User, Settings, LogOut, ChevronDown, Menu, Coffee } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getUserById } from "../../apis/api/auth";
import {
  clientCurrentSessionWorkedMs,
  pickMyAttendanceRecord,
  useTodayAttendance,
  usePunchIn,
  usePunchOut,
  useStartBreak,
  useEndBreak,
} from "../../apis/api/attendance";
import toast from "react-hot-toast";
import { ApiError } from "../../apis/apiService";

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/tasks": "Tasks",
  "/projects": "Projects",
  "/attendance": "Attendance",
  "/leave": "Leave",
  "/salary": "Salary",
  "/employee": "Employees",
  "/settings": "Settings",
};

const profileMenuItems = [
  { path: "/profile", label: "My Profile", icon: User },
  { path: "/settings", label: "Settings", icon: Settings },
  { path: "/logout", label: "Sign out", icon: LogOut },
];

function formatElapsed(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

type HeaderProps = {
  onOpenSidebar?: () => void;
};

const Header = ({ onOpenSidebar }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const userId = localStorage.getItem("userId") ?? "";

  const { data: user } = getUserById(userId);
  const { data: attendanceRes, isLoading: attendanceLoading } =
    useTodayAttendance(!!userId);
  const todayRecord = useMemo(
    () => pickMyAttendanceRecord(attendanceRes, userId),
    [attendanceRes, userId]
  );

  const punchInMut = usePunchIn();
  const punchOutMut = usePunchOut();
  const startBreakMut = useStartBreak();
  const endBreakMut = useEndBreak();

  const busy =
    punchInMut.isPending ||
    punchOutMut.isPending ||
    startBreakMut.isPending ||
    endBreakMut.isPending;

  const status = todayRecord?.status ?? "not_started";
  const clockedIn = status === "working" || status === "on_break";

  const recordRef = useRef(todayRecord);
  recordRef.current = todayRecord;

  /** Cumulative today: `dayTotalMs` (finished sessions) + live open session; new calendar day ⇒ new doc ⇒ 0. */
  useEffect(() => {
    if (clockedIn) {
      const tick = () => {
        const r = recordRef.current;
        const base = r?.dayTotalMs ?? 0;
        setElapsedTime(
          formatElapsed(base + clientCurrentSessionWorkedMs(r))
        );
      };
      tick();
      const id = window.setInterval(tick, 1000);
      return () => window.clearInterval(id);
    }

    const r = todayRecord;
    const base = r?.dayTotalMs ?? 0;
    if (
      r?.status === "completed" &&
      r?.punchOutTime &&
      !r?.punchInTime &&
      (r.totalTime != null || r.dayTotalMs != null)
    ) {
      setElapsedTime(
        formatElapsed(Number(r.totalTime ?? r.dayTotalMs ?? base))
      );
      return;
    }
    setElapsedTime(formatElapsed(base));
  }, [
    clockedIn,
    todayRecord?.dayTotalMs,
    todayRecord?.status,
    todayRecord?.punchInTime,
    todayRecord?.punchOutTime,
    todayRecord?.totalTime,
    todayRecord?.breaks?.length,
  ]);

  const handleMainAttendance = async () => {
    try {
      if (!clockedIn) {
        await punchInMut.mutateAsync();
        toast.success("Punched in");
        return;
      }
      if (status === "on_break") {
        await endBreakMut.mutateAsync();
        toast.success("Break ended");
        return;
      }
      if (status === "working") {
        await punchOutMut.mutateAsync();
        toast.success("Punched out");
      }
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Attendance action failed");
    }
  };

  const handleStartBreak = async () => {
    try {
      await startBreakMut.mutateAsync();
      toast.success("Break started");
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not start break");
    }
  };

  const location = useLocation();
  const title =
    routeTitles[location.pathname] ??
    (location.pathname.startsWith("/tasks") ? "Tasks" : "Workspace");

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

  const mainLabel =
    status === "on_break" ? "Break" : clockedIn ? "IN" : "OUT";

  const mainHint =
    status === "on_break"
      ? "End break"
      : status === "working"
        ? "Punch out"
        : "Punch in";

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-gray-200/80 shadow-sm sticky top-0 z-30 min-h-16">
      <div className="flex items-center justify-between min-h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onOpenSidebar ? (
            <button
              type="button"
              className="lg:hidden inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50"
              aria-label="Open menu"
              onClick={onOpenSidebar}
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
        </div>
        <div className="relative flex items-center gap-2" ref={menuRef}>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {status === "working" ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleStartBreak}
                className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 shadow-sm transition hover:bg-amber-100 disabled:opacity-50"
              >
                <Coffee className="h-3.5 w-3.5" />
                Break
              </button>
            ) : null}

            <button
              type="button"
              disabled={busy || attendanceLoading}
              title={mainHint}
              onClick={handleMainAttendance}
              className={`
                flex min-w-[168px] sm:min-w-[180px] items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left shadow-sm transition-all duration-300
                ${
                  status === "on_break"
                    ? "border border-amber-300 bg-gradient-to-r from-amber-400 to-orange-400 text-white"
                    : status === "working"
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`
                    h-2.5 w-2.5 shrink-0 rounded-full
                    ${
                      status === "on_break"
                        ? "animate-pulse bg-white"
                        : status === "working"
                          ? "animate-pulse bg-white"
                          : "bg-gray-400"
                    }
                  `}
                />
                <span className="text-sm font-medium">{mainLabel}</span>
              </div>
              <div className="text-sm font-semibold tabular-nums">
                {attendanceLoading ? "…" : elapsedTime}
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
              className={`w-5 h-5 text-gray-500 transition-transform duration-300 ease-out ${isMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className={`
              absolute right-0 top-full mt-2 w-56 origin-top-right
              rounded-xl bg-white shadow-lg ring-1 ring-black/5
              transition-all duration-200 ease-out
              ${
                isMenuOpen
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
