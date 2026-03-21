import { Route, Routes, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/auth/Login'
import SignUp from './pages/auth/SignUp'
import DashboardLayout from './components/layout/DashboardLayout'
import Dashboard from './pages/dashboard/Dashboard'
import Tasks from './pages/tasks/Tasks'

function App() {
  return (
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
        <Route path="/hiring" element={<Dashboard />} />
        <Route path="/settings" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
