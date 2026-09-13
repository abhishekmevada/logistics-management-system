import React from "react";
import type { Shipment, ShipmentStatus } from "../../types/shipment";

interface ShipmentDetailsModalProps {
  shipment: Shipment | null;
  onClose: () => void;
  onOpenUpdateStatus: (shipment: Shipment) => void;
  onOpenEdit: (shipment: Shipment) => void;
}

const WORKFLOW_STEPS: ShipmentStatus[] = [
  "Created",
  "Pickup Scheduled",
  "Picked Up",
  "At Warehouse",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

export const ShipmentDetailsModal: React.FC<ShipmentDetailsModalProps> = ({
  shipment,
  onClose,
  onOpenUpdateStatus,
  onOpenEdit,
}) => {
  if (!shipment) return null;

  const currentStepIndex =
    shipment.status === "Failed Delivery"
      ? WORKFLOW_STEPS.indexOf("Out for Delivery")
      : WORKFLOW_STEPS.indexOf(shipment.status);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--xl">
        <div className="shp-modal__header">
          <div className="shp-details-head">
            <span className="shp-details-head__tracking">{shipment.trackingNo}</span>
            <span
              className={`shp-badge shp-badge--${getStatusTone(shipment.status)}`}
            >
              {shipment.status}
            </span>
            <span className="shp-badge shp-badge--outline">{shipment.priority} Priority</span>
          </div>
          <div className="shp-modal__actions-top">
            <button
              type="button"
              className="shp-btn shp-btn--secondary shp-btn--sm"
              onClick={() => onOpenUpdateStatus(shipment)}
            >
              Update Status
            </button>
            <button
              type="button"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              onClick={() => onOpenEdit(shipment)}
            >
              Edit Details
            </button>
            <button type="button" className="shp-modal__close" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="shp-modal__body">
          {/* Status Stepper visualization */}
          <div className="shp-stepper-card">
            <h4 className="shp-section-title">Shipment Lifecycle Workflow</h4>
            {shipment.status === "Failed Delivery" && (
              <div className="shp-alert shp-alert--danger">
                <strong>Delivery Attempt Failed:</strong> {shipment.events[shipment.events.length - 1]?.notes}
              </div>
            )}
            <div className="shp-stepper">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && shipment.status === "Delivered");
                const isCurrent = idx === currentStepIndex && shipment.status !== "Delivered";

                return (
                  <div
                    key={step}
                    className={`shp-stepper__step ${isCompleted ? "shp-stepper__step--completed" : ""} ${isCurrent ? "shp-stepper__step--current" : ""}`}
                  >
                    <div className="shp-stepper__circle">
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <span className="shp-stepper__label">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="shp-details-grid">
            {/* Column 1: Addresses & Spec Cards */}
            <div className="shp-details-col">
              {/* Origin vs Destination */}
              <div className="shp-card-group">
                <div className="shp-card">
                  <div className="shp-card__header">
                    <span className="shp-card__icon shp-card__icon--origin">📍</span>
                    <h5 className="shp-card__title">Pickup Origin (Sender)</h5>
                  </div>
                  <div className="shp-card__content">
                    <p className="shp-address-name">{shipment.sender.name}</p>
                    <p className="shp-address-text">{shipment.sender.address}</p>
                    <p className="shp-address-text">
                      {shipment.sender.city}, {shipment.sender.state} - {shipment.sender.pincode}
                    </p>
                    <div className="shp-address-contact">
                      <span>📞 {shipment.sender.phone}</span>
                      <span>✉️ {shipment.sender.email}</span>
                    </div>
                  </div>
                </div>

                <div className="shp-card">
                  <div className="shp-card__header">
                    <span className="shp-card__icon shp-card__icon--dest">🏁</span>
                    <h5 className="shp-card__title">Destination (Receiver)</h5>
                  </div>
                  <div className="shp-card__content">
                    <p className="shp-address-name">{shipment.receiver.name}</p>
                    <p className="shp-address-text">{shipment.receiver.address}</p>
                    <p className="shp-address-text">
                      {shipment.receiver.city}, {shipment.receiver.state} - {shipment.receiver.pincode}
                    </p>
                    <div className="shp-address-contact">
                      <span>📞 {shipment.receiver.phone}</span>
                      <span>✉️ {shipment.receiver.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Specs */}
              <div className="shp-card">
                <h5 className="shp-card__title">Package & Cargo Specifications</h5>
                <div className="shp-kv-grid">
                  <div className="shp-kv">
                    <span className="shp-kv__label">Category</span>
                    <span className="shp-kv__value">{shipment.package.category}</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Package Count</span>
                    <span className="shp-kv__value">{shipment.package.count} units</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Total Weight</span>
                    <span className="shp-kv__value">{shipment.package.weightKg} kg</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Dimensions (LxWxH)</span>
                    <span className="shp-kv__value">
                      {shipment.package.lengthCm} × {shipment.package.widthCm} × {shipment.package.heightCm} cm
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Declared Value</span>
                    <span className="shp-kv__value">
                      ₹{shipment.package.declaredValue?.toLocaleString("en-IN") || "N/A"}
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Customer Account</span>
                    <span className="shp-kv__value">{shipment.customerName}</span>
                  </div>
                </div>
                <div className="shp-package-desc">
                  <strong>Description:</strong> {shipment.package.description}
                </div>
              </div>

              {/* Fleet & Trip Assignment */}
              <div className="shp-card">
                <h5 className="shp-card__title">Assigned Fleet & Trip</h5>
                <div className="shp-kv-grid">
                  <div className="shp-kv">
                    <span className="shp-kv__label">Assigned Driver</span>
                    <span className="shp-kv__value">{shipment.driverName || "Unassigned"}</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Vehicle Reg. No.</span>
                    <span className="shp-kv__value">{shipment.vehicleNo || "Unassigned"}</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Trip Manifest #</span>
                    <span className="shp-kv__value">{shipment.tripNo || "No active trip"}</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Pickup Date</span>
                    <span className="shp-kv__value">{formatDate(shipment.pickupDate)}</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Expected Delivery</span>
                    <span className="shp-kv__value">{formatDate(shipment.expectedDeliveryDate)}</span>
                  </div>
                  {shipment.deliveredAt && (
                    <div className="shp-kv">
                      <span className="shp-kv__label">Delivered At</span>
                      <span className="shp-kv__value shp-kv__value--success">
                        {formatDate(shipment.deliveredAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 2: Event History Timeline & Documents */}
            <div className="shp-details-col">
              {/* Documents Card */}
              <div className="shp-card">
                <h5 className="shp-card__title">Shipment Documents</h5>
                {shipment.documents.length === 0 ? (
                  <p className="shp-text-muted">No documents uploaded yet.</p>
                ) : (
                  <ul className="shp-doc-list">
                    {shipment.documents.map((doc) => (
                      <li key={doc.id} className="shp-doc-item">
                        <div className="shp-doc-item__info">
                          <span className="shp-doc-item__icon">📄</span>
                          <div>
                            <p className="shp-doc-item__name">{doc.name}</p>
                            <span className="shp-doc-item__meta">
                              {doc.size} • Uploaded {formatDate(doc.uploadedAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="shp-btn shp-btn--ghost shp-btn--xs"
                          onClick={() => alert(`Downloading document ${doc.name}...`)}
                        >
                          Download
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Status Timeline Card */}
              <div className="shp-card">
                <h5 className="shp-card__title">Status History & Audit Logs</h5>
                <ul className="shp-timeline">
                  {shipment.events.map((evt) => (
                    <li key={evt.id} className="shp-timeline__item">
                      <div className="shp-timeline__marker" />
                      <div className="shp-timeline__content">
                        <div className="shp-timeline__head">
                          <span className="shp-timeline__status">{evt.status}</span>
                          <span className="shp-timeline__time">{formatDate(evt.timestamp)}</span>
                        </div>
                        <p className="shp-timeline__notes">{evt.notes}</p>
                        <span className="shp-timeline__meta">
                          📍 {evt.location} • By {evt.updatedBy}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
