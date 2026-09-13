const mongosse = require("mongoose");

const connectDb = async () => {
  try {
    await mongosse.connect("mongodb://localhost:27017/logisticmanagement");
    console.log("db connect");
  } catch (error) {
    console.log(error.message);
  }
};

connectDb();

const userSchema = mongosse.Schema({
  name: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true,
    enum: [
      "Admin",
      "Logistics Manager",
      "Dispatcher",
      "Warehouse Manager",
      "Driver",
      // "customer",
    ],
    default: "customer",
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
    default: "active",
  },
  resetOtpHash: { type: String, default: null },
  resetOtpExpiresAt: { type: Date, default: null },
  resetOtpVerified: { type: Boolean, default: false },
});

const User = mongosse.model("user", userSchema);

const customerSchema = mongosse.Schema({
  // userId: { type: mongosse.Schema.Types.ObjectId, ref: "user", required: true },
  customerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phonenumber: { type: Number, required: true },
  address: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["active", "inactive"],
    default: "active",
  },
});

const Customer = mongosse.model("customer", customerSchema);

const shipmentSchema = new mongosse.Schema(
  {
    shipmentId: {
      type: String,
      required: true,
      unique: true,
    },

    trackingId: {
      type: String,
      required: true,
      unique: true,
    },

    customerId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "customer",
      required: true,
    },

    // ── Sender ──────────────────────────────────────────────────────────────
    senderName: { type: String, required: true, trim: true },
    senderPhoneNumber: { type: String, required: true, trim: true },
    senderEmail: { type: String, default: "", trim: true },
    senderAddress: { type: String, required: true, trim: true },
    senderCity: { type: String, default: "", trim: true },
    senderState: { type: String, default: "", trim: true },
    senderpincode: { type: Number, default: 0 },

    // ── Receiver ────────────────────────────────────────────────────────────
    receiverName: { type: String, required: true, trim: true },
    receiverPhoneNumber: { type: String, required: true, trim: true },
    receiverEmail: { type: String, default: "", trim: true },
    receiverAddress: { type: String, required: true, trim: true },
    receiverCity: { type: String, default: "", trim: true },
    receiverState: { type: String, default: "", trim: true },
    receiverpincode: { type: Number, default: 0 },

    // ── Package ─────────────────────────────────────────────────────────────

    packageCount: { type: Number, required: true, min: 1 },
    totalWeight: { type: Number, required: true, min: 0 },
    dimensions: {
      length: { type: Number, required: true, min: 0 },
      width: { type: Number, required: true, min: 0 },
      height: { type: Number, required: true, min: 0 },
    },
    packageDescription: { type: String, required: true, trim: true },

    // ── Dates ────────────────────────────────────────────────────────────────
    pickupDate: { type: Date, required: true },
    expectedDeliveryDate: { type: Date, required: true },

    // ── Status & Priority ────────────────────────────────────────────────────
    status: {
      type: String,
      required: true,
      enum: [
        "created",
        "pickup_scheduled",
        "picked_up",
        "at_warehouse",
        "dispatched",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "failed_delivery",
      ],
      default: "created",
    },
    priority: {
      type: String,
      required: true,
      enum: ["Standard", "Express", "Same Day", "Overnight"],
      default: "Standard",
    },
    driverName: { type: String, default: "", trim: true },
    vehicleNo: { type: String, default: "", trim: true },
    tripNo: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  },
);

const Shipment = mongosse.model("shipments", shipmentSchema);

module.exports = { User, Customer, Shipment };
