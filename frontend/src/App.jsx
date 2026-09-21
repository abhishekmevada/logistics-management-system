import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
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
import RegisterUser from "./pages/RegisterUser/RegisterUser";
import Landingpage from "./pages/LandingPage/Landingpage";
import CustomerDashboard from "./pages/CustomerDashboard/CustomerDashboard";
import LandingAboutPage from "./pages/LandingPage/LandingAboutPage";
import LandingPlatform from "./pages/LandingPage/LandingPlatform";
import LandingContact from "./pages/LandingPage/LandingContact";
import Driverdashboard from "./pages/Driver Dashboard/Driverdashboard";

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
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landingpage />} />
          <Route path="/about" element={<LandingAboutPage />} />
          <Route path="/platform" element={<LandingPlatform />} />
          <Route path="/contact" element={<LandingContact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/customer-dashboard/:customerId"
            element={<CustomerDashboard />}
          />
          <Route path="/driver-dashboard" element={<Driverdashboard />} />

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
                <Dashboard initialTab="customers" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customers"
            element={
              <ProtectedRoute
                allowedRoles={["admin", "logistics_manager", "dispatcher"]}
              >
                <Dashboard initialTab="customers" />
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
                <Dashboard initialTab="shipments" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shipments"
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
                <Dashboard initialTab="shipments" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/driver"
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
                <Dashboard initialTab="drivers" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/drivers"
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
                <Dashboard initialTab="drivers" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicle"
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
                <Dashboard initialTab="vehicles" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vehicles"
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
                <Dashboard initialTab="vehicles" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vechile"
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
                <Dashboard initialTab="vehicles" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vechiles"
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
                <Dashboard initialTab="vehicles" />
              </ProtectedRoute>
            }
          />

          <Route path="/register-user" element={<RegisterUser />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
