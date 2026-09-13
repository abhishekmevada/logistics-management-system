import React, { useState } from "react";
import type { Shipment, ShipmentStatus } from "../../../types/shipment";

interface UpdateStatusModalProps {
  shipment: Shipment | null;
  onClose: () => void;
  onUpdateStatus: (
    shipmentId: string,
    newStatus: ShipmentStatus,
    location: string,
    notes: string,
    updatedBy: string,
  ) => void;
}

const ALL_STATUSES: ShipmentStatus[] = [
  "Created",
  "Pickup Scheduled",
  "Picked Up",
  "At Warehouse",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Failed Delivery",
];

export const UpdateStatusModal: React.FC<UpdateStatusModalProps> = ({
  shipment,
  onClose,
  onUpdateStatus,
}) => {
  const [newStatus, setNewStatus] = useState<ShipmentStatus>(
    shipment ? shipment.status : "In Transit",
  );
  const [location, setLocation] = useState<string>(
    shipment ? shipment.sender.city : "Central Hub",
  );
  const [notes, setNotes] = useState<string>("");
  const [updatedBy, setUpdatedBy] = useState<string>("Dispatcher");

  if (!shipment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert("Please provide update notes for the audit log.");
      return;
    }
    onUpdateStatus(shipment.id, newStatus, location, notes, updatedBy);
    onClose();
  };

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--sm">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Update Shipment Status</h3>
            <p className="shp-modal__subtitle">
              Tracking #{shipment.trackingNo}
            </p>
          </div>
          <button type="button" className="shp-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shp-modal__form">
          <div className="shp-form-group">
            <label>Current Status</label>
            <div
              className="shp-badge shp-badge--outline"
              style={{ padding: "10px" }}
            >
              {shipment.status}
            </div>
          </div>

          <div className="shp-form-group">
            <label>New Status Transition</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as ShipmentStatus)}
            >
              {ALL_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="shp-form-group">
            <label>Current Location / Hub</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Pune Warehouse Bay 4, NH-48 Toll..."
            />
          </div>

          <div className="shp-form-group">
            <label>Update Notes & Reasons</label>
            <textarea
              rows={3}
              required
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail the operational status change (e.g. Package arrived at hub, scanned for dispatch...)"
            />
          </div>

          <div className="shp-form-group">
            <label>Updated By (Role/User)</label>
            <select
              required
              value={updatedBy}
              onChange={(e) => setUpdatedBy(e.target.value)}
            >
              <option value="" disabled>
                Select a role
              </option>
              {/* <option value="Customer">Customer</option> */}
              <option value="Admin">Admin</option>
              <option value="Logistics Manager">Logistics Manager</option>
              <option value="Dispatcher">Dispatcher</option>
              <option value="Warehouse Manager">Warehouse Manager</option>
              <option value="Driver">Driver</option>
            </select>
          </div>

          <div className="shp-modal__footer">
            <button
              type="button"
              className="shp-btn shp-btn--ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="shp-btn shp-btn--primary">
              Save Status Update
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
