import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ShipmentManagement.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const WORKFLOW_STEPS = [
  "Created",
  "Pickup Scheduled",
  "Picked Up",
  "At Warehouse",
  "Dispatched",
  "In Transit",
  "Out for Delivery",
  "Delivered",
];

const STATUS_OPTIONS = [
  { value: "created", label: "Created" },
  { value: "pickup_scheduled", label: "Pickup Scheduled" },
  { value: "picked_up", label: "Picked Up" },
  { value: "at_warehouse", label: "At Warehouse" },
  { value: "dispatched", label: "Dispatched" },
  { value: "in_transit", label: "In Transit" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "failed_delivery", label: "Failed Delivery" },
];

// ==========================================
// 1. CREATE SHIPMENT MODAL
// ==========================================
function CreateShipmentModal({ isOpen, onClose, onSubmit }) {
  const [activeStep, setActiveStep] = useState(1);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("token");

  // Unified Form State
  const [formData, setFormData] = useState({
    customerId: "",
    priority: "Standard",
    pickupDate: "2026-09-08T09:00",
    expectedDeliveryDate: "2026-09-10T18:00",

    // Sender
    senderName: "Apex Distribution Hub",
    senderPhoneNumber: "+91 98765 12345",
    senderEmail: "dispatch@apexretail.com",
    senderAddress: "Plot 12, Industrial Area, Chakan",
    senderCity: "Pune",
    senderState: "Maharashtra",
    senderPincode: "410501",

    // Receiver
    receiverName: "Metro Supply Chains",
    receiverPhoneNumber: "+91 91234 98765",
    receiverEmail: "receiving@metrosupply.in",
    receiverAddress: "55 Cargo Logistics Park, Guindy",
    receiverCity: "Chennai",
    receiverState: "Tamil Nadu",
    receiverPincode: "600032",

    // Package
    description: "Industrial Router Units & Accessories",
    count: 5,
    weightKg: 45.5,
    lengthCm: 50,
    widthCm: 40,
    heightCm: 30,
    // declaredValue: 120000,

    // Driver / Vehicle / Trip
    driverName: "R. Mehta",
    vehicleNo: "MH-12-AB-4521",
    tripNo: "TRP-1092",
  });

  const handleChange = (e) => {
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
    senderCity,
    senderState,
    senderPincode,
    receiverName,
    receiverPhoneNumber,
    receiverEmail,
    receiverAddress,
    receiverCity,
    receiverState,
    receiverPincode,
    description,
    count,
    weightKg,
    lengthCm,
    widthCm,
    heightCm,
    driverName,
    vehicleNo,
    tripNo,
  } = formData;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
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
    } catch (err) {
      setError(err?.message || "something wrong");
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
          </div>
          <button type="button" className="shp-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "8px 16px",
              margin: "12px 24px 0",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

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
                <label>Customer Name/ID</label>
                <input
                  type="text"
                  name="customerId"
                  required
                  value={customerId}
                  onChange={handleChange}
                  placeholder="john/123456"
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
                    <label>City</label>
                    <input
                      type="text"
                      name="senderCity"
                      required
                      value={senderCity}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="senderState"
                      required
                      value={senderState}
                      onChange={handleChange}
                    />
                  </div>
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
                      name="receiverPhoneNumber"
                      required
                      value={receiverPhoneNumber}
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
                    <label>City</label>
                    <input
                      type="text"
                      name="receiverCity"
                      required
                      value={receiverCity}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="shp-form-group">
                    <label>State</label>
                    <input
                      type="text"
                      name="receiverState"
                      required
                      value={receiverState}
                      onChange={handleChange}
                    />
                  </div>
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
                  {/* <div className="shp-form-group">
                    <label>Declared Value (₹)</label>
                    <input
                      type="number"
                      name="declaredValue"
                      min={0}
                      value={declaredValue}
                      onChange={handleChange}
                    />
                  </div> */}
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
}

