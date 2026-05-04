import { Route, Routes, Navigate } from "react-router-dom";
import "./index.css";
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import DashboardLayout from "./components/layout/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import Tasks from "./pages/tasks/Tasks";
import { Toaster } from "react-hot-toast";
import Profile from "./pages/profile/Profile";
import Settings from "./pages/settings/Settings";
import Attendance from "./pages/attendance/Attendance";
import StickyNotes from "./pages/notes/StickyNotes";
import Leave from "./pages/leave/Leave";
import CalendarPage from "./pages/calendar/CalendarPage";
import UserProfile from "./pages/userProfile/UserProfile";
import Salary from "./pages/salary/Salary";
import Announcements from "./pages/announcements/Announcements";
import Assets from "./pages/assets/Assets";
import Chat from "./pages/chat/Chat";
import OrganizationPage from "./pages/organization/OrganizationPage";
import InvitesPage from "./pages/invites/InvitesPage";
import HolidaysPage from "./pages/holidays/HolidaysPage";
import HiringPage from "./pages/hiring/HiringPage";
import CRMPage from "./pages/crm/CRMPage";
import OnboardingPage from "./pages/onboarding/OnboardingPage";

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#ffffff",
            color: "#000000",
          },
          error: {
            iconTheme: {
              primary: "#ff0000",
              secondary: "#fff",
            },
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/projects" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/notes" element={<StickyNotes />} />
          <Route path="/salary" element={<Salary />} />
          <Route path="/employee" element={<Dashboard />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/user/:id" element={<UserProfile />} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/assets" element={<Assets />} />
          {/* <Route path="/timesheets" element={<Timesheets />} /> */}
          <Route path="/chat" element={<Chat />} />
          <Route path="/organization" element={<OrganizationPage />} />
          <Route path="/invites" element={<InvitesPage />} />
          <Route path="/holidays" element={<HolidaysPage />} />
          <Route path="/hiring" element={<HiringPage />} />
          <Route path="/crm" element={<CRMPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
