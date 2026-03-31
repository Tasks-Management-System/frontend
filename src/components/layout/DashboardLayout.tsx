import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";
import RoleRouteGuard from "../auth/RoleRouteGuard";
import { useEffect, useState } from "react";
import { getUserById } from "../../apis/api/auth";
import { setStoredUserRoles } from "../../utils/moduleAccess";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isNotesFullscreen = location.pathname === "/notes";
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") ?? "" : "";
  const { data: sessionUser } = getUserById(userId);

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (sessionUser?.role?.length) {
      setStoredUserRoles(sessionUser.role);
    }
  }, [sessionUser?.role]);

  return (
    <div className="flex min-h-screen bg-[#f7f8fb]">
      <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main
          className={
            isNotesFullscreen
              ? "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
              : "flex-1 overflow-auto p-4 sm:p-6 lg:p-8"
          }
        >
          <RoleRouteGuard>
            <Outlet />
          </RoleRouteGuard>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
