import React, { useState, useMemo } from "react";
import type { Shipment, ShipmentStatus } from "../../types/shipment";
import { initialMockShipments } from "../../data/mockShipments";
import { CreateShipmentModal } from "./CreateShipmentModal";
import { ShipmentDetailsModal } from "./ShipmentDetailsModal";
import { UpdateStatusModal } from "./UpdateStatusModal";
import { EditShipmentModal } from "./EditShipmentModal";
import { BulkImportModal } from "./BulkImportModal";
import "../../style/ShipmentManagement.css";

interface ShipmentManagementProps {
  searchTerm?: string;
}

export const ShipmentManagement: React.FC<ShipmentManagementProps> = ({
  searchTerm: externalSearch = "",
}) => {
  const [shipments, setShipments] = useState<Shipment[]>(initialMockShipments);

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>(externalSearch);
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest");

  // Active Modals
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [selectedDetails, setSelectedDetails] = useState<Shipment | null>(null);
  const [selectedUpdateStatus, setSelectedUpdateStatus] = useState<Shipment | null>(
    null
  );
  const [selectedEdit, setSelectedEdit] = useState<Shipment | null>(null);

  // Sync external search from topbar if changed
  React.useEffect(() => {
    if (externalSearch) {
      setSearchQuery(externalSearch);
    }
  }, [externalSearch]);

  // Handlers
  const handleCreateShipment = (newShipment: Shipment) => {
    setShipments((prev) => [newShipment, ...prev]);
  };

  const handleImportShipments = (imported: Shipment[]) => {
    setShipments((prev) => [...imported, ...prev]);
  };

  const handleUpdateStatus = (
    shipmentId: string,
    newStatus: ShipmentStatus,
    location: string,
    notes: string,
    updatedBy: string
  ) => {
    const timestamp = new Date().toISOString();
    setShipments((prev) =>
      prev.map((shp) => {
        if (shp.id === shipmentId) {
          const newEvent = {
            id: `evt-${Date.now()}`,
            status: newStatus,
            location,
            notes,
            timestamp,
            updatedBy,
          };
          return {
            ...shp,
            status: newStatus,
            deliveredAt: newStatus === "Delivered" ? timestamp : shp.deliveredAt,
            events: [...shp.events, newEvent],
          };
        }
        return shp;
      })
    );
  };

  const handleSaveEdit = (updated: Shipment) => {
    setShipments((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  const handleDeleteShipment = (id: string, trackingNo: string) => {
    if (window.confirm(`Are you sure you want to delete shipment ${trackingNo}?`)) {
      setShipments((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (shipments.length === 0) return;
    let csv =
      "TrackingNo,Customer,SenderCity,ReceiverCity,Category,WeightKg,Status,Priority,Driver,PickupDate\n";
    shipments.forEach((s) => {
      csv += `"${s.trackingNo}","${s.customerName}","${s.sender.city}","${s.receiver.city}","${s.package.category}",${s.package.weightKg},"${s.status}","${s.priority}","${s.driverName || "N/A"}","${s.pickupDate}"\n`;
    });

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `routeflow_shipments_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = shipments.length;
    const pending = shipments.filter(
      (s) => s.status === "Created" || s.status === "Pickup Scheduled"
    ).length;
    const inTransit = shipments.filter(
      (s) =>
        s.status === "Picked Up" ||
        s.status === "At Warehouse" ||
        s.status === "Dispatched" ||
        s.status === "In Transit" ||
        s.status === "Out for Delivery"
    ).length;
    const delivered = shipments.filter((s) => s.status === "Delivered").length;
    const failed = shipments.filter((s) => s.status === "Failed Delivery").length;
    return { total, pending, inTransit, delivered, failed };
  }, [shipments]);

  // Filtering & Sorting Logic
  const filteredShipments = useMemo(() => {
    return shipments
      .filter((s) => {
        // Tab Filter
        if (activeTab === "Pending") {
          if (s.status !== "Created" && s.status !== "Pickup Scheduled")
            return false;
        } else if (activeTab === "In Transit") {
          if (
            s.status !== "Picked Up" &&
            s.status !== "At Warehouse" &&
            s.status !== "Dispatched" &&
            s.status !== "In Transit"
          )
            return false;
        } else if (activeTab === "Out for Delivery") {
          if (s.status !== "Out for Delivery") return false;
        } else if (activeTab === "Delivered") {
          if (s.status !== "Delivered") return false;
        } else if (activeTab === "Failed Delivery") {
          if (s.status !== "Failed Delivery") return false;
        }

        // Priority Filter
        if (priorityFilter !== "All" && s.priority !== priorityFilter) {
          return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTracking = s.trackingNo.toLowerCase().includes(q);
          const matchCustomer = s.customerName.toLowerCase().includes(q);
          const matchSender = s.sender.name.toLowerCase().includes(q) || s.sender.city.toLowerCase().includes(q);
          const matchReceiver = s.receiver.name.toLowerCase().includes(q) || s.receiver.city.toLowerCase().includes(q);
          const matchDriver = (s.driverName || "").toLowerCase().includes(q);
          if (
            !matchTracking &&
            !matchCustomer &&
            !matchSender &&
            !matchReceiver &&
            !matchDriver
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if (sortBy === "expectedDate") {
          return (
            new Date(a.expectedDeliveryDate).getTime() -
            new Date(b.expectedDeliveryDate).getTime()
          );
        } else if (sortBy === "weight") {
          return b.package.weightKg - a.package.weightKg;
        }
        return 0;
      });
  }, [shipments, activeTab, priorityFilter, searchQuery, sortBy]);

  const getStatusTone = (status: ShipmentStatus) => {
    switch (status) {
      case "Delivered":
        return "success";
      case "Failed Delivery":
        return "danger";
      case "In Transit":
      case "Out for Delivery":
      case "Dispatched":
        return "info";
      default:
        return "warning";
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}, ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="shp-container">
      {/* Top Header & Metrics Banner */}
      <div className="shp-header">
        <div>
          <h2 className="shp-title">Shipment Management</h2>
          <p className="shp-subtitle">
            Track, dispatch, manage manifests and update real-time status across the logistics network.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={handleExportCSV}
          >
            📊 Export CSV
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--secondary"
            onClick={() => setIsImportOpen(true)}
          >
            📥 Bulk Import CSV
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--primary"
            onClick={() => setIsCreateOpen(true)}
          >
            + Create Shipment
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="shp-kpi-grid">
        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon">📦</span>
            <span className="shp-kpi-card__title">Total Shipments</span>
          </div>
          <div className="shp-kpi-card__value">{stats.total}</div>
          <div className="shp-kpi-card__foot">All created manifests</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">⏳</span>
            <span className="shp-kpi-card__title">Pending / Scheduled</span>
          </div>
          <div className="shp-kpi-card__value">{stats.pending}</div>
          <div className="shp-kpi-card__foot">Awaiting pickup/dispatch</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">🚚</span>
            <span className="shp-kpi-card__title">In Transit & Delivery</span>
          </div>
          <div className="shp-kpi-card__value">{stats.inTransit}</div>
          <div className="shp-kpi-card__foot">Active on road/depot</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">✅</span>
            <span className="shp-kpi-card__title">Delivered</span>
          </div>
          <div className="shp-kpi-card__value">{stats.delivered}</div>
          <div className="shp-kpi-card__foot">Completed with POD</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--danger">⚠️</span>
            <span className="shp-kpi-card__title">Failed Delivery</span>
          </div>
          <div className="shp-kpi-card__value">{stats.failed}</div>
          <div className="shp-kpi-card__foot">Action required</div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="shp-control-bar">
        {/* Status Tabs */}
        <div className="shp-tabs">
          {[
            { key: "All", label: "All Shipments", count: stats.total },
            { key: "Pending", label: "Pending", count: stats.pending },
            { key: "In Transit", label: "In Transit", count: stats.inTransit },
            {
              key: "Out for Delivery",
              label: "Out for Delivery",
              count: shipments.filter((s) => s.status === "Out for Delivery").length,
            },
            { key: "Delivered", label: "Delivered", count: stats.delivered },
            { key: "Failed Delivery", label: "Failed", count: stats.failed },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`shp-tab ${activeTab === tab.key ? "shp-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className="shp-tab__count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Search & Select Filters */}
        <div className="shp-filters-right">
          <div className="shp-search-box">
            <span className="shp-search-icon">🔍</span>
            <input
              type="search"
              placeholder="Search tracking, customer, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="shp-search-clear"
                onClick={() => setSearchQuery("")}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="shp-select-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">Priority: All</option>
            <option value="Standard">Standard</option>
            <option value="Express">Express</option>
            <option value="Same Day">Same Day</option>
            <option value="Overnight">Overnight</option>
          </select>

          <select
            className="shp-select-filter"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="expectedDate">Sort: Expected Delivery</option>
            <option value="weight">Sort: Weight (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="shp-table-card">
        {filteredShipments.length === 0 ? (
          <div className="shp-empty-state">
            <p className="shp-empty-state__title">No shipments found</p>
            <p className="shp-empty-state__text">
              Try adjusting your filter criteria or create a new shipment record.
            </p>
          </div>
        ) : (
          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Customer / Category</th>
                  <th>Origin → Destination</th>
                  <th>Specs (Weight/Qty)</th>
                  <th>Assigned Driver / Fleet</th>
                  <th>Delivery Window</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shp) => (
                  <tr key={shp.id} className="shp-table__row">
                    <td>
                      <button
                        type="button"
                        className="shp-tracking-link"
                        onClick={() => setSelectedDetails(shp)}
                      >
                        {shp.trackingNo}
                      </button>
                      <span className="shp-priority-pill">{shp.priority}</span>
                    </td>

                    <td>
                      <p className="shp-cell-title">{shp.customerName}</p>
                      <span className="shp-cell-sub">{shp.package.category}</span>
                    </td>

                    <td>
                      <div className="shp-route-flow">
                        <span className="shp-route-city">{shp.sender.city}</span>
                        <span className="shp-route-arrow">➔</span>
                        <span className="shp-route-city">{shp.receiver.city}</span>
                      </div>
                      <span className="shp-cell-sub">
                        {shp.sender.name} to {shp.receiver.name}
                      </span>
                    </td>

                    <td>
                      <p className="shp-cell-title">{shp.package.weightKg} kg</p>
                      <span className="shp-cell-sub">
                        {shp.package.count} pkg • {shp.package.lengthCm}x{shp.package.widthCm}x{shp.package.heightCm} cm
                      </span>
                    </td>

                    <td>
                      {shp.driverName ? (
                        <>
                          <p className="shp-cell-title">{shp.driverName}</p>
                          <span className="shp-cell-sub">{shp.vehicleNo || "No vehicle"}</span>
                        </>
                      ) : (
                        <span className="shp-text-muted">Unassigned</span>
                      )}
                    </td>

                    <td>
                      <p className="shp-cell-title">{formatDate(shp.expectedDeliveryDate)}</p>
                      <span className="shp-cell-sub">Pickup: {formatDate(shp.pickupDate)}</span>
                    </td>

                    <td>
                      <span
                        className={`shp-badge shp-badge--${getStatusTone(shp.status)}`}
                      >
                        {shp.status}
                      </span>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div className="shp-action-btns">
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="View Full Details & Timeline"
                          onClick={() => setSelectedDetails(shp)}
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="Update Status"
                          onClick={() => setSelectedUpdateStatus(shp)}
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="Edit Details"
                          onClick={() => setSelectedEdit(shp)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn shp-icon-btn--danger"
                          title="Delete Shipment"
                          onClick={() => handleDeleteShipment(shp.id, shp.trackingNo)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="shp-table-footer">
          <span>
            Showing <strong>{filteredShipments.length}</strong> of{" "}
            <strong>{shipments.length}</strong> total shipments
          </span>
        </div>
      </div>

      {/* Render Modals */}
      <CreateShipmentModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateShipment}
      />

      <BulkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleImportShipments}
      />

      <ShipmentDetailsModal
        shipment={selectedDetails}
        onClose={() => setSelectedDetails(null)}
        onOpenUpdateStatus={(s) => {
          setSelectedDetails(null);
          setSelectedUpdateStatus(s);
        }}
        onOpenEdit={(s) => {
          setSelectedDetails(null);
          setSelectedEdit(s);
        }}
      />

      <UpdateStatusModal
        shipment={selectedUpdateStatus}
        onClose={() => setSelectedUpdateStatus(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <EditShipmentModal
        shipment={selectedEdit}
        isOpen={!!selectedEdit}
        onClose={() => setSelectedEdit(null)}
        onSave={handleSaveEdit}
      />
    </div>
  );
};
