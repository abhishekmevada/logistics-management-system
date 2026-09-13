import React, { useState, useEffect } from "react";
import type { Shipment, ShipmentPriority } from "../../types/shipment";

interface EditShipmentModalProps {
  shipment: Shipment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedShipment: Shipment) => void;
}

export const EditShipmentModal: React.FC<EditShipmentModalProps> = ({
  shipment,
  isOpen,
  onClose,
  onSave,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [priority, setPriority] = useState<ShipmentPriority>("Standard");
  const [driverName, setDriverName] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [tripNo, setTripNo] = useState("");
  const [weightKg, setWeightKg] = useState<number>(0);
  const [count, setCount] = useState<number>(1);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (shipment) {
      setCustomerName(shipment.customerName);
      setPriority(shipment.priority);
      setDriverName(shipment.driverName || "");
      setVehicleNo(shipment.vehicleNo || "");
      setTripNo(shipment.tripNo || "");
      setWeightKg(shipment.package.weightKg);
      setCount(shipment.package.count);
      setCategory(shipment.package.category);
      setDescription(shipment.package.description);
    }
  }, [shipment]);

  if (!isOpen || !shipment) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Shipment = {
      ...shipment,
      customerName,
      priority,
      driverName: driverName || undefined,
      vehicleNo: vehicleNo || undefined,
      tripNo: tripNo || undefined,
      package: {
        ...shipment.package,
        count: Number(count),
        weightKg: Number(weightKg),
        category,
        description,
      },
    };
    onSave(updated);
    onClose();
  };

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--md">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Edit Shipment Details</h3>
            <p className="shp-modal__subtitle">Tracking #{shipment.trackingNo}</p>
          </div>
          <button type="button" className="shp-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shp-modal__form">
          <div className="shp-form-group">
            <label>Customer Name</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div className="shp-form-row">
            <div className="shp-form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as ShipmentPriority)}
              >
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Same Day">Same Day</option>
                <option value="Overnight">Overnight</option>
              </select>
            </div>
            <div className="shp-form-group">
              <label>Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>
          </div>

          <div className="shp-form-row">
            <div className="shp-form-group">
              <label>Quantity / Packages</label>
              <input
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
            <div className="shp-form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="shp-form-group">
            <label>Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="shp-form-card">
            <h4 className="shp-form-card__title">Fleet & Driver Re-assignment</h4>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. R. Mehta"
                />
              </div>
              <div className="shp-form-group">
                <label>Vehicle Reg No</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH-12-AB-4521"
                />
              </div>
              <div className="shp-form-group">
                <label>Trip Manifest No</label>
                <input
                  type="text"
                  value={tripNo}
                  onChange={(e) => setTripNo(e.target.value)}
                  placeholder="e.g. TRP-1092"
                />
              </div>
            </div>
          </div>

          <div className="shp-modal__footer">
            <button type="button" className="shp-btn shp-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="shp-btn shp-btn--primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
