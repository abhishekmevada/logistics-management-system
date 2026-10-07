import React from "react";
import RouteMapVisual from "../../components/RouteMapVisual";
import LandingContact from "../LandingPage/LandingContact";

// Export default as LandingContact or component with contactSectionContainerMinCOntainer
export { RouteMapVisual };
export default function DashboardContact() {
  return (
    <div className="dashboardContactPage" style={{ padding: "24px" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "700", color: "#1e293b", margin: 0 }}>
          Contact & Live Logistics Network
        </h2>
        <p style={{ color: "#64748b", margin: "6px 0 0 0", fontSize: "0.95rem" }}>
          Real-time tracking routes between Warehouse, Pickup, Transit, and Delivered checkpoints.
        </p>
      </div>

      <div
        className="contactSectionContainerMinCOntainer"
        style={{
          width: "100%",
          height: "400px",
          position: "relative",
          borderRadius: "14px",
          overflow: "hidden",
        }}
      >
        <RouteMapVisual />
      </div>
    </div>
  );
}
