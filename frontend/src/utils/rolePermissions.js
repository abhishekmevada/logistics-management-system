/**
 * Role-based access permissions
 *
 * Matrix based on user specification:
 *   Admin: Full system access
 *   Logistics Manager: Dashboard, Shipments, Vehicles, Drivers, Trips, Deliveries, Reports, Notifications, Settings (Profile)
 *   Dispatcher: Dashboard, Shipments, Vehicles, Drivers, Trips, Deliveries, Notifications, Settings (Profile)
 *   Warehouse Manager: Dashboard, Shipments, Warehouses, Deliveries, Notifications, Settings (Profile)
 *   Driver: Dashboard, Shipments, Trips, Deliveries, POD, Notifications, Settings (Profile)
 */

export const ROLES = {
  ADMIN: "Admin",
  LOGISTICS_MANAGER: "Logistics Manager",
  DISPATCHER: "Dispatcher",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  DRIVER: "Driver",
};

const adminPermissions = {
  dashboard: true,
  customers: true,
  shipments: true,
  vehicles: true,
  drivers: true,
  warehouses: true,
  trips: true,
  delivery: true,
  pod: true,
  invoices: true,
  reports: true,
  notifications: true,
  settings: true,
};

const logisticsManagerPermissions = {
  dashboard: true,
  customers: false,
  shipments: true,
  vehicles: true,
  drivers: true,
  warehouses: false,
  trips: true,
  delivery: true,
  pod: false,
  invoices: false,
  reports: true,
  notifications: true,
  settings: "Profile",
};

const dispatcherPermissions = {
  dashboard: true,
  customers: false,
  shipments: true,
  vehicles: true,
  drivers: true,
  warehouses: false,
  trips: true,
  delivery: true,
  pod: false,
  invoices: false,
  reports: false,
  notifications: true,
  settings: "Profile",
};

const warehouseManagerPermissions = {
  dashboard: true,
  customers: false,
  shipments: true,
  vehicles: false,
  drivers: false,
  warehouses: true,
  trips: false,
  delivery: true,
  pod: false,
  invoices: false,
  reports: false,
  notifications: true,
  settings: "Profile",
};

const driverPermissions = {
  dashboard: true,
  customers: false,
  shipments: true,
  vehicles: false,
  drivers: false,
  warehouses: false,
  trips: true,
  delivery: true,
  pod: true,
  invoices: false,
  reports: false,
  notifications: true,
  settings: "Profile",
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: adminPermissions,
  [ROLES.LOGISTICS_MANAGER]: logisticsManagerPermissions,
  [ROLES.DISPATCHER]: dispatcherPermissions,
  [ROLES.WAREHOUSE_MANAGER]: warehouseManagerPermissions,
  [ROLES.DRIVER]: driverPermissions,

  admin: adminPermissions,
  logistics_manager: logisticsManagerPermissions,
  dispatcher: dispatcherPermissions,
  warehouse_manager: warehouseManagerPermissions,
  driver: driverPermissions,
};

export function normalizeRole(role) {
  if (!role || typeof role !== "string") return "";
  const cleaned = role
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (cleaned === "logistic_manager" || cleaned === "logistics_manager") {
    return "logistics_manager";
  }
  if (cleaned === "warehouse_manager") {
    return "warehouse_manager";
  }
  if (cleaned === "driver") {
    return "driver";
  }
  if (cleaned === "super_admin" || cleaned === "admin") {
    return "admin";
  }
  return cleaned;
}

/**
 * Returns true if the given role has any access to the given nav key.
 */
export function canAccess(role, key) {
  if (!role) return false;
  const normRole = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[normRole];
  if (!perms) return false;
  return Boolean(perms[key]);
}

/**
 * Returns the access label for a role+key combo, or null if no access.
 * e.g. accessLabel("logistics_manager", "settings") → "Profile"
 */
export function accessLabel(role, key) {
  if (!role) return null;
  const normRole = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[normRole];
  if (!perms) return null;
  const val = perms[key];
  if (!val) return null;
  return typeof val === "string" ? val : null;
}
