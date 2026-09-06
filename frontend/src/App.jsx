import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import VerifyOTP from "./pages/VerifyOTP/VerifyOTP";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Dashboard from "./pages/Dashboard/Dashboard";
import DashboardCustomer from "./pages/Dashboard/DashboardCustomer";
import DashboardShipment from "./pages/Dashboard/DashboardShipment";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardDriver from "./pages/Dashboard/DashboardDriver";

// All valid roles
const ALL_ROLES = [
  "admin",
  "logistics_manager",
  "dispatcher",
  "warehouse_manager",
  "driver",
];

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected: all authenticated roles */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={ALL_ROLES}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected: admin + logistics_manager only */}
        <Route
          path="/customer"
          element={
            <ProtectedRoute
              allowedRoles={["admin", "logistics_manager", "dispatcher"]}
            >
              <DashboardCustomer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipment"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "logistics_manager",
                "dispatcher",
                "warehouse_manager",
                "driver",
              ]}
            >
              <DashboardShipment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/shipment"
          element={
            <ProtectedRoute
              allowedRoles={[
                "admin",
                "logistics_manager",
                "dispatcher",
                "warehouse_manager",
                "driver",
              ]}
            >
              <DashboardDriver />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
