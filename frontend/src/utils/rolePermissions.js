/**
 * Role-based access permissions
 *
 * Roles (must match data.user.role from API):
 *   admin | logistics_manager | dispatcher | warehouse_manager | driver
 *
 * Each role maps to an array of nav-item keys it can access.
 * Keys match the `key` property used in the sidebar buttons.
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
  customers: "View only",
  shipments: true,
  vehicles: true,
  drivers: true,
  warehouses: "View only",
  trips: true,
  delivery: true,
  pod: true,
  invoices: true,
  reports: true,
  notifications: true,
  settings: false,
};

const dispatcherPermissions = {
  dashboard: true,
  customers: "View / Select",
  shipments: true,
  vehicles: "Assign only",
  drivers: "Assign only",
  warehouses: false,
  trips: true,
  delivery: true,
  pod: "View only",
  invoices: false,
  reports: false,
  notifications: true,
  settings: false,
};

const warehouseManagerPermissions = {
  dashboard: true,
  customers: false,
  shipments: "Status / Scan",
  vehicles: false,
  drivers: false,
  warehouses: true,
  trips: false,
  delivery: false,
  pod: false,
  invoices: false,
  reports: "Warehouse activity",
  notifications: true,
  settings: false,
};

const driverPermissions = {
  dashboard: "Trip view",
  customers: false,
  shipments: "Assigned only",
  vehicles: false,
  drivers: false,
  warehouses: false,
  trips: "Assigned trips",
  delivery: "Assigned updates",
  pod: "Submit / Create",
  invoices: false,
  reports: false,
  notifications: true,
  settings: false,
};

// Per-module access map
// value: true = full access | string = limited access label | false / absent = no access
export const ROLE_PERMISSIONS = {
  // User DB schema role names (exact match)
  [ROLES.ADMIN]: adminPermissions,
  [ROLES.LOGISTICS_MANAGER]: logisticsManagerPermissions,
  [ROLES.DISPATCHER]: dispatcherPermissions,
  [ROLES.WAREHOUSE_MANAGER]: warehouseManagerPermissions,
  [ROLES.DRIVER]: driverPermissions,

  // Lowercase / normalized aliases for backwards compatibility
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
 * e.g. accessLabel("driver", "shipments") → "Assigned only"
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