// ==========================================
// 2. EDIT SHIPMENT MODAL
// Helper to convert ISO date to datetime-local input string (YYYY-MM-DDTHH:mm)
function toDatetimeLocal(val) {
  if (!val) return "";
  try {
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      return val.slice(0, 16);
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

// ==========================================
// 2. EDIT SHIPMENT MODAL
// ==========================================
function EditShipmentModal({ shipment, isOpen, onClose, onSave }) {
  if (!isOpen || !shipment) return null;

  const modalKey = `${shipment._id || shipment.id || shipment.shipmentId || "edit"}-${shipment.updatedAt || "current"}`;

  return (
    <EditShipmentModalContent
      key={modalKey}
      shipment={shipment}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

function EditShipmentModalContent({ shipment, onClose, onSave }) {
  // Customer
  const [customerName, setCustomerName] = useState(
    shipment.customerId?.name ||
      shipment.customerName ||
      (typeof shipment.customerId === "string" ? shipment.customerId : "") ||
      "",
  );

  // Sender
  const [senderName, setSenderName] = useState(
    shipment.senderName || shipment.sender?.name || "",
  );
  const [senderPhoneNumber, setSenderPhoneNumber] = useState(
    shipment.senderPhoneNumber ||
      shipment.senderPhone ||
      shipment.sender?.phone ||
      "",
  );
  const [senderEmail, setSenderEmail] = useState(
    shipment.senderEmail || shipment.sender?.email || "",
  );
  const [senderAddress, setSenderAddress] = useState(
    shipment.senderAddress ||
      shipment.pickupAddress ||
      shipment.sender?.address ||
      "",
  );
  const [senderCity, setSenderCity] = useState(
    shipment.senderCity || shipment.sender?.city || "",
  );
  const [senderState, setSenderState] = useState(
    shipment.senderState || shipment.sender?.state || "",
  );
  const [senderpincode, setSenderpincode] = useState(
    shipment.senderpincode ??
      shipment.senderPincode ??
      shipment.sender?.pincode ??
      "",
  );

  // Receiver
  const [receiverName, setReceiverName] = useState(
    shipment.receiverName || shipment.receiver?.name || "",
  );
  const [receiverPhoneNumber, setReceiverPhoneNumber] = useState(
    shipment.receiverPhoneNumber ||
      shipment.receiverPhone ||
      shipment.receiver?.phone ||
      "",
  );
  const [receiverEmail, setReceiverEmail] = useState(
    shipment.receiverEmail || shipment.receiver?.email || "",
  );
  const [receiverAddress, setReceiverAddress] = useState(
    shipment.receiverAddress ||
      shipment.deliveryAddress ||
      shipment.receiver?.address ||
      "",
  );
  const [receiverCity, setReceiverCity] = useState(
    shipment.receiverCity || shipment.receiver?.city || "",
  );
  const [receiverState, setReceiverState] = useState(
    shipment.receiverState || shipment.receiver?.state || "",
  );
  const [receiverpincode, setReceiverpincode] = useState(
    shipment.receiverpincode ??
      shipment.receiverPincode ??
      shipment.receiver?.pincode ??
      "",
  );

  // Package
  const [packageDescription, setPackageDescription] = useState(
    shipment.packageDescription ||
      shipment.description ||
      shipment.package?.description ||
      "",
  );
  const [packageCount, setPackageCount] = useState(
    shipment.packageCount ?? shipment.count ?? shipment.package?.count ?? 1,
  );
  const [totalWeight, setTotalWeight] = useState(
    shipment.totalWeight ??
      shipment.weightKg ??
      shipment.package?.weightKg ??
      0,
  );
  const [length, setLength] = useState(
    shipment.dimensions?.length ??
      shipment.lengthCm ??
      shipment.package?.lengthCm ??
      0,
  );
  const [width, setWidth] = useState(
    shipment.dimensions?.width ??
      shipment.widthCm ??
      shipment.package?.widthCm ??
      0,
  );
  const [height, setHeight] = useState(
    shipment.dimensions?.height ??
      shipment.heightCm ??
      shipment.package?.heightCm ??
      0,
  );

  // Dates
  const [pickupDate, setPickupDate] = useState(
    toDatetimeLocal(shipment.pickupDate),
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    toDatetimeLocal(shipment.expectedDeliveryDate),
  );

  // Assignment & Priority
  const [priority, setPriority] = useState(shipment.priority || "Standard");
  const [driverName, setDriverName] = useState(shipment.driverName || "");
  const [vehicleNo, setVehicleNo] = useState(shipment.vehicleNo || "");
  const [tripNo, setTripNo] = useState(shipment.tripNo || "");

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    const updatedData = {
      customerName,
      senderName,
      senderPhoneNumber,
      senderEmail,
      senderAddress,
      senderCity,
      senderState,
      senderpincode: Number(senderpincode) || 0,
      receiverName,
      receiverPhoneNumber,
      receiverEmail,
      receiverAddress,
      receiverCity,
      receiverState,
      receiverpincode: Number(receiverpincode) || 0,
      packageDescription,
      packageCount: Number(packageCount),
      totalWeight: Number(totalWeight),
      dimensions: {
        length: Number(length),
        width: Number(width),
        height: Number(height),
      },
      pickupDate: new Date(pickupDate),
      expectedDeliveryDate: new Date(expectedDeliveryDate),
      priority,
      driverName,
      vehicleNo,
      tripNo,
    };

    const targetId = shipment._id || shipment.id || shipment.shipmentId;
    const result = await onSave(targetId, updatedData);

    setIsSaving(false);
    if (result?.success) {
      onClose();
    } else {
      setError(result?.message || "Failed to save shipment changes");
    }
  };

  const trackingNo =
    shipment.trackingId || shipment.shipmentId || shipment.trackingNo || "N/A";

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--lg">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Edit Shipment Details</h3>
            <p className="shp-modal__subtitle">Tracking #{trackingNo}</p>
          </div>
          <button
            type="button"
            className="shp-modal__close"
            onClick={onClose}
            disabled={isSaving}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shp-modal__form">
          {error && <div className="shp-alert shp-alert--danger">{error}</div>}

          {/* Customer Identification */}
          <div className="shp-form-card">
            <h4 className="shp-form-card__title">Customer & Tracking Info</h4>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Tracking Number</label>
                <input
                  type="text"
                  value={trackingNo}
                  disabled
                  style={{ background: "#f8f9fa", color: "#666" }}
                />
              </div>
              <div className="shp-form-group">
                <label>Customer Name / Account</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Apex Retail Solutions"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Sender Details */}
          <div className="shp-form-card">
            <h4 className="shp-form-card__title">Pickup Origin (Sender)</h4>
            <div className="shp-form-group">
              <label>Sender / Warehouse Name</label>
              <input
                type="text"
                required
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  required
                  value={senderPhoneNumber}
                  onChange={(e) => setSenderPhoneNumber(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="shp-form-group">
              <label>Street Address</label>
              <input
                type="text"
                required
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>City</label>
                <input
                  type="text"
                  value={senderCity}
                  onChange={(e) => setSenderCity(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>State</label>
                <input
                  type="text"
                  value={senderState}
                  onChange={(e) => setSenderState(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={senderpincode}
                  onChange={(e) => setSenderpincode(e.target.value)}
                  disabled={isSaving}
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
                required
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  required
                  value={receiverPhoneNumber}
                  onChange={(e) => setReceiverPhoneNumber(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={receiverEmail}
                  onChange={(e) => setReceiverEmail(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="shp-form-group">
              <label>Street Address</label>
              <input
                type="text"
                required
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>City</label>
                <input
                  type="text"
                  value={receiverCity}
                  onChange={(e) => setReceiverCity(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>State</label>
                <input
                  type="text"
                  value={receiverState}
                  onChange={(e) => setReceiverState(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={receiverpincode}
                  onChange={(e) => setReceiverpincode(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Package Details */}
          <div className="shp-form-card">
            <h4 className="shp-form-card__title">Package Specifications</h4>
            <div className="shp-form-group">
              <label>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={isSaving}
              >
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
                <option value="Same Day">Same Day</option>
                <option value="Overnight">Overnight</option>
              </select>
            </div>

            <div className="shp-form-group">
              <label>Package Description</label>
              <textarea
                rows={2}
                required
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                placeholder="Brief description of cargo..."
                disabled={isSaving}
              />
            </div>

            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Quantity / Packages</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={packageCount}
                  onChange={(e) => setPackageCount(Number(e.target.value))}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Total Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  required
                  value={totalWeight}
                  onChange={(e) => setTotalWeight(Number(e.target.value))}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Length (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Width (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Height (cm)</label>
                <input
                  type="number"
                  min={0}
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="shp-form-card">
            <h4 className="shp-form-card__title">Pickup & Delivery Schedule</h4>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Scheduled Pickup Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Expected Delivery Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          {/* Fleet & Driver */}
          <div className="shp-form-card">
            <h4 className="shp-form-card__title">Fleet & Driver Assignment</h4>
            <div className="shp-form-row">
              <div className="shp-form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="e.g. R. Mehta"
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Vehicle Reg No</label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  placeholder="e.g. MH-12-AB-4521"
                  disabled={isSaving}
                />
              </div>
              <div className="shp-form-group">
                <label>Trip Manifest No</label>
                <input
                  type="text"
                  value={tripNo}
                  onChange={(e) => setTripNo(e.target.value)}
                  placeholder="e.g. TRP-1092"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>

          <div className="shp-modal__footer">
            <button
              type="button"
              className="shp-btn shp-btn--ghost"
              onClick={onClose}
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="shp-btn shp-btn--primary"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 3. SHIPMENT DETAILS MODAL
// ==========================================
function ShipmentDetailsModal({
  shipment,
  onClose,
  onOpenUpdateStatus,
  onOpenEdit,
}) {
  if (!shipment) return null;

  const trackingNo =
    shipment.trackingId || shipment.shipmentId || shipment.trackingNo || "N/A";
  const customer = shipment.customerId?.name || shipment.customerName || "N/A";

  const formatStatus = (s) =>
    (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const normalizedStatus = formatStatus(shipment.status);

  const currentStepIndex =
    normalizedStatus === "Failed Delivery"
      ? WORKFLOW_STEPS.indexOf("Out for Delivery")
      : WORKFLOW_STEPS.indexOf(normalizedStatus);

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusTone = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "delivered") return "success";
    if (s === "failed delivery" || s === "failed_delivery") return "danger";
    if (
      [
        "in transit",
        "in_transit",
        "out for delivery",
        "out_for_delivery",
        "dispatched",
      ].includes(s)
    )
      return "info";
    return "warning";
  };

  const sender = {
    name: shipment.senderName || shipment.sender?.name || "N/A",
    address: shipment.senderAddress || shipment.sender?.address || "N/A",
    city: shipment.senderCity || shipment.sender?.city || "",
    state: shipment.senderState || shipment.sender?.state || "",
    pincode:
      shipment.senderpincode ||
      shipment.senderPincode ||
      shipment.sender?.pincode ||
      "",
    phone:
      shipment.senderPhoneNumber ||
      shipment.senderPhone ||
      shipment.sender?.phone ||
      "N/A",
    email: shipment.senderEmail || shipment.sender?.email || "N/A",
  };

  const receiver = {
    name: shipment.receiverName || shipment.receiver?.name || "N/A",
    address: shipment.receiverAddress || shipment.receiver?.address || "N/A",
    city: shipment.receiverCity || shipment.receiver?.city || "",
    state: shipment.receiverState || shipment.receiver?.state || "",
    pincode:
      shipment.receiverpincode ||
      shipment.receiverPincode ||
      shipment.receiver?.pincode ||
      "",
    phone:
      shipment.receiverPhoneNumber ||
      shipment.receiverPhone ||
      shipment.receiver?.phone ||
      "N/A",
    email: shipment.receiverEmail || shipment.receiver?.email || "N/A",
  };

  const pkg = {
    count:
      shipment.packageCount ?? shipment.count ?? shipment.package?.count ?? 1,
    weightKg:
      shipment.totalWeight ??
      shipment.weightKg ??
      shipment.package?.weightKg ??
      0,
    lengthCm:
      shipment.dimensions?.length ??
      shipment.lengthCm ??
      shipment.package?.lengthCm ??
      0,
    widthCm:
      shipment.dimensions?.width ??
      shipment.widthCm ??
      shipment.package?.widthCm ??
      0,
    heightCm:
      shipment.dimensions?.height ??
      shipment.heightCm ??
      shipment.package?.heightCm ??
      0,
    declaredValue:
      shipment.declaredValue ?? shipment.package?.declaredValue ?? 0,
    description:
      shipment.packageDescription ||
      shipment.description ||
      shipment.package?.description ||
      "General Cargo",
  };

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--xl">
        <div className="shp-modal__header">
          <div className="shp-details-head">
            <span className="shp-details-head__tracking">{trackingNo}</span>
            <span
              className={`shp-badge shp-badge--${getStatusTone(shipment.status)}`}
            >
              {normalizedStatus || shipment.status}
            </span>
            <span className="shp-badge shp-badge--outline">
              {shipment.priority || "Standard"} Priority
            </span>
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
            <button
              type="button"
              className="shp-modal__close"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="shp-modal__body">
          {/* Status Stepper visualization */}
          <div className="shp-stepper-card">
            <h4 className="shp-section-title">Shipment Lifecycle Workflow</h4>
            {normalizedStatus === "Failed Delivery" && (
              <div className="shp-alert shp-alert--danger">
                <strong>Delivery Attempt Failed:</strong>{" "}
                {shipment.events?.[shipment.events.length - 1]?.notes ||
                  "Delivery could not be completed."}
              </div>
            )}
            <div className="shp-stepper">
              {WORKFLOW_STEPS.map((step, idx) => {
                const isCompleted =
                  idx < currentStepIndex ||
                  (idx === currentStepIndex &&
                    normalizedStatus === "Delivered");
                const isCurrent =
                  idx === currentStepIndex && normalizedStatus !== "Delivered";

                return (
                  <div
                    key={step}
                    className={`shp-stepper__step ${
                      isCompleted ? "shp-stepper__step--completed" : ""
                    } ${isCurrent ? "shp-stepper__step--current" : ""}`}
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
                    <span className="shp-card__icon shp-card__icon--origin">
                      📍
                    </span>
                    <h5 className="shp-card__title">Pickup Origin (Sender)</h5>
                  </div>
                  <div className="shp-card__content">
                    <p className="shp-address-name">{sender.name}</p>
                    <p className="shp-address-text">{sender.address}</p>
                    <p className="shp-address-text">
                      {[sender.city, sender.state].filter(Boolean).join(", ")}
                      {sender.pincode ? ` - ${sender.pincode}` : ""}
                    </p>
                    <div className="shp-address-contact">
                      <span>📞 {sender.phone}</span>
                      <span>✉️ {sender.email}</span>
                    </div>
                  </div>
                </div>

                <div className="shp-card">
                  <div className="shp-card__header">
                    <span className="shp-card__icon shp-card__icon--dest">
                      🏁
                    </span>
                    <h5 className="shp-card__title">Destination (Receiver)</h5>
                  </div>
                  <div className="shp-card__content">
                    <p className="shp-address-name">{receiver.name}</p>
                    <p className="shp-address-text">{receiver.address}</p>
                    <p className="shp-address-text">
                      {[receiver.city, receiver.state]
                        .filter(Boolean)
                        .join(", ")}
                      {receiver.pincode ? ` - ${receiver.pincode}` : ""}
                    </p>
                    <div className="shp-address-contact">
                      <span>📞 {receiver.phone}</span>
                      <span>✉️ {receiver.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Package Specs */}
              <div className="shp-card">
                <h5 className="shp-card__title">
                  Package & Cargo Specifications
                </h5>
                <div className="shp-kv-grid">
                  <div className="shp-kv">
                    <span className="shp-kv__label">Package Count</span>
                    <span className="shp-kv__value">{pkg.count} units</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Total Weight</span>
                    <span className="shp-kv__value">{pkg.weightKg} kg</span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Dimensions (LxWxH)</span>
                    <span className="shp-kv__value">
                      {pkg.lengthCm} × {pkg.widthCm} × {pkg.heightCm} cm
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Declared Value</span>
                    <span className="shp-kv__value">
                      ₹
                      {pkg.declaredValue
                        ? Number(pkg.declaredValue).toLocaleString("en-IN")
                        : "N/A"}
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Customer Account</span>
                    <span className="shp-kv__value">{customer}</span>
                  </div>
                </div>
                <div className="shp-package-desc">
                  <strong>Description:</strong> {pkg.description}
                </div>
              </div>

              {/* Fleet & Trip Assignment */}
              <div className="shp-card">
                <h5 className="shp-card__title">Assigned Fleet & Trip</h5>
                <div className="shp-kv-grid">
                  <div className="shp-kv">
                    <span className="shp-kv__label">Assigned Driver</span>
                    <span className="shp-kv__value">
                      {shipment.driverName || "Unassigned"}
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Vehicle Reg. No.</span>
                    <span className="shp-kv__value">
                      {shipment.vehicleNo || "Unassigned"}
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Trip Manifest #</span>
                    <span className="shp-kv__value">
                      {shipment.tripNo || "No active trip"}
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Pickup Date</span>
                    <span className="shp-kv__value">
                      {formatDate(shipment.pickupDate)}
                    </span>
                  </div>
                  <div className="shp-kv">
                    <span className="shp-kv__label">Expected Delivery</span>
                    <span className="shp-kv__value">
                      {formatDate(shipment.expectedDeliveryDate)}
                    </span>
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
                {!shipment.documents || shipment.documents.length === 0 ? (
                  <p className="shp-text-muted">No documents uploaded yet.</p>
                ) : (
                  <ul className="shp-doc-list">
                    {shipment.documents.map((doc) => (
                      <li
                        key={doc.id || doc._id || doc.name}
                        className="shp-doc-item"
                      >
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
                          onClick={() =>
                            alert(`Downloading document ${doc.name}...`)
                          }
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
                {!shipment.events || shipment.events.length === 0 ? (
                  <p className="shp-text-muted">
                    Initial status:{" "}
                    <strong>{normalizedStatus || "Created"}</strong>
                  </p>
                ) : (
                  <ul className="shp-timeline">
                    {shipment.events.map((evt, idx) => (
                      <li
                        key={evt.id || evt._id || idx}
                        className="shp-timeline__item"
                      >
                        <div className="shp-timeline__marker" />
                        <div className="shp-timeline__content">
                          <div className="shp-timeline__head">
                            <span className="shp-timeline__status">
                              {evt.status}
                            </span>
                            <span className="shp-timeline__time">
                              {formatDate(evt.timestamp)}
                            </span>
                          </div>
                          <p className="shp-timeline__notes">{evt.notes}</p>
                          <span className="shp-timeline__meta">
                            📍 {evt.location} • By {evt.updatedBy}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. UPDATE STATUS MODAL
// ==========================================
function UpdateStatusModal({ shipment, onClose, onUpdateStatus }) {
  if (!shipment) return null;

  return (
    <UpdateStatusModalContent
      key={shipment._id || shipment.id}
      shipment={shipment}
      onClose={onClose}
      onUpdateStatus={onUpdateStatus}
    />
  );
}

function UpdateStatusModalContent({ shipment, onClose, onUpdateStatus }) {
  const [newStatus, setNewStatus] = useState(shipment.status || "created");
  const [location, setLocation] = useState(
    shipment.senderCity || shipment.sender?.city || "Central Hub",
  );
  const [notes, setNotes] = useState("");
  const [updatedBy, setUpdatedBy] = useState("Dispatcher");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsUpdating(true);

    const targetId = shipment._id || shipment.id || shipment.shipmentId;
    const result = await onUpdateStatus(targetId, newStatus);

    setIsUpdating(false);
    if (result?.success) {
      onClose();
    } else {
      setError(result?.message || "Failed to update status");
    }
  };

  const trackingNo =
    shipment.trackingId || shipment.shipmentId || shipment.trackingNo || "N/A";
  const currentStatusDisplay = (shipment.status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--sm">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">Update Shipment Status</h3>
            <p className="shp-modal__subtitle">Tracking #{trackingNo}</p>
          </div>
          <button
            type="button"
            className="shp-modal__close"
            onClick={onClose}
            disabled={isUpdating}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shp-modal__form">
          {error && (
            <div
              className="shp-alert shp-alert--danger"
              style={{ marginBottom: "16px" }}
            >
              {error}
            </div>
          )}

          <div className="shp-form-group">
            <label>Current Status</label>
            <div className="shp-badge shp-badge--outline">
              {currentStatusDisplay || shipment.status}
            </div>
          </div>

          <div className="shp-form-group">
            <label>New Status Transition</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              disabled={isUpdating}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
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
              disabled={isUpdating}
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
              disabled={isUpdating}
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
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="shp-btn shp-btn--primary"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : "Save Status Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 5. BULK IMPORT MODAL
// ==========================================
function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

function parseCsvDate(str) {
  if (!str) return new Date().toISOString();
  const trimmed = String(str).trim().replace(/^"|"$/g, "");
  if (!trimmed) return new Date().toISOString();

  // Match D/M/YYYY or DD/MM/YYYY with optional time like "23/9/2026, 6:00:00 pm" or "8/9/2026, 3:30:00 am"
  const dmyMatch = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s*(am|pm)?)?/i,
  );
  if (dmyMatch) {
    let day = parseInt(dmyMatch[1], 10);
    let month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    let hours = dmyMatch[4] ? parseInt(dmyMatch[4], 10) : 0;
    const minutes = dmyMatch[5] ? parseInt(dmyMatch[5], 10) : 0;
    const seconds = dmyMatch[6] ? parseInt(dmyMatch[6], 10) : 0;
    const ampm = dmyMatch[7]?.toLowerCase();

    if (month > 11 && day <= 12) {
      const temp = day;
      day = month + 1;
      month = temp - 1;
    }

    if (ampm === "pm" && hours < 12) hours += 12;
    if (ampm === "am" && hours === 12) hours = 0;

    const parsed = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  const direct = new Date(trimmed);
  if (!isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  return new Date().toISOString();
}

function BulkImportModal({ isOpen, onClose, onImport }) {
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
  });
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      encodeURIComponent(
        `Customer Name / Customer ID,Priority,Package Description,Package Count,Total Weight (kg),Length (cm),Width (cm),Height (cm),Sender Name,Sender Phone,Sender Email,Sender Address,Sender City,Sender State,Sender Pincode,Receiver Name,Receiver Phone,Receiver Email,Receiver Address,Receiver City,Receiver State,Receiver Pincode,Driver Name,Vehicle No,Trip Manifest No,Pickup Date,Expected Delivery Date\n` +
          `Abhishek,Same Day,Industrial Router Units & Accessories,5,45.5,50,40,30,Apex Distribution Hub,98765 12345,dispatch@apexretail.com,"Plot 12, Industrial Area, Chakan",Pune,Maharashtra,410501,Metro Supply Chains,+91 91234 98765,receiving@metrosupply.in,"55 Cargo Logistics Park, Guindy",Chennai,Tamil Nadu,600032,Unassigned,Unassigned,,"8/9/2026, 3:30:00 am","10/9/2026, 12:30:00 pm"\n` +
          `Abhishek,Standard,Industrial Router Units & Accessories,5,45.5,50,40,30,Apex Distribution Hub,98765 12345,dispatch@apexretail.com,"Plot 12, Industrial Area, Chakan",Pune,Maharashtra,410501,Metro Supply Chains,+91 91234 98765,receiving@metrosupply.in,"55 Cargo Logistics Park, Guindy",Chennai,Tamil Nadu,600032,R. Mehta,MH-12-AB-4521,TRP-1092,"8/9/2026, 9:00:00 am","10/9/2026, 6:00:00 pm"\n` +
          `Abhishek,Express,Updated Server Electronics,8,52.5,50,40,30,Abhishek Updated Hub,1111111111,abhishekmevada85@gmail.com,"Plot 12, Industrial Area, Chakan",Pune,Maharashtra,410501,Metro Supply Chains,+91 91234 98765,receiving@metrosupply.in,"55 Cargo Logistics Park, Guindy",Chennai,Tamil Nadu,600032,Unassigned,Unassigned,,"8/9/2026, 9:00:00 am","23/9/2026, 6:00:00 pm"`,
      );

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "shipments_bulk_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setImportError(null);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (!text) {
        setIsParsing(false);
        return;
      }

      const lines = text
        .split(/\r\n|\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length < 2) {
        setImportError(
          "CSV file must contain a header row and at least one shipment record.",
        );
        setIsParsing(false);
        return;
      }

      const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

      const getColIndex = (aliases, fallbackIdx) => {
        for (const alias of aliases) {
          const idx = headers.findIndex((h) => h.includes(alias));
          if (idx !== -1) return idx;
        }
        return fallbackIdx;
      };

      const idxCustomer = getColIndex(
        ["customer name", "customer id", "customer"],
        0,
      );
      const idxPriority = getColIndex(["priority"], 1);
      const idxDesc = getColIndex(["package description", "description"], 2);
      const idxCount = getColIndex(["package count", "count"], 3);
      const idxWeight = getColIndex(["weight", "weight (kg)"], 4);
      const idxLength = getColIndex(["length"], 5);
      const idxWidth = getColIndex(["width"], 6);
      const idxHeight = getColIndex(["height"], 7);
      const idxSenderName = getColIndex(["sender name"], 8);
      const idxSenderPhone = getColIndex(["sender phone"], 9);
      const idxSenderEmail = getColIndex(["sender email"], 10);
      const idxSenderAddr = getColIndex(
        ["sender address", "pickup address"],
        11,
      );
      const idxSenderCity = getColIndex(["sender city", "pickup city"], 12);
      const idxSenderState = getColIndex(["sender state"], 13);
      const idxSenderPin = getColIndex(["sender pincode", "sender zip"], 14);
      const idxReceiverName = getColIndex(["receiver name"], 15);
      const idxReceiverPhone = getColIndex(["receiver phone"], 16);
      const idxReceiverEmail = getColIndex(["receiver email"], 17);
      const idxReceiverAddr = getColIndex(
        ["receiver address", "delivery address"],
        18,
      );
      const idxReceiverCity = getColIndex(
        ["receiver city", "delivery city"],
        19,
      );
      const idxReceiverState = getColIndex(["receiver state"], 20);
      const idxReceiverPin = getColIndex(
        ["receiver pincode", "receiver zip"],
        21,
      );
      const idxDriverName = getColIndex(["driver name", "driver"], 22);
      const idxVehicleNo = getColIndex(["vehicle no", "vehicle"], 23);
      const idxTripNo = getColIndex(
        ["trip manifest no", "trip no", "trip"],
        24,
      );
      const idxPickupDate = getColIndex(["pickup date"], 25);
      const idxDeliveryDate = getColIndex(
        ["expected delivery date", "delivery date"],
        26,
      );

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCsvLine(lines[i]);
        if (cols.length < 5) continue;

        const customerId = cols[idxCustomer] || "";
        const priority = cols[idxPriority] || "Standard";
        const description = cols[idxDesc] || "Industrial Shipment";
        const count = parseInt(cols[idxCount], 10) || 1;
        const weightKg = parseFloat(cols[idxWeight]) || 1.0;
        const lengthCm = parseFloat(cols[idxLength]) || 10;
        const widthCm = parseFloat(cols[idxWidth]) || 10;
        const heightCm = parseFloat(cols[idxHeight]) || 10;

        const senderName = cols[idxSenderName] || "Origin Warehouse";
        const senderPhoneNumber = cols[idxSenderPhone] || "+91 00000 00000";
        const senderEmail = cols[idxSenderEmail] || "";
        const senderAddress = cols[idxSenderAddr] || "Warehouse Address";
        const senderCity = cols[idxSenderCity] || "";
        const senderState = cols[idxSenderState] || "";
        const senderPincode = cols[idxSenderPin] || "";

        const receiverName = cols[idxReceiverName] || "Destination Hub";
        const receiverPhoneNumber = cols[idxReceiverPhone] || "+91 00000 00000";
        const receiverEmail = cols[idxReceiverEmail] || "";
        const receiverAddress = cols[idxReceiverAddr] || "Delivery Address";
        const receiverCity = cols[idxReceiverCity] || "";
        const receiverState = cols[idxReceiverState] || "";
        const receiverPincode = cols[idxReceiverPin] || "";

        let driverName = cols[idxDriverName] || "";
        if (driverName.toLowerCase() === "unassigned") driverName = "";
        let vehicleNo = cols[idxVehicleNo] || "";
        if (vehicleNo.toLowerCase() === "unassigned") vehicleNo = "";
        const tripNo = cols[idxTripNo] || "";

        const pickupDate = parseCsvDate(cols[idxPickupDate]);
        const expectedDeliveryDate = parseCsvDate(cols[idxDeliveryDate]);

        rows.push({
          rowNumber: i,
          customerId,
          priority,
          description,
          count,
          weightKg,
          lengthCm,
          widthCm,
          heightCm,
          senderName,
          senderPhoneNumber,
          senderEmail,
          senderAddress,
          senderCity,
          senderState,
          senderPincode,
          receiverName,
          receiverPhoneNumber,
          receiverEmail,
          receiverAddress,
          receiverCity,
          receiverState,
          receiverPincode,
          driverName,
          vehicleNo,
          tripNo,
          pickupDate,
          expectedDeliveryDate,
        });
      }

      setParsedRows(rows);
      setIsParsing(false);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0 || isImporting) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: parsedRows.length });
    setImportError(null);
    setImportSummary(null);

    const token = localStorage.getItem("token");
    const createdShipments = [];
    const failedRows = [];

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      setImportProgress({ current: i + 1, total: parsedRows.length });

      const payload = {
        customerId: row.customerId,
        priority: row.priority,
        description: row.description,
        count: row.count,
        weightKg: row.weightKg,
        lengthCm: row.lengthCm,
        widthCm: row.widthCm,
        heightCm: row.heightCm,
        senderName: row.senderName,
        senderPhoneNumber: row.senderPhoneNumber,
        senderEmail: row.senderEmail,
        senderAddress: row.senderAddress,
        senderCity: row.senderCity,
        senderState: row.senderState,
        senderPincode: row.senderPincode,
        receiverName: row.receiverName,
        receiverPhoneNumber: row.receiverPhoneNumber,
        receiverEmail: row.receiverEmail,
        receiverAddress: row.receiverAddress,
        receiverCity: row.receiverCity,
        receiverState: row.receiverState,
        receiverPincode: row.receiverPincode,
        driverName: row.driverName,
        vehicleNo: row.vehicleNo,
        tripNo: row.tripNo,
        pickupDate: row.pickupDate,
        expectedDeliveryDate: row.expectedDeliveryDate,
      };

      try {
        const res = await fetch(`${API_BASE_URL}/createshipment`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (res.ok && data.shipment) {
          createdShipments.push(data.shipment);
        } else {
          failedRows.push({
            rowNumber: row.rowNumber,
            customer: row.customerId,
            reason: data.message || `Server error (status ${res.status})`,
          });
        }
      } catch (err) {
        failedRows.push({
          rowNumber: row.rowNumber,
          customer: row.customerId,
          reason: err.message || "Network request failed",
        });
      }
    }

    setIsImporting(false);
    setImportSummary({
      total: parsedRows.length,
      successCount: createdShipments.length,
      failedRows,
    });

    if (createdShipments.length > 0 && onImport) {
      onImport(createdShipments);
    }
  };

  return (
    <div className="shp-modal-overlay">
      <div className="shp-modal shp-modal--xl">
        <div className="shp-modal__header">
          <div>
            <h3 className="shp-modal__title">
              Bulk Import Shipments via CSV / Excel
            </h3>
            <p className="shp-modal__subtitle">
              Upload a <code>.csv</code> file matching standard 27 columns to
              generate multiple shipment manifests directly in the backend.
            </p>
          </div>
          <button
            type="button"
            className="shp-modal__close"
            onClick={onClose}
            disabled={isImporting}
          >
            ✕
          </button>
        </div>

        <div className="shp-modal__body">
          {importError && (
            <div
              className="shp-alert shp-alert--danger"
              style={{ marginBottom: "16px" }}
            >
              {importError}
            </div>
          )}

          {isImporting && (
            <div
              className="shp-alert shp-alert--info"
              style={{ marginBottom: "16px" }}
            >
              ⏳ Importing shipment {importProgress.current} of{" "}
              {importProgress.total} via <code>/createshipment</code>... Please
              wait.
            </div>
          )}

          {importSummary && (
            <div style={{ marginBottom: "16px" }}>
              <div
                className={`shp-alert ${
                  importSummary.successCount === importSummary.total
                    ? "shp-alert--success"
                    : "shp-alert--warning"
                }`}
              >
                ✅ Successfully created {importSummary.successCount} of{" "}
                {importSummary.total} shipments in the backend database.
              </div>
              {importSummary.failedRows.length > 0 && (
                <div
                  className="shp-alert shp-alert--danger"
                  style={{ marginTop: "8px" }}
                >
                  <p style={{ fontWeight: "bold", marginBottom: "4px" }}>
                    ⚠️ {importSummary.failedRows.length} shipments could not be
                    created:
                  </p>
                  <ul style={{ paddingLeft: "20px", fontSize: "12px" }}>
                    {importSummary.failedRows.map((f, idx) => (
                      <li key={idx}>
                        Row {f.rowNumber} ({f.customer || "No Customer"}):{" "}
                        {f.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="shp-import-dropzone">
            <div className="shp-import-dropzone__icon">📂</div>
            <p className="shp-import-dropzone__text">
              Select or Drag & Drop your <strong>Shipments CSV file</strong>{" "}
              here
            </p>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="shp-file-input"
              disabled={isImporting}
            />
            {fileName && (
              <span className="shp-file-badge">Loaded: {fileName}</span>
            )}
          </div>

          <div
            className="shp-import-actions"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <button
              type="button"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              onClick={handleDownloadTemplate}
              disabled={isImporting}
            >
              📥 Download Sample CSV Template
            </button>
            <span style={{ fontSize: "11px", color: "#6b7280" }}>
              Expected: Customer, Priority, Package Description, Count, Weight,
              Dimensions, Sender & Receiver info, Dates
            </span>
          </div>

          {isParsing && <p className="shp-text-muted">Parsing CSV data...</p>}

          {parsedRows.length > 0 && (
            <div className="shp-import-preview">
              <h5 className="shp-section-title">
                Parsed Pre-Import Preview ({parsedRows.length} Shipments)
              </h5>
              <div
                className="shp-table-wrap shp-table-wrap--sm"
                style={{ maxHeight: "280px", overflowY: "auto" }}
              >
                <table className="shp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Customer</th>
                      <th>Priority</th>
                      <th>Cargo Description</th>
                      <th>Count & Weight</th>
                      <th>Sender Hub</th>
                      <th>Receiver Hub</th>
                      <th>Pickup Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td style={{ fontWeight: 600 }}>{row.customerId}</td>
                        <td>
                          <span
                            className={`shp-badge shp-badge--${
                              row.priority === "Same Day"
                                ? "danger"
                                : row.priority === "Express"
                                  ? "warning"
                                  : "info"
                            }`}
                          >
                            {row.priority}
                          </span>
                        </td>
                        <td>{row.description}</td>
                        <td>
                          {row.count} pkgs / {row.weightKg} kg
                        </td>
                        <td>
                          {row.senderName}{" "}
                          {row.senderCity && `(${row.senderCity})`}
                        </td>
                        <td>
                          {row.receiverName}{" "}
                          {row.receiverCity && `(${row.receiverCity})`}
                        </td>
                        <td>
                          {row.pickupDate
                            ? new Date(row.pickupDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="shp-modal__footer">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={onClose}
            disabled={isImporting}
          >
            {importSummary ? "Close" : "Cancel"}
          </button>
          <button
            type="button"
            className="shp-btn shp-btn--primary"
            disabled={parsedRows.length === 0 || isImporting}
            onClick={handleConfirmImport}
          >
            {isImporting
              ? `Importing (${importProgress.current}/${importProgress.total})...`
              : `Confirm & Import ${parsedRows.length} Shipments to Backend`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. MAIN DASHBOARD SHIPMENT COMPONENT
// ==========================================
export default function DashboardShipment({ searchTerm: externalSearch = "" }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const token = localStorage.getItem("token");
  const navi = useNavigate();

  useEffect(() => {
    if (!token) {
      navi("/login");
    }
  }, [token, navi]);

  // ── Fetch all shipments from backend ──────────────────────────────────────
  const fetchShipments = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/shipments?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.message || "Failed to load shipments");
      } else {
        setShipments(data.shipments || []);
      }
    } catch {
      setFetchError("Network error — could not reach backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchShipments(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filters & State
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState(externalSearch);
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Active Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [selectedUpdateStatus, setSelectedUpdateStatus] = useState(null);
  const [selectedEdit, setSelectedEdit] = useState(null);

  // Sync external search from topbar if changed
  const [prevExternalSearch, setPrevExternalSearch] = useState(externalSearch);
  if (externalSearch !== prevExternalSearch) {
    setPrevExternalSearch(externalSearch);
    setSearchQuery(externalSearch);
  }

  // ── Backend status values (snake_case) ────────────────────────────────────
  const PENDING_STATUSES = ["created", "pickup_scheduled"];
  const TRANSIT_STATUSES = [
    "picked_up",
    "at_warehouse",
    "dispatched",
    "in_transit",
  ];
  const DELIVERY_STATUSES = ["out_for_delivery"];
  const DELIVERED_STATUSES = ["delivered"];
  const FAILED_STATUSES = ["failed_delivery"];

  // Handlers
  const handleCreateShipment = (newShipment) => {
    setShipments((prev) => [newShipment, ...prev]);
  };

  const handleImportShipments = (imported) => {
    setShipments((prev) => [...imported, ...prev]);
    fetchShipments();
  };

  const handleUpdateStatus = async (shipmentId, newStatus) => {
    try {
      const res = await fetch(
        `http://localhost:5000/shipments/${shipmentId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || "Failed to update shipment status",
        };
      }

      const updatedShipment = data.shipment;

      setShipments((prev) =>
        prev.map((shp) => {
          if (
            shp._id === shipmentId ||
            shp.id === shipmentId ||
            shp.shipmentId === shipmentId
          ) {
            return {
              ...shp,
              ...(updatedShipment || {}),
              status: updatedShipment?.status || newStatus,
            };
          }
          return shp;
        }),
      );

      setSelectedDetails((prev) => {
        if (!prev) return null;
        if (
          prev._id === shipmentId ||
          prev.id === shipmentId ||
          prev.shipmentId === shipmentId
        ) {
          return {
            ...prev,
            ...(updatedShipment || {}),
            status: updatedShipment?.status || newStatus,
          };
        }
        return prev;
      });

      return { success: true };
    } catch (err) {
      console.error("Update status error:", err);
      return {
        success: false,
        message: "Network error: Could not reach backend",
      };
    }
  };

  const handleSaveEdit = async (shipmentId, updatedData) => {
    try {
      const res = await fetch(`http://localhost:5000/shipments/${shipmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          success: false,
          message: data.message || "Failed to update shipment",
        };
      }

      const updatedShipment = data.shipment;

      setShipments((prev) =>
        prev.map((s) => {
          if (
            s._id === shipmentId ||
            s.id === shipmentId ||
            s.shipmentId === shipmentId
          ) {
            return { ...s, ...(updatedShipment || updatedData) };
          }
          return s;
        }),
      );

      setSelectedDetails((prev) => {
        if (!prev) return null;
        if (
          prev._id === shipmentId ||
          prev.id === shipmentId ||
          prev.shipmentId === shipmentId
        ) {
          return { ...prev, ...(updatedShipment || updatedData) };
        }
        return prev;
      });

      return { success: true };
    } catch (err) {
      console.error("Save edit error:", err);
      return {
        success: false,
        message: "Network error: Could not reach backend",
      };
    }
  };

  const handleDeleteShipment = (id, trackingId) => {
    if (window.confirm(`Delete shipment ${trackingId}?`)) {
      setShipments((prev) => prev.filter((s) => s._id !== id && s.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (shipments.length === 0) return;

    const headers = [
      "Shipment ID",
      "Tracking ID",
      "Customer Name",
      "Customer Email",
      "Status",
      "Priority",
      "Package Description",
      "Package Count",
      "Total Weight (kg)",
      "Length (cm)",
      "Width (cm)",
      "Height (cm)",
      "Sender Name",
      "Sender Phone",
      "Sender Email",
      "Sender Address",
      "Sender City",
      "Sender State",
      "Sender Pincode",
      "Receiver Name",
      "Receiver Phone",
      "Receiver Email",
      "Receiver Address",
      "Receiver City",
      "Receiver State",
      "Receiver Pincode",
      "Driver Name",
      "Vehicle No",
      "Trip Manifest No",
      "Pickup Date",
      "Expected Delivery Date",
      "Created Date",
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = shipments.map((s) => [
      escapeCSV(s.shipmentId || ""),
      escapeCSV(s.trackingId || ""),
      escapeCSV(s.customerId?.name || s.customerName || ""),
      escapeCSV(s.customerId?.email || ""),
      escapeCSV(s.status || ""),
      escapeCSV(s.priority || "Standard"),
      escapeCSV(s.packageDescription || s.description || ""),
      s.packageCount ?? s.count ?? 1,
      s.totalWeight ?? s.weightKg ?? 0,
      s.dimensions?.length ?? s.lengthCm ?? 0,
      s.dimensions?.width ?? s.widthCm ?? 0,
      s.dimensions?.height ?? s.heightCm ?? 0,
      escapeCSV(s.senderName || s.sender?.name || ""),
      escapeCSV(s.senderPhoneNumber || s.senderPhone || ""),
      escapeCSV(s.senderEmail || s.sender?.email || ""),
      escapeCSV(s.senderAddress || s.pickupAddress || ""),
      escapeCSV(s.senderCity || ""),
      escapeCSV(s.senderState || ""),
      escapeCSV(s.senderpincode ?? s.senderPincode ?? ""),
      escapeCSV(s.receiverName || s.receiver?.name || ""),
      escapeCSV(s.receiverPhoneNumber || s.receiverPhone || ""),
      escapeCSV(s.receiverEmail || s.receiver?.email || ""),
      escapeCSV(s.receiverAddress || s.deliveryAddress || ""),
      escapeCSV(s.receiverCity || ""),
      escapeCSV(s.receiverState || ""),
      escapeCSV(s.receiverpincode ?? s.receiverPincode ?? ""),
      escapeCSV(s.driverName || "Unassigned"),
      escapeCSV(s.vehicleNo || "Unassigned"),
      escapeCSV(s.tripNo || ""),
      escapeCSV(
        s.pickupDate ? new Date(s.pickupDate).toLocaleString("en-IN") : "",
      ),
      escapeCSV(
        s.expectedDeliveryDate
          ? new Date(s.expectedDeliveryDate).toLocaleString("en-IN")
          : "",
      ),
      escapeCSV(
        s.createdAt ? new Date(s.createdAt).toLocaleString("en-IN") : "",
      ),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `shipments_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ── KPI Calculations ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = shipments.length;
    const pending = shipments.filter((s) =>
      PENDING_STATUSES.includes(s.status),
    ).length;
    const inTransit = shipments.filter((s) =>
      TRANSIT_STATUSES.includes(s.status),
    ).length;
    const outForDel = shipments.filter((s) =>
      DELIVERY_STATUSES.includes(s.status),
    ).length;
    const delivered = shipments.filter((s) =>
      DELIVERED_STATUSES.includes(s.status),
    ).length;
    const failed = shipments.filter((s) =>
      FAILED_STATUSES.includes(s.status),
    ).length;
    return { total, pending, inTransit, outForDel, delivered, failed };
  }, [shipments]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Filtering & Sorting ───────────────────────────────────────────────────
  const filteredShipments = useMemo(() => {
    return shipments
      .filter((s) => {
        if (activeTab === "Pending" && !PENDING_STATUSES.includes(s.status))
          return false;
        if (activeTab === "In Transit" && !TRANSIT_STATUSES.includes(s.status))
          return false;
        if (
          activeTab === "Out for Delivery" &&
          !DELIVERY_STATUSES.includes(s.status)
        )
          return false;
        if (activeTab === "Delivered" && !DELIVERED_STATUSES.includes(s.status))
          return false;
        if (
          activeTab === "Failed Delivery" &&
          !FAILED_STATUSES.includes(s.status)
        )
          return false;

        if (priorityFilter !== "All" && s.priority !== priorityFilter)
          return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          if (
            !(s.trackingId || "").toLowerCase().includes(q) &&
            !(s.shipmentId || "").toLowerCase().includes(q) &&
            !(s.senderName || "").toLowerCase().includes(q) &&
            !(s.senderCity || "").toLowerCase().includes(q) &&
            !(s.receiverName || "").toLowerCase().includes(q) &&
            !(s.receiverCity || "").toLowerCase().includes(q) &&
            !(s.driverName || "").toLowerCase().includes(q) &&
            !(s.vehicleNo || "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest")
          return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === "expectedDate")
          return (
            new Date(a.expectedDeliveryDate) - new Date(b.expectedDeliveryDate)
          );
        if (sortBy === "weight")
          return (b.totalWeight || 0) - (a.totalWeight || 0);
        return 0;
      });
  }, [shipments, activeTab, priorityFilter, searchQuery, sortBy]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Pagination Calculations ───────────────────────────────────────────────
  const filterKey = `${activeTab}|${priorityFilter}|${searchQuery}|${sortBy}|${pageSize}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredShipments.length);
  const displayedShipments = useMemo(() => {
    return filteredShipments.slice(startIndex, endIndex);
  }, [filteredShipments, startIndex, endIndex]);

  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, "...", total];
    }
    if (current >= total - 3) {
      return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "...", current - 1, current, current + 1, "...", total];
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getStatusTone = (status) => {
    if (status === "delivered") return "success";
    if (status === "failed_delivery") return "danger";
    if (["in_transit", "out_for_delivery", "dispatched"].includes(status))
      return "info";
    return "warning";
  };

  const formatStatus = (status) =>
    (status || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const formatDate = (isoString) => {
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
            Track, dispatch, manage manifests and update real-time status across
            the logistics network.
          </p>
        </div>
        <div className="shp-header__actions">
          <button
            type="button"
            className="shp-btn shp-btn--ghost"
            onClick={fetchShipments}
            title="Refresh"
          >
            🔄 Refresh
          </button>
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
            <span className="shp-kpi-card__icon shp-kpi-card__icon--warning">
              ⏳
            </span>
            <span className="shp-kpi-card__title">Pending / Scheduled</span>
          </div>
          <div className="shp-kpi-card__value">{stats.pending}</div>
          <div className="shp-kpi-card__foot">Awaiting pickup/dispatch</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--info">
              🚚
            </span>
            <span className="shp-kpi-card__title">In Transit & Delivery</span>
          </div>
          <div className="shp-kpi-card__value">
            {stats.inTransit + stats.outForDel}
          </div>
          <div className="shp-kpi-card__foot">Active on road/depot</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--success">
              ✅
            </span>
            <span className="shp-kpi-card__title">Delivered</span>
          </div>
          <div className="shp-kpi-card__value">{stats.delivered}</div>
          <div className="shp-kpi-card__foot">Completed with POD</div>
        </div>

        <div className="shp-kpi-card">
          <div className="shp-kpi-card__head">
            <span className="shp-kpi-card__icon shp-kpi-card__icon--danger">
              ⚠️
            </span>
            <span className="shp-kpi-card__title">Failed Delivery</span>
          </div>
          <div className="shp-kpi-card__value">{stats.failed}</div>
          <div className="shp-kpi-card__foot">Action required</div>
        </div>
      </div>

      {/* Filter & Control Bar */}
      <div className="shp-control-bar">
        <div className="shp-tabs">
          {[
            { key: "All", label: "All Shipments", count: stats.total },
            { key: "Pending", label: "Pending", count: stats.pending },
            { key: "In Transit", label: "In Transit", count: stats.inTransit },
            {
              key: "Out for Delivery",
              label: "Out for Delivery",
              count: stats.outForDel,
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

        <div className="shp-filters-right">
          <div className="shp-search-box">
            <span className="shp-search-icon">🔍</span>
            <input
              type="search"
              placeholder="Search tracking, sender, city..."
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
        {/* Loading state */}
        {loading && (
          <div className="shp-empty-state">
            <p className="shp-empty-state__title">Loading shipments...</p>
          </div>
        )}

        {/* Error state */}
        {!loading && fetchError && (
          <div
            className="shp-alert shp-alert--danger"
            style={{ margin: "16px" }}
          >
            <strong>Error:</strong> {fetchError} —{" "}
            <button
              type="button"
              className="shp-btn shp-btn--ghost shp-btn--sm"
              onClick={fetchShipments}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !fetchError && filteredShipments.length === 0 && (
          <div className="shp-empty-state">
            <p className="shp-empty-state__title">No shipments found</p>
            <p className="shp-empty-state__text">
              Try adjusting your filter criteria or create a new shipment
              record.
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !fetchError && filteredShipments.length > 0 && (
          <div className="shp-table-wrap">
            <table className="shp-table">
              <thead>
                <tr>
                  <th>Tracking #</th>
                  <th>Customer</th>
                  <th>Origin → Destination</th>
                  <th>Specs (Weight / Qty)</th>
                  <th>Driver / Fleet</th>
                  <th>Delivery Window</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedShipments.map((shp) => (
                  <tr key={shp._id || shp.id} className="shp-table__row">
                    {/* Tracking # + Priority */}
                    <td>
                      <button
                        type="button"
                        className="shp-tracking-link"
                        onClick={() => setSelectedDetails(shp)}
                      >
                        {shp.trackingId || shp.shipmentId || "—"}
                      </button>
                      <span className="shp-priority-pill">{shp.priority}</span>
                    </td>

                    {/* Customer */}
                    <td>
                      <p className="shp-cell-title">
                        {shp.customerId?.name || shp.customerName || "—"}
                      </p>
                      <span className="shp-cell-sub">{shp.shipmentId}</span>
                    </td>

                    {/* Origin → Destination */}
                    <td>
                      <div className="shp-route-flow">
                        <span className="shp-route-city">
                          {shp.senderCity || shp.senderAddress || "—"}
                        </span>
                        <span className="shp-route-arrow">➔</span>
                        <span className="shp-route-city">
                          {shp.receiverCity || shp.receiverAddress || "—"}
                        </span>
                      </div>
                      <span className="shp-cell-sub">
                        {shp.senderName} → {shp.receiverName}
                      </span>
                    </td>

                    {/* Package specs */}
                    <td>
                      <p className="shp-cell-title">{shp.totalWeight} kg</p>
                      <span className="shp-cell-sub">
                        {shp.packageCount} pkg •{" "}
                        {shp.dimensions
                          ? `${shp.dimensions.length}×${shp.dimensions.width}×${shp.dimensions.height} cm`
                          : ""}
                      </span>
                    </td>

                    {/* Driver / Vehicle */}
                    <td>
                      {shp.driverName ? (
                        <>
                          <p className="shp-cell-title">{shp.driverName}</p>
                          <span className="shp-cell-sub">
                            {shp.vehicleNo || "No vehicle"}
                          </span>
                        </>
                      ) : (
                        <span className="shp-text-muted">Unassigned</span>
                      )}
                    </td>

                    {/* Dates */}
                    <td>
                      <p className="shp-cell-title">
                        {formatDate(shp.expectedDeliveryDate)}
                      </p>
                      <span className="shp-cell-sub">
                        Pickup: {formatDate(shp.pickupDate)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td>
                      <span
                        className={`shp-badge shp-badge--${getStatusTone(shp.status)}`}
                      >
                        {formatStatus(shp.status)}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td style={{ textAlign: "right" }}>
                      <div className="shp-action-btns">
                        <button
                          type="button"
                          className="shp-icon-btn"
                          title="View Details"
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
                          title="Edit"
                          onClick={() => setSelectedEdit(shp)}
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          className="shp-icon-btn shp-icon-btn--danger"
                          title="Delete"
                          onClick={() =>
                            handleDeleteShipment(
                              shp._id || shp.id,
                              shp.trackingId || shp.shipmentId,
                            )
                          }
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
          <div className="shp-pagination-info">
            {filteredShipments.length === 0 ? (
              <span>No shipments to display</span>
            ) : (
              <span>
                Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of{" "}
                <strong>{filteredShipments.length}</strong> shipments
                {filteredShipments.length !== shipments.length && (
                  <span className="shp-pagination-total-hint">
                    {" "}(filtered from {shipments.length} total)
                  </span>
                )}
              </span>
            )}
          </div>

          {filteredShipments.length > 0 && (
            <div className="shp-pagination-controls">
              <div className="shp-pagination-size">
                <label htmlFor="shp-page-size-select">Rows per page:</label>
                <select
                  id="shp-page-size-select"
                  className="shp-pagination-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="shp-pagination-nav">
                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="First Page"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage(1)}
                >
                  «
                </button>
                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="Previous Page"
                  disabled={safeCurrentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                >
                  ‹ Prev
                </button>

                <div className="shp-pagination-pages">
                  {getPageNumbers(safeCurrentPage, totalPages).map((pageNum, idx) =>
                    pageNum === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="shp-pagination-ellipsis"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={`page-${pageNum}`}
                        type="button"
                        className={`shp-pagination-btn ${
                          safeCurrentPage === pageNum
                            ? "shp-pagination-btn--active"
                            : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="Next Page"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                >
                  Next ›
                </button>
                <button
                  type="button"
                  className="shp-pagination-btn"
                  title="Last Page"
                  disabled={safeCurrentPage === totalPages}
                  onClick={() => setCurrentPage(totalPages)}
                >
                  »
                </button>
              </div>
            </div>
          )}
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
}

// Named exports for flexibility
export {
  DashboardShipment,
  DashboardShipment as ShipmentManagement,
  CreateShipmentModal,
  EditShipmentModal,
  ShipmentDetailsModal,
  UpdateStatusModal,
  BulkImportModal,
};
