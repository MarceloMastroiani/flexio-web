import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './lib/auth'
import { ToastProvider } from './components/ui/Toast'
import { Layout } from './components/layout/Layout'
import { AdminRoute, ProtectedRoute } from './components/layout/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Appointments from './pages/Appointments'
import Services from './pages/Services'
import Customers from './pages/Customers'
import Employees from './pages/Employees'
import Cash from './pages/Cash'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Booking from './pages/Booking'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/reservas" element={<Booking />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="appointments" element={<Appointments />} />
              <Route path="services" element={<Services />} />
              <Route path="customers" element={<Customers />} />
              <Route path="employees" element={<Employees />} />
              <Route
                path="cash"
                element={
                  <AdminRoute>
                    <Cash />
                  </AdminRoute>
                }
              />
              <Route
                path="users"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />
              <Route path="reports" element={<Reports />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
