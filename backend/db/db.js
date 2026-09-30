const mongosse = require("mongoose");

const connectDb = async () => {
  try {
    await mongosse.connect("mongodb://localhost:27017/logisticmanagement");
    console.log("db connect");
    try {
      await mongosse.connection.db
        .collection("deliveries")
        .dropIndex("deliveryId_1");
    } catch {
      // index does not exist or already dropped, ignore safely
    }
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
      required: false,
      default: null,
    },
    vehicleNo: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "vechile",
      default: null,
      trim: true,
    },
    tripNo: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "trip",
      default: null,
      trim: true,
    },
    deliveryOtp: {
      type: String,
      default: null,
    },
    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },
    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },
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

  driver: {
    type: String,
    default: "",
    trim: true,
  },

  driverPhone: {
    type: String,
    default: "",
    trim: true,
  },

  location: {
    type: String,
    default: "Central Depot, Mumbai",
    trim: true,
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

const warehouseSchema = mongosse.Schema(
  {
    warehouseId: { type: String, required: true, unique: true },
    warName: { type: String, required: true },
    warAddress: { type: String, required: true },
    warCity: { type: String, required: true },
    warCapacity: { type: Number, required: true, min: 0 },
    warStatus: { type: String, enum: ["active", "inactive"], required: true },
  },
  { timestamps: true },
);

const Warehouse = mongosse.model("warehouse", warehouseSchema);

const warehouseLocationSchema = mongosse.Schema(
  {
    warehouseId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "warehouse",
      required: true,
    },
    warlocZone: { type: String, required: true },
    warlocRack: { type: String, required: true },
    warlocBin: { type: String, required: true },
    warlocCapacity: { type: String, required: true, min: 0 },
    warlocStatus: { type: String, enum: ["available", "full", "inactive"] },
  },
  { timestamps: true },
);

const WarehouseLocation = mongosse.model(
  "warehouselocation",
  warehouseLocationSchema,
);

const warehouseStorageSchema = mongosse.Schema(
  {
    warehouseId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "warehouse",
      required: true,
    },
    shipmentId: {
      type: mongosse.Schema.Types.ObjectId,
      required: true,
      ref: "shipments",
    },
    locationId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "warehouselocation",
      required: true,
    },
    storeAt: { type: Date, default: Date.now },
    warstorStatus: { type: String, enum: ["store", "remove"], required: true },
    removeAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const WarehouseStorage = mongosse.model(
  "warehousestorage",
  warehouseStorageSchema,
);

const warehouseTransactionSchema = mongosse.Schema(
  {
    warehouseId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "warehouse",
      required: true,
    },
    shipmentId: {
      type: mongosse.Schema.Types.ObjectId,
      required: true,
      ref: "shipments",
    },
    wartransactionType: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    locationId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "warehouselocation",
      required: true,
    },
    wartansactonProcessBy: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    wartransactionDate: { type: Date, default: Date.now, required: true },
  },
  { timestamps: true },
);

const WarehouseTransaction = mongosse.model(
  "warehousetransaction",
  warehouseTransactionSchema,
);

const tripSchema = new mongosse.Schema(
  {
    tripId: {
      type: String,
      required: true,
      unique: true,
    },

    origin: {
      type: String,
      required: true,
      trim: true,
    },

    destination: {
      type: String,
      required: true,
      trim: true,
    },

    stops: [
      {
        location: {
          type: String,
          required: true,
          trim: true,
        },

        stopOrder: {
          type: Number,
          required: true,
        },
      },
    ],

    driverId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "driver",
      required: true,
    },

    vehicleId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "vechile",
      required: true,
    },

    shipmentIds: [
      {
        type: mongosse.Schema.Types.ObjectId,
        ref: "shipments",
        required: true,
      },
    ],

    plannedDeparture: {
      type: Date,
      required: true,
    },

    plannedArrival: {
      type: Date,
      required: true,
    },

    actualDeparture: {
      type: Date,
      default: null,
    },

    actualArrival: {
      type: Date,
      default: null,
    },

    plannedDistance: {
      type: Number,
      default: 0,
      min: 0,
    },

    tripCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "planned",
        "dispatched",
        "in_transit",
        "arrived",
        "completed",
        "cancelled",
      ],
      default: "planned",
    },
  },
  { timestamps: true },
);

const Trip = mongosse.model("trip", tripSchema);

const deliverySchema = new mongosse.Schema(
  {
    shipmentId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "shipments",
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "out_for_delivery",
        "delivered",
        "failed",
        "reattempt_scheduled",
      ],
      default: "pending",
      required: true,
    },

    reason: {
      type: String,
      default: null,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    reattemptDate: {
      type: Date,
      default: null,
    },

    attemptNumber: {
      type: Number,
      default: 1,
      min: 1,
    },

    deliveryOtp: {
      type: String,
      default: null,
    },
    deliveryOtpExpiresAt: {
      type: Date,
      default: null,
    },
    deliveryOtpVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Delivery = mongosse.model("delivery", deliverySchema);

const podSchema = new mongosse.Schema(
  {
    shipmentId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "shipments",
      required: true,
      unique: true,
    },

    receiver: {
      name: {
        type: String,
        required: true,
        trim: true,
      },

      relationship: {
        type: String,
        default: "",
        trim: true,
      },

      phone: {
        type: String,
        default: "",
        trim: true,
      },
    },

    deliveryAddress: {
      type: String,
      default: "",
      trim: true,
    },

    deliveryDate: {
      type: Date,
      required: true,
    },

    otpVerified: {
      type: Boolean,
      default: false,
    },

    signatureUrl: {
      type: String,
      default: "",
    },

    photoUrl: {
      type: String,
      default: "",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    submittedBy: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    podDocumentUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

const POD = mongosse.model("pod", podSchema);

module.exports = {
  User,
  Customer,
  Shipment,
  Driver,
  Vechile,
  VehicleMaintenance,
  VehicleFuel,
  Warehouse,
  WarehouseLocation,
  WarehouseStorage,
  WarehouseTransaction,
  Trip,
  Delivery,
  POD,
};
