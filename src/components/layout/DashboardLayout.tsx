import { Outlet, Navigate, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";
import RoleRouteGuard from "../auth/RoleRouteGuard";
import { useEffect, useState } from "react";
import { useUserById } from "../../apis/api/auth";
import { getToken, getUserId, setStoredRoles } from "../../utils/auth";
import { connectSocket, disconnectSocket } from "../../utils/socket";
import AnnouncementPopup from "../announcements/AnnouncementPopup";
import BirthdayPopup from "../birthdays/BirthdayPopup";
import { ActiveOrgProvider } from "../../contexts/ActiveOrgContext";
import { ChatNotificationProvider } from "../../contexts/ChatNotificationContext";

const DashboardLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isNotesFullscreen = location.pathname === "/notes";
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);

  useEffect(() => {
    if (sessionUser?.role?.length) {
      setStoredRoles(sessionUser.role);
    }
  }, [sessionUser?.role]);

  // Connect socket when authenticated
  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  if (!getToken()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <ActiveOrgProvider>
      <ChatNotificationProvider>
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
          <AnnouncementPopup />
          <BirthdayPopup />
        </div>
      </ChatNotificationProvider>
    </ActiveOrgProvider>
  );
};

export default DashboardLayout;
