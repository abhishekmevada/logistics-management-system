import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Login from "./pages/Login/Login";
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
import WarehouseScan from "./pages/WarehouseScan/WarehouseScan";
import { ROLES } from "./utils/rolePermissions";
import AdminRegistration from "./pages/AdminResgistration/AdminRegistration";

// All valid roles matching User db schema
const ALL_ROLES = [
  ROLES.ADMIN,
  ROLES.LOGISTICS_MANAGER,
  ROLES.DISPATCHER,
  ROLES.WAREHOUSE_MANAGER,
  ROLES.DRIVER,
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/customer-dashboard/:customerId"
            element={<CustomerDashboard />}
          />
          <Route path="/driver-dashboard" element={<Driverdashboard />} />
          <Route
            path="/warehouse-scan/:trackingId"
            element={<WarehouseScan />}
          />
          <Route path="/admin-registration" element={<AdminRegistration />} />

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

          <Route
            path="/warehouse"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "warehouse_manager",
                ]}
              >
                <Dashboard initialTab="warehouses" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouses"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "warehouse_manager",
                ]}
              >
                <Dashboard initialTab="warehouses" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trip"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "dispatcher",
                  "driver",
                ]}
              >
                <Dashboard initialTab="trips" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "dispatcher",
                  "driver",
                ]}
              >
                <Dashboard initialTab="trips" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/delivery"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "dispatcher",
                  "driver",
                ]}
              >
                <Dashboard initialTab="delivery" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/deliveries"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "dispatcher",
                  "driver",
                ]}
              >
                <Dashboard initialTab="delivery" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pod"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "dispatcher",
                  "driver",
                ]}
              >
                <Dashboard initialTab="pod" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/invoices"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "Admin",
                  "Logistics Manager",
                ]}
              >
                <Dashboard initialTab="invoices" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "Admin",
                  "Logistics Manager",
                ]}
              >
                <Dashboard initialTab="invoices" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "warehouse_manager",
                  "Admin",
                  "Logistics Manager",
                  "Warehouse Manager",
                ]}
              >
                <Dashboard initialTab="reports" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "logistics_manager",
                  "warehouse_manager",
                  "Admin",
                  "Logistics Manager",
                  "Warehouse Manager",
                ]}
              >
                <Dashboard initialTab="reports" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <Dashboard initialTab="notifications" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notification"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <Dashboard initialTab="notifications" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/queries"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <Dashboard initialTab="queries" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/query"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <Dashboard initialTab="queries" />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <Dashboard initialTab="settings" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setting"
            element={
              <ProtectedRoute allowedRoles={ALL_ROLES}>
                <Dashboard initialTab="settings" />
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
