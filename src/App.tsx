import { Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/dashboard/Dashboard'
import Tasks from './pages/tasks/Tasks'
import { Toaster } from 'react-hot-toast'
import Profile from './pages/profile/Profile'
import Settings from './pages/settings/Settings'

function App() {
  return (
    <>
    <Toaster 
    position="top-right"
    toastOptions={{
      duration: 3000,
      style: {
        background: '#ffffff',
        color: '#000000',
      },
      error: {
        iconTheme: {
          primary: '#ff0000',
          secondary: '#fff',
        },
      },
    }}
    />
    <Routes>

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/attendance" element={<Dashboard />} />
        <Route path="/leave" element={<Dashboard />} />
        <Route path="/projects" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/salary" element={<Dashboard />} />
        <Route path="/employee" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App
