import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";
import { useEffect, useState } from "react";

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isNotesFullscreen = location.pathname === "/notes";

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
    }
  }, [navigate]);

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
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
