import { Navigate } from "react-router-dom";
import { ROLE_PERMISSIONS } from "../utils/rolePermissions";

/**
 * ProtectedRoute
 *
 * Props:
 *   allowedRoles  string[]   roles that may access this route (optional)
 *                            if omitted, any authenticated user is allowed
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user") || "null");

  // Not logged in → redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role;

  // Role not in allowedRoles → show 403 screen
  if (allowedRoles && !allowedRoles.includes(role)) {
    return (
      <div style={styles.wrap}>
        <div style={styles.card}>
          <div style={styles.code}>403</div>
          <h2 style={styles.title}>Access Denied</h2>
          <p style={styles.msg}>
            Your account role <strong>({role})</strong> does not have permission
            to view this page.
          </p>
          <button
            style={styles.btn}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Role exists in permissions map but has no access at all → also 403
  if (role && !ROLE_PERMISSIONS[role]) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg, #f4f3ee)",
    fontFamily: "var(--primary-text, sans-serif)",
  },
  card: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: "48px 40px",
    textAlign: "center",
    maxWidth: 380,
    width: "90%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.07)",
  },
  code: {
    fontSize: 72,
    fontWeight: 800,
    color: "#338cff",
    lineHeight: 1,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 10px",
    color: "#111",
  },
  msg: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 1.6,
    marginBottom: 28,
  },
  btn: {
    padding: "10px 28px",
    borderRadius: 999,
    background: "#338cff",
    color: "#fff",
    border: "none",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    letterSpacing: "0.05em",
  },
};
