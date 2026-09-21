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
    driverName: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "driver",
      required: true,
    },
    vehicleNo: { type: String, default: "", trim: true },
    tripNo: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  },
);

const Shipment = mongosse.model("shipments", shipmentSchema);

const driverSchema = mongosse.Schema({
  userId: { type: mongosse.Schema.Types.ObjectId, ref: "user", required: true },
  driverId: { type: String, unique: true, required: true },
  phonenumber: { type: String },
  license: {
    licensenumber: { type: String, unique: true },
    expiredate: { type: Date },
  },
  status: { type: String, enum: ["active", "inactiver"], default: "active" },
  documents: {
    docname: { type: String },
    docnumber: { type: String, unique: true },
    docexpiredate: { type: Date },
  },
  availability: {
    type: String,
    enum: ["available", "assigned", "unavailable"],
    default: "available",
  },
});

const Driver = mongosse.model("driver", driverSchema);

const vechileSchema = mongosse.Schema({
  vregistrationnumber: {
    type: String,
    required: true,
    unique: true,
  },

  vtype: {
    type: String,
    required: true,
  },

  vmodel: {
    type: String,
    required: true,
  },

  vcapacity: {
    type: Number,
    required: true,
  },

  vfuletype: {
    type: String,
    required: true,
  },

  vstatus: {
    type: String,
    enum: ["Available", "Assigned", "In Maintenance", "Inactive"],
    required: true,
  },

  documents: {
    insurance: {
      documentName: {
        type: String,
        required: true,
        default: "Insurance",
      },

      documentNumber: {
        type: String,
        required: true,
      },

      expireDate: {
        type: Date,
        required: true,
      },
    },

    rc: {
      documentName: {
        type: String,
        required: true,
        default: "RC",
      },

      documentNumber: {
        type: String,
        required: true,
      },

      expireDate: {
        type: Date,
        required: true,
      },
    },

    puc: {
      documentName: {
        type: String,
        required: true,
        default: "PUC",
      },

      documentNumber: {
        type: String,
        required: true,
      },

      expireDate: {
        type: Date,
        required: true,
      },
    },

    fitness: {
      documentName: {
        type: String,
        required: true,
        default: "Fitness Certificate",
      },

      documentNumber: {
        type: String,
        required: true,
      },

      expireDate: {
        type: Date,
        required: true,
      },
    },

    permit: {
      documentName: {
        type: String,
        required: true,
        default: "Transport Permit",
      },

      documentNumber: {
        type: String,
        required: true,
      },

      expireDate: {
        type: Date,
        required: true,
      },
    },
  },
});

const Vechile = mongosse.model("vechile", vechileSchema);

const vehicleMaintenanceSchema = new mongosse.Schema(
  {
    vehicleId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "vechile",
      required: true,
    },

    vechileId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "vechile",
    },

    serviceDate: {
      type: Date,
      required: true,
    },

    serviceType: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    odometer: {
      type: Number,
      required: true,
      min: 0,
    },

    serviceCost: {
      type: Number,
      required: true,
      min: 0,
    },

    serviceProvider: {
      type: String,
      required: true,
      trim: true,
    },

    nextServiceDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

const VehicleMaintenance = mongosse.model(
  "VehicleMaintenance",
  vehicleMaintenanceSchema,
);

const vehicleFuelSchema = new mongosse.Schema(
  {
    vehicleId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "vechile",
      required: true,
    },

    fuelDate: {
      type: Date,
      required: true,
    },

    fuelType: {
      type: String,
      required: true,
      enum: ["Diesel", "Petrol", "CNG", "Electric"],
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    fuelCost: {
      type: Number,
      required: true,
      min: 0,
    },

    odometer: {
      type: Number,
      required: true,
      min: 0,
    },

    fuelStation: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

const VehicleFuel = mongosse.model("VehicleFuel", vehicleFuelSchema);

module.exports = {
  User,
  Customer,
  Shipment,
  Driver,
  Vechile,
  VehicleMaintenance,
  VehicleFuel,
};
