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
  ADMIN:             "admin",
  LOGISTICS_MANAGER: "logistics_manager",
  DISPATCHER:        "dispatcher",
  WAREHOUSE_MANAGER: "warehouse_manager",
  DRIVER:            "driver",
};

// Per-module access map
// value: true = full access | string = limited access label | false / absent = no access
export const ROLE_PERMISSIONS = {
  admin: {
    dashboard:     true,
    customers:     true,
    shipments:     true,
    vehicles:      true,
    drivers:       true,
    warehouses:    true,
    trips:         true,
    delivery:      true,
    pod:           true,
    invoices:      true,
    reports:       true,
    notifications: true,
    settings:      true,
  },
  logistics_manager: {
    dashboard:     true,
    customers:     "View only",
    shipments:     true,
    vehicles:      true,
    drivers:       true,
    warehouses:    "View only",
    trips:         true,
    delivery:      true,
    pod:           true,
    invoices:      true,
    reports:       true,
    notifications: true,
    settings:      false,
  },
  dispatcher: {
    dashboard:     true,
    customers:     "View / Select",
    shipments:     true,
    vehicles:      "Assign only",
    drivers:       "Assign only",
    warehouses:    false,
    trips:         true,
    delivery:      true,
    pod:           "View only",
    invoices:      false,
    reports:       false,
    notifications: true,
    settings:      false,
  },
  warehouse_manager: {
    dashboard:     true,
    customers:     false,
    shipments:     "Status / Scan",
    vehicles:      false,
    drivers:       false,
    warehouses:    true,
    trips:         false,
    delivery:      false,
    pod:           false,
    invoices:      false,
    reports:       "Warehouse activity",
    notifications: true,
    settings:      false,
  },
  driver: {
    dashboard:     "Trip view",
    customers:     false,
    shipments:     "Assigned only",
    vehicles:      false,
    drivers:       false,
    warehouses:    false,
    trips:         "Assigned trips",
    delivery:      "Assigned updates",
    pod:           "Submit / Create",
    invoices:      false,
    reports:       false,
    notifications: true,
    settings:      false,
  },
};

export function normalizeRole(role) {
  if (!role || typeof role !== "string") return "";
  const cleaned = role.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (cleaned === "logistic_manager" || cleaned === "logistics_manager") {
    return "logistics_manager";
  }
  if (cleaned === "warehouse_manager") {
    return "warehouse_manager";
  }
  if (cleaned === "griver" || cleaned === "driver") {
    return "driver";
  }
  return cleaned;
}

/**
 * Returns true if the given role has any access to the given nav key.
 */
export function canAccess(role, key) {
  const normRole = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[normRole];
  if (!perms) return false;
  return Boolean(perms[key]);
}

/**
 * Returns the access label for a role+key combo, or null if no access.
 * e.g. accessLabel("driver", "shipments") → "Assigned only"
 */
export function accessLabel(role, key) {
  const normRole = normalizeRole(role);
  const perms = ROLE_PERMISSIONS[normRole];
  if (!perms) return null;
  const val = perms[key];
  if (!val) return null;
  return typeof val === "string" ? val : null;
}
