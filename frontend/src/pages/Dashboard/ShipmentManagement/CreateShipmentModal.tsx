import React, { useState } from "react";
import type { Shipment, ShipmentPriority } from "../../../types/shipment";
import { useNavigate } from "react-router-dom";

interface CreateShipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newShipment: Shipment) => void;
}

export const CreateShipmentModal: React.FC<CreateShipmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const token = localStorage.getItem("token");
  const navi = useNavigate();

  if (!token) {
    navi("/login");
  }
  // Unified Form State
  const [formData, setFormData] = useState({
    customerId: "Apex Retail Solutions",
    priority: "Standard" as ShipmentPriority,
    pickupDate: "2026-09-08T09:00",
    expectedDeliveryDate: "2026-09-10T18:00",

    // Sender
    senderName: "Apex Distribution Hub",
    senderPhoneNumber: "+91 98765 12345",
    senderEmail: "dispatch@apexretail.com",
    senderAddress: "Plot 12, Industrial Area, Chakan",
    senderPincode: "410501",

    // Receiver
    receiverName: "Metro Supply Chains",
    receiverPhone: "+91 91234 98765",
    receiverEmail: "receiving@metrosupply.in",
    receiverAddress: "55 Cargo Logistics Park, Guindy",
    receiverPincode: "600032",

    // Package
    category: "Electronics",
    description: "Industrial Router Units & Accessories",
    count: 5,
    weightKg: 45.5,
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    declaredValue: 120000,

    // Driver / Vehicle / Trip
    driverName: "R. Mehta",
    vehicleNo: "MH-12-AB-4521",
    tripNo: "TRP-1092",
  });

  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const {
    customerId,
    priority,
    pickupDate,
    expectedDeliveryDate,
    senderName,
    senderPhoneNumber,
    senderEmail,
    senderAddress,
    senderPincode,
    receiverName,
    receiverPhone,
    receiverEmail,
    receiverAddress,
    receiverPincode,
    category,
    description,
    count,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    declaredValue,
    driverName,
    vehicleNo,
    tripNo,
  } = formData;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/createshipment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      if (onSubmit) {
        onSubmit(data.shipment || data);
      }
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "something wrong");
    }
  };

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--lg">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Create New Shipment</h3>
            <p className="shp-modal__subtitle">
              System will generate a unique internal tracking number upon
              creation.
            </p>
            <p>{error}</p>
          </div>
          <button type="button" className="shp-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="shp-stepper-tabs">
          <button
            type="button"
            className={`shp-stepper-tab ${activeStep === 1 ? "shp-stepper-tab--active" : ""}`}
            onClick={() => setActiveStep(1)}
          >
            1. Sender & Receiver
          </button>
          <button
            type="button"
            className={`shp-stepper-tab ${activeStep === 2 ? "shp-stepper-tab--active" : ""}`}
            onClick={() => setActiveStep(2)}
          >
            2. Package Details
          </button>
          <button
            type="button"
            className={`shp-stepper-tab ${activeStep === 3 ? "shp-stepper-tab--active" : ""}`}
            onClick={() => setActiveStep(3)}
          >
            3. Dates & Assignment
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shp-modal__form">
          {activeStep === 1 && (
            <div className="shp-form-grid">
              <div className="shp-form-group shp-form-group--full">
                <label>Customer Id</label>
                <input
                  type="text"
                  name="customerId"
                  required
                  value={customerId}
                  onChange={handleChange}
                  placeholder="123456"
                />
              </div>

              {/* Sender Details */}
              <div className="shp-form-card">
                <h4 className="shp-form-card__title">Pickup Origin (Sender)</h4>
                <div className="shp-form-group">
                  <label>Sender / Warehouse Name</label>
                  <input
                    type="text"
                    name="senderName"
                    required
                    value={senderName}
                    onChange={handleChange}
                  />
                </div>
                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="senderPhoneNumber"
                      required
                      value={senderPhoneNumber}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="senderEmail"
                      required
                      value={senderEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="shp-form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="senderAddress"
                    required
                    value={senderAddress}
                    onChange={handleChange}
                  />
                </div>
                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="senderPincode"
                      required
                      value={senderPincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Receiver Details */}
              <div className="shp-form-card">
                <h4 className="shp-form-card__title">Destination (Receiver)</h4>
                <div className="shp-form-group">
                  <label>Receiver Contact / Company</label>
                  <input
                    type="text"
                    name="receiverName"
                    required
                    value={receiverName}
                    onChange={handleChange}
                  />
                </div>
                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Phone Number</label>
                    <input
                      type="text"
                      name="receiverPhone"
                      required
                      value={receiverPhone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="receiverEmail"
                      required
                      value={receiverEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="shp-form-group">
                  <label>Street Address</label>
                  <input
                    type="text"
                    name="receiverAddress"
                    required
                    value={receiverAddress}
                    onChange={handleChange}
                  />
                </div>
                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      name="receiverPincode"
                      required
                      value={receiverPincode}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="shp-form-grid">
              <div className="shp-form-card shp-form-group--full">
                <h4 className="shp-form-card__title">Package Specifications</h4>
                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Item Category</label>
                    <select
                      name="category"
                      value={category}
                      onChange={handleChange}
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="Automotive Parts">Automotive Parts</option>
                      <option value="Pharmaceuticals">Pharmaceuticals</option>
                      <option value="Textiles">Textiles</option>
                      <option value="Chemicals">Chemicals</option>
                      <option value="General Cargo">General Cargo</option>
                    </select>
                  </div>
                  <div className="shp-form-group">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={priority}
                      onChange={handleChange}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Express">Express</option>
                      <option value="Same Day">Same Day</option>
                      <option value="Overnight">Overnight</option>
                    </select>
                  </div>
                </div>

                <div className="shp-form-group">
                  <label>Package Description</label>
                  <textarea
                    rows={2}
                    name="description"
                    required
                    value={description}
                    onChange={handleChange}
                    placeholder="Brief description of items inside..."
                  />
                </div>

                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Quantity / Package Count</label>
                    <input
                      type="number"
                      name="count"
                      min={1}
                      required
                      value={count}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Total Weight (kg)</label>
                    <input
                      type="number"
                      name="weightKg"
                      step="0.1"
                      min={0.1}
                      required
                      value={weightKg}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Declared Value (₹)</label>
                    <input
                      type="number"
                      name="declaredValue"
                      min={0}
                      value={declaredValue}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Length (cm)</label>
                    <input
                      type="number"
                      name="lengthCm"
                      value={lengthCm}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Width (cm)</label>
                    <input
                      type="number"
                      name="widthCm"
                      value={widthCm}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      name="heightCm"
                      value={heightCm}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="shp-form-grid">
              <div className="shp-form-card shp-form-group--full">
                <h4 className="shp-form-card__title">
                  Schedules & Fleet Assignment
                </h4>
                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Scheduled Pickup Date & Time</label>
                    <input
                      type="datetime-local"
                      name="pickupDate"
                      required
                      value={pickupDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>Expected Delivery Date & Time</label>
                    <input
                      type="datetime-local"
                      name="expectedDeliveryDate"
                      required
                      value={expectedDeliveryDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="shp-form-row">
                  <div className="shp-form-group">
                    <label>Assigned Driver (Optional)</label>
                    <select
                      name="driverName"
                      value={driverName}
                      onChange={handleChange}
                    >
                      <option value="">Unassigned</option>
                      <option value="R. Mehta">R. Mehta</option>
                      <option value="S. Kulkarni">S. Kulkarni</option>
                      <option value="K. Sharma">K. Sharma</option>
                      <option value="A. Singh">A. Singh</option>
                      <option value="V. Patil">V. Patil</option>
                    </select>
                  </div>
                  <div className="shp-form-group">
                    <label>Assigned Vehicle (Optional)</label>
                    <select
                      name="vehicleNo"
                      value={vehicleNo}
                      onChange={handleChange}
                    >
                      <option value="">Unassigned</option>
                      <option value="MH-12-AB-4521">
                        MH-12-AB-4521 (Container)
                      </option>
                      <option value="MH-14-GH-8901">
                        MH-14-GH-8901 (Heavy Truck)
                      </option>
                      <option value="GJ-06-CD-1234">
                        GJ-06-CD-1234 (Reefer Van)
                      </option>
                      <option value="RJ-14-XY-6789">
                        RJ-14-XY-6789 (Medium Commercial)
                      </option>
                      <option value="MH-04-EF-2345">
                        MH-04-EF-2345 (Pickup Van)
                      </option>
                    </select>
                  </div>
                  <div className="shp-form-group">
                    <label>Trip Manifest ID (Optional)</label>
                    <input
                      type="text"
                      name="tripNo"
                      value={tripNo}
                      onChange={handleChange}
                      placeholder="e.g. TRP-1092"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="shp-modal__footer">
            {activeStep > 1 && (
              <button
                type="button"
                className="shp-btn shp-btn--secondary"
                onClick={() => setActiveStep((prev) => prev - 1)}
              >
                Back
              </button>
            )}
            <div className="shp-modal__footer-right">
              <button
                type="button"
                className="shp-btn shp-btn--ghost"
                onClick={onClose}
              >
                Cancel
              </button>
              {activeStep < 3 ? (
                <button
                  type="button"
                  className="shp-btn shp-btn--primary"
                  onClick={() => setActiveStep((prev) => prev + 1)}
                >
                  Next Step
                </button>
              ) : (
                <button type="submit" className="shp-btn shp-btn--primary">
                  Create Shipment
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
