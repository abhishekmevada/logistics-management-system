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
      "admin",
      "logistic manager",
      "dispatcher",
      "warehouse manager",
      "griver",
      "customer",
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
  userId: { type: mongosse.Schema.Types.ObjectId, ref: "user", required: true },
  customerId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phonenumber: { type: Number, required: true },
  address: { type: String, required: true },
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
      ref: "Customer",
      required: true,
    },

    senderName: {
      type: String,
      required: true,
      trim: true,
    },

    senderPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    pickupAddress: {
      type: String,
      required: true,
      trim: true,
    },

    receiverName: {
      type: String,
      required: true,
      trim: true,
    },

    receiverPhoneNumber: {
      type: String,
      required: true,
      trim: true,
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },

    packageCount: {
      type: Number,
      required: true,
      min: 1,
    },

    totalWeight: {
      type: Number,
      required: true,
      min: 0,
    },

    dimensions: {
      length: {
        type: Number,
        required: true,
        min: 0,
      },
      width: {
        type: Number,
        required: true,
        min: 0,
      },
      height: {
        type: Number,
        required: true,
        min: 0,
      },
    },

    packageDescription: {
      type: String,
      required: true,
      trim: true,
    },

    pickupDate: {
      type: Date,
      required: true,
    },

    expectedDeliveryDate: {
      type: Date,
      required: true,
    },

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
  },
  {
    timestamps: true,
  },
);

const Shipment = mongosse.model("shipments", shipmentSchema);

module.exports = { User, Customer, Shipment };
