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
import ManageBooking from './pages/ManageBooking'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Booking />} />
            <Route path="/mi-turno" element={<ManageBooking />} />
            <Route path="/reservas" element={<Navigate to="/" replace />} />

            {/* Admin */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="turnos" element={<Appointments />} />
              <Route path="servicios" element={<Services />} />
              <Route path="clientes" element={<Customers />} />
              <Route path="empleados" element={<Employees />} />
              <Route
                path="caja"
                element={
                  <AdminRoute>
                    <Cash />
                  </AdminRoute>
                }
              />
              <Route
                path="usuarios"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />
              <Route
                path="reportes"
                element={
                  <AdminRoute>
                    <Reports />
                  </AdminRoute>
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
