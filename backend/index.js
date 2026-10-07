require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const mongosse = require("mongoose");
const mongoose = mongosse;
const cors = require("cors");
const jsonwebtoken = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const https = require("https");
const cloudinary = require("./config/cloudinary");
const csv = require("csv-parser");
const XLSX = require("xlsx");
const {
  sendOtpEmail,
  sendDeliveryOtpEmail,
  sendDrivertoReminder,
  sendShipmentStatusUpdate,
  sendShipmentAssignedEmail,
  sendAccountCreatedEmail,
  sendCustomerCreatedEmail,
} = require("./utils/mailer");
const {
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
  Invoice,
  CompanyInfo,
  AuditLog,
  Notification,
  Query,
} = require("./db/db");
const uploadToCloudinary = require("./utils/uploadToCloudinary");
const createAuditLog = require("./utils/auditLog");
const {
  calculateShipmentCharges,
  generateInvoicePDF,
  generateInvoiceHTML,
  generateBillingExcelReport,
} = require("./utils/billing");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const port = 5000;

const jwt = process.env.JWT_SECRET;

const uploadDir = path.join(__dirname, "uploads", "shipments");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const importDir = path.join(__dirname, "imports");

if (!fs.existsSync(importDir)) {
  fs.mkdirSync(importDir, { recursive: true });
}

const generateImportBatchId = () => {
  return `IMP-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
};

const getFileType = (fileName) => {
  const extension = path.extname(fileName).toLowerCase();

  if (extension === ".csv") {
    return "csv";
  }

  if (extension === ".xlsx" || extension === ".xls") {
    return "excel";
  }

  return null;
};

const parseCsvFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const records = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => {
        records.push(data);
      })
      .on("end", () => {
        resolve(records);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
};

const parseExcelFile = (filePath) => {
  const workbook = XLSX.readFile(filePath);

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("Excel file does not contain a worksheet");
  }

  const worksheet = workbook.Sheets[sheetName];

  return XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
  });
};

const parseImportFile = async (filePath, fileName) => {
  const fileType = getFileType(fileName);

  if (fileType === "csv") {
    return await parseCsvFile(filePath);
  }

  if (fileType === "excel") {
    return parseExcelFile(filePath);
  }

  throw new Error(
    "Unsupported file format. Only CSV, XLS and XLSX files are allowed",
  );
};

const validateImportedShipment = async (row) => {
  const errors = [];

  const customerValue = String(row.customerId || "").trim();

  if (!customerValue) {
    errors.push("customerId is required");
  }

  let customer = null;

  if (customerValue) {
    if (mongoose.Types.ObjectId.isValid(customerValue)) {
      customer = await Customer.findById(customerValue);
    } else if (/^\d+$/.test(customerValue)) {
      customer = await Customer.findOne({
        customerId: Number(customerValue),
      });
    }

    if (!customer) {
      errors.push("Customer not found");
    }
  }

  const senderName = String(row.senderName || "").trim();

  const senderPhoneNumber = String(row.senderPhoneNumber || "").trim();

  const pickupAddress = String(row.pickupAddress || "").trim();

  const receiverName = String(row.receiverName || "").trim();

  const receiverPhoneNumber = String(row.receiverPhoneNumber || "").trim();

  const deliveryAddress = String(row.deliveryAddress || "").trim();

  const packageDescription = String(row.packageDescription || "").trim();

  if (!senderName) {
    errors.push("senderName is required");
  } else if (!/^[A-Za-z ]+$/.test(senderName)) {
    errors.push("senderName must contain only letters and spaces");
  }

  if (!senderPhoneNumber) {
    errors.push("senderPhoneNumber is required");
  } else if (!/^\d{10}$/.test(senderPhoneNumber)) {
    errors.push("senderPhoneNumber must be exactly 10 digits");
  }

  if (!pickupAddress) {
    errors.push("pickupAddress is required");
  }

  if (!receiverName) {
    errors.push("receiverName is required");
  } else if (!/^[A-Za-z ]+$/.test(receiverName)) {
    errors.push("receiverName must contain only letters and spaces");
  }

  if (!receiverPhoneNumber) {
    errors.push("receiverPhoneNumber is required");
  } else if (!/^\d{10}$/.test(receiverPhoneNumber)) {
    errors.push("receiverPhoneNumber must be exactly 10 digits");
  }

  if (!deliveryAddress) {
    errors.push("deliveryAddress is required");
  }

  if (!packageDescription) {
    errors.push("packageDescription is required");
  }

  const packageCount = Number(row.packageCount);
  const totalWeight = Number(row.totalWeight);
  const length = Number(row.length);
  const width = Number(row.width);
  const height = Number(row.height);

  if (!Number.isInteger(packageCount) || packageCount < 1) {
    errors.push("packageCount must be an integer greater than or equal to 1");
  }

  if (!Number.isFinite(totalWeight) || totalWeight < 0) {
    errors.push("totalWeight must be greater than or equal to 0");
  }

  if (!Number.isFinite(length) || length < 0) {
    errors.push("length must be greater than or equal to 0");
  }

  if (!Number.isFinite(width) || width < 0) {
    errors.push("width must be greater than or equal to 0");
  }

  if (!Number.isFinite(height) || height < 0) {
    errors.push("height must be greater than or equal to 0");
  }

  const pickupDate = new Date(row.pickupDate);
  const expectedDeliveryDate = new Date(row.expectedDeliveryDate);

  if (!row.pickupDate || Number.isNaN(pickupDate.getTime())) {
    errors.push("pickupDate is invalid");
  }

  if (
    !row.expectedDeliveryDate ||
    Number.isNaN(expectedDeliveryDate.getTime())
  ) {
    errors.push("expectedDeliveryDate is invalid");
  }

  if (
    !Number.isNaN(pickupDate.getTime()) &&
    !Number.isNaN(expectedDeliveryDate.getTime()) &&
    expectedDeliveryDate < pickupDate
  ) {
    errors.push("expectedDeliveryDate cannot be before pickupDate");
  }

  return {
    errors,
    customer,
    normalizedData: {
      customerId: customer?._id,
      senderName,
      senderPhoneNumber,
      pickupAddress,
      receiverName,
      receiverPhoneNumber,
      deliveryAddress,
      packageCount,
      totalWeight,
      dimensions: {
        length,
        width,
        height,
      },
      packageDescription,
      pickupDate,
      expectedDeliveryDate,
    },
  };
};

const processShipmentImport = async (req, res) => {
  let importRecord = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "CSV or Excel file is required",
      });
    }

    const fileType = getFileType(req.file.originalname);

    if (!fileType) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        message: "Only CSV, XLS and XLSX files are allowed",
      });
    }

    const records = await parseImportFile(req.file.path, req.file.originalname);

    const batchId = generateImportBatchId();

    importRecord = await ShipmentImport.create({
      batchId,
      fileName: req.file.originalname,
      fileType,
      totalRecords: records.length,
      successfulRecords: 0,
      failedRecords: 0,
      status: "completed",
      createdBy: req.user?.id || null,
    });

    let successfulRecords = 0;
    let failedRecords = 0;

    for (let i = 0; i < records.length; i++) {
      const row = records[i];

      try {
        const validation = await validateImportedShipment(row);

        if (validation.errors.length > 0) {
          failedRecords++;

          await ShipmentImportFailure.create({
            batchId,
            rowNumber: i + 2,
            data: row,
            errors: validation.errors,
          });

          continue;
        }

        const shipmentId = await generateShipmentId();
        const trackingId = await generateTrackingId();

        const shipment = new Shipment({
          shipmentId,
          trackingId,
          ...validation.normalizedData,
          status: "created",
        });

        await shipment.save();

        await ShipmentStatusHistory.create({
          shipmentId: shipment._id,
          status: "created",
        });

        successfulRecords++;
      } catch (error) {
        failedRecords++;

        await ShipmentImportFailure.create({
          batchId,
          rowNumber: i + 2,
          data: row,
          errors: [error.message],
        });
      }
    }

    importRecord.totalRecords = records.length;
    importRecord.successfulRecords = successfulRecords;
    importRecord.failedRecords = failedRecords;
    importRecord.status =
      failedRecords > 0 ? "completed_with_errors" : "completed";

    await importRecord.save();

    await createAuditLog({
      userId: req.user?._id || req.user?.userId || importRecord.createdBy,
      action: "IMPORT_SHIPMENTS",
      resource: "Shipment",
      resourceId: importRecord._id ? importRecord._id.toString() : batchId,
    });

    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      message: "Shipment import completed",
      batchId,
      summary: {
        totalRecords: records.length,
        successfulRecords,
        failedRecords,
      },
      status: importRecord.status,
    });
  } catch (error) {
    if (importRecord) {
      importRecord.status = "failed";
      await importRecord.save();
    }

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      message: "Shipment import failed",
      error: error.message,
    });
  }
};

const importStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, importDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const importUpload = multer({
  storage: importStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

// Validate Name
const validateName = (name) => {
  if (!name) {
    return "Name is required";
  }

  if (typeof name !== "string") {
    return "Name must be a string";
  }

  const trimmedName = name.trim();

  if (trimmedName.length < 2) {
    return "Name must be at least 2 characters";
  }

  if (trimmedName.length > 50) {
    return "Name must not exceed 50 characters";
  }

  // Only letters and spaces
  if (!/^[A-Za-z ]+$/.test(trimmedName)) {
    return "Name can contain only letters and spaces";
  }

  return null;
};

//validatephone

const validatePhone = (phonenumber) => {
  if (phonenumber === undefined || phonenumber === null || phonenumber === "") {
    return "Phone number is required";
  }

  const phone = String(phonenumber).trim();

  if (!/^\d{10}$/.test(phone)) {
    return "Phone number must be exactly 10 digits";
  }

  return null;
};

// Validate Email
const validateEmail = (email) => {
  if (!email) {
    return "Email is required";
  }

  if (typeof email !== "string") {
    return "Email must be a string";
  }

  const trimmedEmail = email.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmedEmail)) {
    return "Please enter a valid email";
  }

  if (trimmedEmail.length > 100) {
    return "Email must not exceed 100 characters";
  }

  return null;
};

// Validate Password
const validatePassword = (password) => {
  if (!password) {
    return "Password is required";
  }

  if (typeof password !== "string") {
    return "Password must be a string";
  }

  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (password.length > 100) {
    return "Password must not exceed 100 characters";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  return null;
};

const authMiddleware = (req, res, next) => {
  let token = null;
  const header = req.headers.authorization;

  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  try {
    const decoded = jsonwebtoken.verify(token, jwt);

    req.user = decoded;
    if (req.user && !req.user._id && req.user.userId) {
      req.user._id = req.user.userId;
    }

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// Helper for automatic system notifications
const createNotificationSystem = async ({
  userId = null,
  type,
  message,
  shipmentId = "",
  referenceId = "",
}) => {
  try {
    const notification = new Notification({
      userId,
      type,
      message,
      read: false,
      createdAt: new Date(),
      shipmentId,
      referenceId,
    });
    await notification.save();
    return notification;
  } catch (err) {
    console.error("Error creating notification:", err.message);
    return null;
  }
};

// ── IN-APP NOTIFICATIONS ENDPOINTS ──────────────────────────────────────────

// GET /notifications - Retrieve notifications for dashboard
app.get("/notifications", authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user && req.user._id) {
      query = {
        $or: [{ userId: req.user._id }, { userId: null }],
      };
    }
    const notifications = await Notification.find(query).sort({
      createdAt: -1,
    });
    res.json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

// PATCH /notifications/:id/read - Automatic mark as read when open notification
app.patch("/notifications/:id/read", authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true },
    );
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error("Mark notification read error:", error);
    res.status(500).json({ message: "Failed to update notification status" });
  }
});

// Helper to extract clean name and reference ID from populated resource documents
const extractResourceDetails = (resourceType, doc, fallbackId) => {
  if (!doc || typeof doc !== "object")
    return { name: fallbackId || "—", id: fallbackId || "—" };

  const type = String(resourceType || "").toLowerCase();
  let name = "";
  let id = doc._id ? String(doc._id) : fallbackId;

  if (type === "shipment") {
    const shpId = doc.shipmentId || doc.trackingId;
    name =
      shpId ||
      (doc.senderName ? `${doc.senderName} → ${doc.receiverName || ""}` : "");
    id = shpId || id;
  } else if (type === "driver") {
    const dName = doc.userId?.name || doc.name;
    name = dName || doc.phonenumber || "";
    id = doc.driverId || id;
  } else if (type === "vehicle" || type === "vechile") {
    const reg = doc.vregistrationnumber || doc.registrationNumber;
    const mod = doc.vmodel || doc.model;
    name = reg ? (mod ? `${reg} (${mod})` : reg) : "";
    id = reg || id;
  } else if (type === "warehouse") {
    const shpId =
      doc.shipmentCode ||
      doc.relatedShpCode ||
      doc.relatedShp?.shipmentId ||
      doc.relatedShp?.trackingId ||
      "";
    const whName =
      doc.warName ||
      doc.warehouseName ||
      doc.warhouseName ||
      doc.warehouseId ||
      "";
    if (shpId) {
      name = whName ? `${shpId} (${whName})` : shpId;
      id = shpId;
    } else {
      name = whName || doc.warehouseId || fallbackId;
      id = doc.warehouseId || id;
    }
  } else if (type === "trip") {
    name =
      doc.tripId ||
      (doc.origin && doc.destination
        ? `${doc.origin} → ${doc.destination}`
        : "");
    id = doc.tripId || id;
  } else if (type === "delivery") {
    const shpId =
      doc.shipmentCode ||
      doc.shipment?.shipmentId ||
      doc.shipment?.trackingId ||
      doc.shipmentId?.shipmentId ||
      doc.shipmentId?.trackingId ||
      (typeof doc.shipmentId === "string" ? doc.shipmentId : "") ||
      doc.trackingId ||
      doc.deliveryId ||
      "";
    const rec =
      doc.receiverName ||
      doc.recipientName ||
      doc.receiver?.name ||
      doc.shipment?.receiverName ||
      "";
    name = shpId ? (rec ? `${shpId} (${rec})` : shpId) : rec || fallbackId;
    id = shpId || doc.deliveryId || id;
  } else if (type === "pod") {
    const shpId =
      doc.shipmentCode ||
      doc.shipment?.shipmentId ||
      doc.shipment?.trackingId ||
      doc.shipmentId?.shipmentId ||
      doc.shipmentId?.trackingId ||
      (typeof doc.shipmentId === "string" ? doc.shipmentId : "") ||
      "";
    const rec =
      doc.receiver?.name ||
      doc.receiverName ||
      doc.shipment?.receiverName ||
      "";
    name = shpId || (rec ? `POD (${rec})` : doc.podNumber || fallbackId);
    id = shpId || doc.podNumber || id;
  } else if (type === "invoice") {
    name = doc.invoiceNumber || "";
    id = doc.invoiceNumber || id;
  } else if (type === "user") {
    name = doc.name || doc.email || "";
  } else if (type === "customer") {
    name = doc.companyName || doc.customerName || doc.name || "";
  }

  if (!name) name = id || fallbackId || "—";
  return { name, id: id || fallbackId || "—" };
};

// GET Audit Logs endpoint
app.get("/audit-logs", authMiddleware, async (req, res) => {
  try {
    const {
      action,
      resource,
      userId,
      search,
      page = 1,
      limit = 200,
    } = req.query;
    const query = {};

    if (action && action !== "All") {
      query.action = action;
    }
    if (resource && resource !== "All") {
      query.resource = resource;
    }
    if (userId && userId !== "All") {
      query.userId = userId;
    }

    const limitNum = Math.min(Number(limit) || 200, 1000);
    const pageNum = Math.max(Number(page) || 1, 1);
    const skip = (pageNum - 1) * limitNum;

    const [rawLogs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("userId", "name email role")
        .sort({ createdAt: -1, timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    let logs = await Promise.all(
      rawLogs.map(async (log) => {
        const rawResId = log.resourceId;
        const strId = String(rawResId?._id || rawResId || "");
        let resourceName = "—";
        let resourceRefId = strId || "—";

        const isPopulatedDoc =
          rawResId &&
          typeof rawResId === "object" &&
          rawResId.constructor?.name !== "ObjectId" &&
          !rawResId._bsontype &&
          (rawResId.shipmentId ||
            rawResId.trackingId ||
            rawResId.vregistrationnumber ||
            rawResId.warName ||
            rawResId.warehouseId ||
            rawResId.driverId ||
            rawResId.tripId ||
            rawResId.podNumber ||
            rawResId.receiver ||
            rawResId.invoiceNumber ||
            rawResId.recipientName ||
            rawResId.receiverName);

        const type = String(log.resource || "").toLowerCase();
        let doc = isPopulatedDoc ? rawResId : null;

        if (!doc && strId && mongosse.Types.ObjectId.isValid(strId)) {
          try {
            if (type === "shipment") {
              doc = await Shipment.findById(strId).lean();
            } else if (type === "delivery") {
              const shp = await Shipment.findById(strId).lean();
              if (shp) doc = shp;
              else doc = await Delivery.findById(strId).lean();
            } else if (type === "pod") {
              const pod = await POD.findById(strId).lean();
              if (pod) doc = pod;
              else doc = await Shipment.findById(strId).lean();
            } else if (type === "warehouse") {
              const shp = await Shipment.findById(strId).lean();
              if (shp) doc = { isShipment: true, shipment: shp };
              else doc = await Warehouse.findById(strId).lean();
            } else if (type === "driver") {
              doc = await Driver.findById(strId)
                .populate("userId", "name email")
                .lean();
            } else if (type === "vehicle" || type === "vechile") {
              doc = await Vechile.findById(strId).lean();
            } else if (type === "trip") {
              doc = await Trip.findById(strId).lean();
            } else if (type === "invoice") {
              doc = await Invoice.findById(strId).lean();
            } else if (type === "user") {
              doc = await User.findById(strId).lean();
            }
          } catch (e) {}
        }

        if (doc) {
          try {
            if (type === "pod") {
              let shpDoc = null;
              if (
                doc.shipmentId &&
                typeof doc.shipmentId === "object" &&
                (doc.shipmentId.shipmentId || doc.shipmentId.trackingId)
              ) {
                shpDoc = doc.shipmentId;
              } else {
                const sid =
                  doc.shipmentId?._id ||
                  doc.shipmentId ||
                  (doc.shipment ? doc.shipment._id || doc.shipment : null);
                if (sid) {
                  shpDoc = await Shipment.findById(String(sid)).lean();
                }
              }
              if (!shpDoc && doc._id) {
                shpDoc = await Shipment.findById(String(doc._id)).lean();
              }
              if (shpDoc) {
                doc.shipment = shpDoc;
                doc.shipmentCode = shpDoc.shipmentId || shpDoc.trackingId;
              }
            } else if (type === "delivery") {
              let shpDoc = null;
              if (
                doc.shipmentId &&
                typeof doc.shipmentId === "object" &&
                (doc.shipmentId.shipmentId || doc.shipmentId.trackingId)
              ) {
                shpDoc = doc.shipmentId;
              } else {
                const sid =
                  doc.shipmentId?._id ||
                  doc.shipmentId ||
                  (doc.shipment ? doc.shipment._id || doc.shipment : null);
                if (sid) {
                  shpDoc = await Shipment.findById(String(sid)).lean();
                }
              }
              if (!shpDoc && doc._id) {
                shpDoc = await Shipment.findById(String(doc._id)).lean();
              }
              if (shpDoc) {
                doc.shipment = shpDoc;
                doc.shipmentCode = shpDoc.shipmentId || shpDoc.trackingId;
              }
            } else if (type === "warehouse") {
              if (doc.isShipment && doc.shipment) {
                doc.shipmentCode =
                  doc.shipment.shipmentId || doc.shipment.trackingId;
              } else {
                let relatedShpCode = null;
                const whId = String(doc._id || strId);
                const q = { warehouseId: whId };
                if ((log.action || "").includes("INBOUND"))
                  q.wartransactionType = "inbound";
                else if ((log.action || "").includes("OUTBOUND"))
                  q.wartransactionType = "outbound";

                const txns = await WarehouseTransaction.find(q)
                  .populate("shipmentId")
                  .lean();
                if (txns && txns.length > 0) {
                  txns.sort(
                    (a, b) =>
                      Math.abs(
                        new Date(a.createdAt) - new Date(log.createdAt),
                      ) -
                      Math.abs(new Date(b.createdAt) - new Date(log.createdAt)),
                  );
                  relatedShpCode =
                    txns[0]?.shipmentId?.shipmentId ||
                    txns[0]?.shipmentId?.trackingId ||
                    null;
                }
                doc.relatedShpCode = relatedShpCode;
              }
            }
          } catch (err) {}

          const details = extractResourceDetails(log.resource, doc, strId);
          resourceName = details.name;
          resourceRefId = details.id;
        } else {
          resourceName = strId;
        }

        return {
          _id: log._id,
          action: log.action,
          resource: log.resource,
          resourceId: resourceRefId,
          resourceName: resourceName,
          timestamp: log.timestamp || log.createdAt,
          createdAt: log.createdAt,
          user: log.userId
            ? {
                _id: log.userId._id,
                name: log.userId.name || "System User",
                email: log.userId.email || "",
                role: log.userId.role || "User",
              }
            : {
                _id: null,
                name: "System / Admin",
                email: "system@routeflow.io",
                role: "System",
              },
        };
      }),
    );

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      logs = logs.filter((l) => {
        const act = (l.action || "").toLowerCase();
        const resName = (l.resource || "").toLowerCase();
        const resId = (l.resourceId || "").toLowerCase();
        const resDetail = (l.resourceName || "").toLowerCase();
        const userName = (l.user?.name || "").toLowerCase();
        const userEmail = (l.user?.email || "").toLowerCase();
        return (
          act.includes(q) ||
          resName.includes(q) ||
          resId.includes(q) ||
          resDetail.includes(q) ||
          userName.includes(q) ||
          userEmail.includes(q)
        );
      });
    }

    return res.json({
      success: true,
      logs,
      total: total || logs.length,
      page: pageNum,
      totalPages: Math.ceil((total || logs.length) / limitNum) || 1,
    });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
      error: err.message,
    });
  }
});

app.get("/audit-log", (req, res, next) => {
  req.url = "/audit-logs";
  app.handle(req, res, next);
});

//driver id generate
async function generateDriverId() {
  let driverId;
  let exists = true;

  while (exists) {
    driverId = `DRV-${Math.floor(100000 + Math.random() * 900000)}`;

    const existingCustomer = await Driver.findOne({
      driverId,
    });

    exists = !!existingCustomer;
  }

  return driverId;
}

// Signup

app.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Validate request body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        message: "Invalid request body",
      });
    }

    // Validate name
    const nameError = validateName(name);

    if (nameError) {
      return res.status(400).json({
        message: nameError,
      });
    }

    // Validate email
    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    // Validate password
    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    // Clean values
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // Allowed roles matching userSchema enum
    const allowedRoles = [
      "Admin",
      "Logistics Manager",
      "Dispatcher",
      "Warehouse Manager",
      "Driver",
    ];

    // Find matching allowed role (case-insensitive)
    const rawRole = typeof role === "string" ? role.trim() : "";
    const matchedRole = allowedRoles.find(
      (r) => r.toLowerCase() === rawRole.toLowerCase(),
    );

    // Check invalid role
    if (!matchedRole) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    // Check existing email
    const existUser = await User.findOne({
      email: cleanEmail,
    });

    if (existUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Check existing name
    const existName = await User.findOne({
      name: cleanName,
    });

    if (existName) {
      return res.status(400).json({
        message: "Username already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: matchedRole,
    });

    // Save User
    await newUser.save();

    // Driver role profile creation
    if (matchedRole === "Driver") {
      try {
        const driverId = await generateDriverId();

        const newDriver = new Driver({
          userId: newUser._id,
          driverId,
        });

        await newDriver.save();

        await createAuditLog({
          userId: req.user?._id || req.user?.userId || newUser._id,
          action: "CREATE_DRIVER",
          resource: "Driver",
          resourceId: newDriver._id.toString(),
        });
      } catch (driverErr) {
        // Rollback user if driver creation fails
        await User.findByIdAndDelete(newUser._id).catch(() => {});
        throw driverErr;
      }
    }

    // Send account creation email to the user
    try {
      await sendAccountCreatedEmail(
        cleanEmail,
        cleanName,
        password,
        matchedRole,
      );
      console.log(`Account creation email sent successfully to ${cleanEmail}`);
    } catch (emailErr) {
      console.error("Failed to send signup email:", emailErr.message);
    }

    await createAuditLog({
      userId: req.user?._id || req.user?.userId || newUser._id,
      action: "CREATE_USER",
      resource: "User",
      resourceId: newUser._id.toString(),
    });

    if (matchedRole === "Driver") {
      return res.status(201).json({ message: "Driver Signup Done" });
    }

    return res.status(201).json({
      message: "User signup successful",
      role: matchedRole,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

// Login

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "Password is required",
      });
    }

    if (typeof password !== "string") {
      return res.status(400).json({
        message: "Password must be a string",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existUser = await User.findOne({
      email: cleanEmail,
    });

    if (!existUser) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(password, existUser.password);

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (existUser.status === "inactive") {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    const token = jsonwebtoken.sign(
      {
        userId: existUser._id,
        role: existUser.role,
      },
      jwt,
      {
        expiresIn: "2d",
      },
    );

    let driverData = null;
    if (existUser.role && existUser.role.toLowerCase() === "driver") {
      let driver = await Driver.findOne({
        $or: [
          { userId: existUser._id },
          { userId: existUser._id.toString() },
          { _id: existUser._id },
        ],
      });

      if (!driver) {
        const newDriverId = await generateDriverId();
        driver = new Driver({
          userId: existUser._id,
          driverId: newDriverId,
        });
        await driver.save();
      }

      const isProfileComplete = Boolean(
        driver.phonenumber &&
        driver.license?.licensenumber &&
        driver.license?.expiredate,
      );

      driverData = {
        _id: driver._id,
        driverId: driver.driverId,
        phonenumber: driver.phonenumber || "",
        license: {
          licensenumber: driver.license?.licensenumber || "",
          expiredate: driver.license?.expiredate || null,
        },
        status: driver.status,
        availability: driver.availability,
        isProfileComplete,
      };
    }

    return res.status(200).json({
      message: "Sign in successful",

      token,
      role: existUser.role,

      user: {
        userId: existUser._id,
        userName: existUser.name,
        email: existUser.email,
        role: existUser.role,
        status: existUser.status,
        driverId: driverData?.driverId || "",
        phonenumber: driverData?.phonenumber || "",
      },

      driver: driverData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// Logout
app.post("/logout", async (req, res) => {
  try {
    let token = null;
    const header = req.headers.authorization;

    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    } else if (req.body && req.body.token) {
      token = req.body.token;
    }

    if (token) {
      try {
        const decoded = jsonwebtoken.verify(token, jwt);
        const userId = decoded.userId || decoded._id;

        if (userId) {
          await createAuditLog({
            userId,
            action: "LOGOUT",
            resource: "user",
            resourceId: userId,
          });
        }
      } catch (jwtErr) {
        // Token was invalid or expired, continue to allow graceful client logout
      }
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during logout",
    });
  }
});

//forgotpassword
app.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existUser = await User.findOne({
      email: cleanEmail,
    });

    if (!existUser) {
      return res.status(404).json({
        message: "Email is not registered",
      });
    }

    const otp = crypto.randomInt(1000, 10000).toString();

    const otpHash = await bcrypt.hash(otp, 10);

    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    existUser.resetOtpHash = otpHash;
    existUser.resetOtpExpiresAt = otpExpiresAt;
    existUser.resetOtpVerified = false;

    await existUser.save();

    await sendOtpEmail(cleanEmail, otp);

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Unable to send OTP",
    });
  }
});

//verifyotp
app.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    if (!otp) {
      return res.status(400).json({
        message: "OTP is required",
      });
    }

    if (typeof otp !== "string") {
      return res.status(400).json({
        message: "OTP must be a string",
      });
    }

    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        message: "OTP must be exactly 4 digits",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existUser = await User.findOne({
      email: cleanEmail,
    });

    if (!existUser) {
      return res.status(404).json({
        message: "Email is not registered",
      });
    }

    if (!existUser.resetOtpHash || !existUser.resetOtpExpiresAt) {
      return res.status(400).json({
        message: "No OTP request found",
      });
    }

    if (existUser.resetOtpExpiresAt.getTime() < Date.now()) {
      existUser.resetOtpHash = null;
      existUser.resetOtpExpiresAt = null;
      existUser.resetOtpVerified = false;

      await existUser.save();

      return res.status(400).json({
        message: "OTP has expired",
      });
    }

    const otpMatch = await bcrypt.compare(otp, existUser.resetOtpHash);

    if (!otpMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    existUser.resetOtpVerified = true;

    await existUser.save();

    const resetToken = jsonwebtoken.sign(
      {
        userId: existUser._id,
        purpose: "password-reset",
      },
      jwt,
      {
        expiresIn: "10m",
      },
    );

    return res.status(200).json({
      message: "OTP verified successfully",
      resetToken,
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

//resetpassword

app.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (!confirmPassword) {
      return res.status(400).json({
        message: "Confirm password is required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return res.status(400).json({
        message: passwordError,
      });
    }

    let decoded;

    try {
      decoded = jsonwebtoken.verify(resetToken, jwt);
    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired reset token",
      });
    }

    if (decoded.purpose !== "password-reset") {
      return res.status(401).json({
        message: "Invalid reset token",
      });
    }

    const existUser = await User.findById(decoded.userId);

    if (!existUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!existUser.resetOtpVerified) {
      return res.status(401).json({
        message: "OTP verification is required",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    existUser.password = hashedPassword;
    existUser.resetOtpHash = null;
    existUser.resetOtpExpiresAt = null;
    existUser.resetOtpVerified = false;

    await existUser.save();

    return res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

async function generateCustomerId() {
  let customerId;
  let exists = true;

  while (exists) {
    customerId = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;

    const existingCustomer = await Customer.findOne({
      customerId,
    });

    exists = !!existingCustomer;
  }

  return customerId;
}

app.post("/customers", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, pickupAddress } = req.body;

    const nameError = validateName(name);

    if (nameError) {
      return res.status(400).json({
        message: nameError,
      });
    }

    const emailError = validateEmail(email);

    if (emailError) {
      return res.status(400).json({
        message: emailError,
      });
    }

    const phoneError = validatePhone(phone);

    if (phoneError) {
      return res.status(400).json({
        message: phoneError,
      });
    }

    if (
      !pickupAddress ||
      typeof pickupAddress !== "string" ||
      !pickupAddress.trim()
    ) {
      return res.status(400).json({
        message: "Address is required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = pickupAddress.trim();

    // const existingUser = await User.findOne({
    //   email: cleanEmail,
    // });

    // if (existingUser) {
    //   return res.status(400).json({
    //     message: "Email already exists",
    //   });
    // }

    const existingCustomer = await Customer.findOne({
      email: cleanEmail,
    });

    if (existingCustomer) {
      return res.status(400).json({
        message: "Customer already exists",
      });
    }

    // const newUser = new User({
    //   name: cleanName,
    //   email: cleanEmail,
    //   password: hashedPassword,
    //   role: "customer",
    //   status: "active",
    // });

    // await newUser.save();

    const customerId = await generateCustomerId();

    const newCustomer = new Customer({
      // userId: newUser._id,
      customerId,
      name: cleanName,
      email: cleanEmail,
      phonenumber: Number(phone),
      address: cleanAddress,
    });

    await newCustomer.save();

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE_CUSTOMER",
      resource: "Customer",
      resourceId: newCustomer._id.toString(),
    });

    try {
      await sendCustomerCreatedEmail(
        cleanEmail,
        cleanName,
        customerId,
      );
      console.log(`Customer creation email sent successfully to ${cleanEmail}`);
    } catch (emailErr) {
      console.error("Failed to send customer created email:", emailErr.message);
    }

    return res.status(201).json({
      message: "Customer created successfully",
      customer: newCustomer,
    });
  } catch (error) {
    console.error("CREATE CUSTOMER ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// app.get("/customers", authMiddleware, async (req, res) => {
//   try {
//     const page = Math.max(parseInt(req.query.page) || 1, 1);

//     const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

//     const skip = (page - 1) * limit;

//     const search =
//       typeof req.query.search === "string" ? req.query.search.trim() : "";

//     const status =
//       typeof req.query.status === "string"
//         ? req.query.status.trim().toLowerCase()
//         : "";

//     if (status && !["active", "inactive"].includes(status)) {
//       return res.status(400).json({
//         message: "Status must be active or inactive",
//       });
//     }

//     const query = {};

//     if (search) {
//       const searchRegex = new RegExp(
//         search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
//         "i",
//       );

//       query.$or = [{ name: searchRegex }, { email: searchRegex }];

//       if (!isNaN(search)) {
//         query.$or.push({
//           customerId: Number(search),
//         });

//         query.$or.push({
//           phonenumber: Number(search),
//         });
//       }
//     }

//     if (status) {
//       const users = await User.find({
//         role: "customer",
//         status,
//       }).select("_id");

//       const userIds = users.map((user) => user._id);

//       query.userId = {
//         $in: userIds,
//       };
//     }

//     const totalCustomers = await Customer.countDocuments(query);

//     const customers = await Customer.find(query)
//       .populate("userId", "name email role status")
//       .sort({ _id: -1 })
//       .skip(skip)
//       .limit(limit);

//     return res.status(200).json({
//       message: "Customer list fetched successfully",
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalCustomers / limit),
//         totalCustomers,
//         limit,
//       },
//       customers,
//     });
//   } catch (error) {
//     console.error("GET CUSTOMER LIST ERROR:", error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// });

app.get("/customers", authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);

    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 1000);

    const skip = (page - 1) * limit;

    const search =
      typeof req.query.search === "string" ? req.query.search.trim() : "";

    const status =
      typeof req.query.status === "string"
        ? req.query.status.trim().toLowerCase()
        : "";

    // Validate status
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        message: "Status must be active or inactive",
      });
    }

    const query = {};

    // Search by name, email, customerId, or phone number
    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { customerId: searchRegex },
      ];

      if (!isNaN(search)) {
        query.$or.push({
          phonenumber: Number(search),
        });
      }
    }

    // Filter directly from Customer DB
    if (status) {
      query.status = status;
    }

    // Get total customers and total shipments
    const totalCustomers = await Customer.countDocuments(query);
    const totalShipments = await Shipment.countDocuments({});

    // Get customers
    const customers = await Customer.find(query)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    // Compute shipment counts for retrieved customers
    const customerIds = customers.map((c) => c._id);
    const countMap = {};
    if (customerIds.length > 0) {
      try {
        const counts = await Shipment.aggregate([
          { $match: { customerId: { $in: customerIds } } },
          { $group: { _id: "$customerId", count: { $sum: 1 } } },
        ]);
        counts.forEach((item) => {
          countMap[String(item._id)] = item.count;
        });
      } catch (aggErr) {
        console.warn("Error calculating shipment counts:", aggErr);
      }
    }

    const customersWithCounts = customers.map((c) => {
      const doc = typeof c.toObject === "function" ? c.toObject() : { ...c };
      doc.shipmentCount = countMap[String(c._id)] || 0;
      return doc;
    });

    return res.status(200).json({
      message: "Customer list fetched successfully",

      totalShipments,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCustomers / limit),
        totalCustomers,
        totalShipments,
        limit,
      },

      customers: customersWithCounts,
    });
  } catch (error) {
    console.error("GET CUSTOMER LIST ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/customers/:id", authMiddleware, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id).populate(
      "userId",
      "name email role status",
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      message: "Customer details fetched successfully",
      customer,
    });
  } catch (error) {
    console.error("GET CUSTOMER DETAILS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// app.put("/customers/:id", authMiddleware, async (req, res) => {
//   try {
//     const { name, email, phonenumber, address } = req.body;

//     const customer = await Customer.findById(req.params.id);

//     if (!customer) {
//       return res.status(404).json({
//         message: "Customer not found",
//       });
//     }

//     if (name !== undefined) {
//       const nameError = validateName(name);

//       if (nameError) {
//         return res.status(400).json({
//           message: nameError,
//         });
//       }
//     }

//     if (email !== undefined) {
//       const emailError = validateEmail(email);

//       if (emailError) {
//         return res.status(400).json({
//           message: emailError,
//         });
//       }
//     }

//     if (phonenumber !== undefined) {
//       const phoneError = validatePhone(phonenumber);

//       if (phoneError) {
//         return res.status(400).json({
//           message: phoneError,
//         });
//       }
//     }

//     if (address !== undefined) {
//       if (typeof address !== "string" || !address.trim()) {
//         return res.status(400).json({
//           message: "Address is required",
//         });
//       }
//     }

//     const cleanName = name !== undefined ? name.trim() : customer.name;

//     const cleanEmail =
//       email !== undefined ? email.trim().toLowerCase() : customer.email;

//     const cleanAddress =
//       address !== undefined ? address.trim() : customer.address;

//     const existingUser = await User.findOne({
//       email: cleanEmail,
//       _id: { $ne: customer.userId },
//     });

//     if (existingUser) {
//       return res.status(400).json({
//         message: "Email already exists",
//       });
//     }

//     const existingCustomer = await Customer.findOne({
//       email: cleanEmail,
//       _id: { $ne: customer._id },
//     });

//     if (existingCustomer) {
//       return res.status(400).json({
//         message: "Email already exists",
//       });
//     }

//     customer.name = cleanName;
//     customer.email = cleanEmail;
//     customer.address = cleanAddress;

//     if (phonenumber !== undefined) {
//       customer.phonenumber = Number(phonenumber);
//     }

//     await customer.save();

//     await User.findByIdAndUpdate(customer.userId, {
//       name: cleanName,
//       email: cleanEmail,
//     });

//     const updatedCustomer = await Customer.findById(customer._id).populate(
//       "userId",
//       "name email role status",
//     );

//     return res.status(200).json({
//       message: "Customer updated successfully",
//       customer: updatedCustomer,
//     });
//   } catch (error) {
//     console.error("UPDATE CUSTOMER ERROR:", error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// });

app.put("/customers/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, phonenumber, phone, address, pickupAddress } =
      req.body || {};

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      customer = await Customer.findById(req.params.id);
    }
    if (!customer) {
      customer = await Customer.findOne({ customerId: req.params.id });
    }

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    // Validate name
    if (name !== undefined) {
      const nameError = validateName(name);
      if (nameError) {
        return res.status(400).json({
          message: nameError,
        });
      }
    }

    // Validate email
    if (email !== undefined) {
      const emailError = validateEmail(email);
      if (emailError) {
        return res.status(400).json({
          message: emailError,
        });
      }
    }

    // Validate phone number
    const phoneInput = phonenumber !== undefined ? phonenumber : phone;
    if (phoneInput !== undefined) {
      const phoneError = validatePhone(phoneInput);
      if (phoneError) {
        return res.status(400).json({
          message: phoneError,
        });
      }
    }

    // Validate address
    const addressInput = address !== undefined ? address : pickupAddress;
    if (addressInput !== undefined) {
      if (typeof addressInput !== "string" || !addressInput.trim()) {
        return res.status(400).json({
          message: "Address is required",
        });
      }
    }

    // Clean values
    const cleanName = name !== undefined ? name.trim() : customer.name;
    const cleanEmail =
      email !== undefined ? email.trim().toLowerCase() : customer.email;
    const cleanAddress =
      addressInput !== undefined ? addressInput.trim() : customer.address;

    // Check email in Customer DB only
    if (cleanEmail !== customer.email) {
      const existingCustomer = await Customer.findOne({
        email: cleanEmail,
        _id: { $ne: customer._id },
      });

      if (existingCustomer) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
    }

    // Update customer
    customer.name = cleanName;
    customer.email = cleanEmail;
    customer.address = cleanAddress;

    if (phoneInput !== undefined) {
      customer.phonenumber = Number(phoneInput);
    }

    await customer.save();

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_CUSTOMER",
      resource: "Customer",
      resourceId: customer._id.toString(),
    });

    if (customer.userId) {
      await User.findByIdAndUpdate(customer.userId, {
        name: cleanName,
        email: cleanEmail,
      });

      await createAuditLog({
        userId: req.user._id,
        action: "UPDATE_USER",
        resource: "User",
        resourceId: customer.userId.toString(),
      });
    }

    // Get updated customer
    const updatedCustomer = await Customer.findById(customer._id);

    return res.status(200).json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.patch("/customers/:id/status", authMiddleware, async (req, res) => {
  try {
    let customer = null;
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      customer = await Customer.findById(req.params.id);
    }
    if (!customer) {
      customer = await Customer.findOne({ customerId: req.params.id });
    }

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const { status } = req.body || {};
    let targetStatus = status ? String(status).toLowerCase().trim() : null;

    if (!targetStatus) {
      // Toggle current status if none provided in body
      targetStatus = customer.status === "active" ? "inactive" : "active";
    }

    if (targetStatus !== "active" && targetStatus !== "inactive") {
      return res.status(400).json({
        message: "Status must be active or inactive",
      });
    }

    customer.status = targetStatus;
    await customer.save();

    if (targetStatus === "inactive") {
      await createAuditLog({
        userId: req.user._id,
        action: "DEACTIVATE_CUSTOMER",
        resource: "Customer",
        resourceId: customer._id.toString(),
      });
    } else {
      await createAuditLog({
        userId: req.user._id,
        action: "UPDATE_CUSTOMER",
        resource: "Customer",
        resourceId: customer._id.toString(),
      });
    }

    if (customer.userId) {
      await User.findByIdAndUpdate(
        customer.userId,
        { status: targetStatus },
        { new: true },
      );

      await createAuditLog({
        userId: req.user._id,
        action:
          targetStatus === "inactive" ? "DEACTIVATE_USER" : "ACTIVATE_USER",
        resource: "User",
        resourceId: customer.userId.toString(),
      });
    }

    return res.status(200).json({
      message:
        targetStatus === "active"
          ? "Customer activated successfully"
          : "Customer deactivated successfully",
      customer: {
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        status: customer.status,
      },
    });
  } catch (error) {
    console.error("CUSTOMER STATUS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

// ── COMPANY INFO ENDPOINTS ──

// GET Company Info
app.get("/company-info", async (req, res) => {
  try {
    let company = await CompanyInfo.findOne();
    if (!company) {
      company = new CompanyInfo({
        name: "LogiTrack Express & Freight Solutions Pvt. Ltd.",
        tagline: "Integrated Logistics, Supply Chain & Fleet Management",
        cin: "U63090MH2016PTC284912",
        gstin: "27AABCL8931M1ZQ",
        pan: "AABCL8931M",
        hsnSacCode: "996511 (Road Freight Transport Services)",
        headOffice:
          "LogiTrack Corporate Towers, 6th Floor, Sector 18, MIDC Industrial Area, Vashi, Navi Mumbai, Maharashtra - 400705",
        phone: "+91 22 6890 4000 / 1800 209 8899",
        email: "billing@logitrack-logistics.com",
        web: "www.logitrack-logistics.com",
        bankDetails: {
          bankName: "HDFC Bank Ltd",
          accountName: "LogiTrack Express & Freight Solutions Pvt Ltd",
          accountNumber: "50200084920194",
          ifscCode: "HDFC0000128",
          branch: "Vashi Sector 17 Branch, Navi Mumbai",
        },
      });
      await company.save();
    }
    return res.status(200).json({ company });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// UPDATE Company Info
app.put("/company-info", async (req, res) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jsonwebtoken.verify(token, jwt);
        req.user = decoded;
      } catch (err) {
        // Continue even if dev token is expired
      }
    }

    const updateData = req.body;
    let company = await CompanyInfo.findOne();
    if (!company) {
      company = new CompanyInfo(updateData);
    } else {
      if (updateData.name !== undefined)
        company.name = String(updateData.name).trim();
      if (updateData.tagline !== undefined)
        company.tagline = String(updateData.tagline).trim();
      if (updateData.cin !== undefined)
        company.cin = String(updateData.cin).trim();
      if (updateData.gstin !== undefined)
        company.gstin = String(updateData.gstin).trim();
      if (updateData.pan !== undefined)
        company.pan = String(updateData.pan).trim();
      if (updateData.hsnSacCode !== undefined)
        company.hsnSacCode = String(updateData.hsnSacCode).trim();
      if (updateData.headOffice !== undefined)
        company.headOffice = String(updateData.headOffice).trim();
      if (updateData.phone !== undefined)
        company.phone = String(updateData.phone).trim();
      if (updateData.email !== undefined)
        company.email = String(updateData.email).trim();
      if (updateData.web !== undefined)
        company.web = String(updateData.web).trim();
      if (updateData.bankDetails) {
        if (!company.bankDetails) company.bankDetails = {};
        if (updateData.bankDetails.bankName !== undefined)
          company.bankDetails.bankName = String(
            updateData.bankDetails.bankName,
          ).trim();
        if (updateData.bankDetails.accountName !== undefined)
          company.bankDetails.accountName = String(
            updateData.bankDetails.accountName,
          ).trim();
        if (updateData.bankDetails.accountNumber !== undefined)
          company.bankDetails.accountNumber = String(
            updateData.bankDetails.accountNumber,
          ).trim();
        if (updateData.bankDetails.ifscCode !== undefined)
          company.bankDetails.ifscCode = String(
            updateData.bankDetails.ifscCode,
          ).trim();
        if (updateData.bankDetails.branch !== undefined)
          company.bankDetails.branch = String(
            updateData.bankDetails.branch,
          ).trim();
        if (updateData.bankDetails.bankAndBranch !== undefined)
          company.bankDetails.bankAndBranch = String(
            updateData.bankDetails.bankAndBranch,
          ).trim();
        company.markModified("bankDetails");
      }
    }
    await company.save();
    return res.status(200).json({
      message: "Company Info updated successfully",
      company,
      companyInfo: company,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ── PROFILE & USER MANAGEMENT ENDPOINTS ──

// GET Current Logged-in User Profile
app.get("/user/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// UPDATE Current User Profile
app.put("/user/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user._id || req.user.userId;
    const {
      firstName,
      lastName,
      name,
      email,
      phone,
      primaryHub,
      timezone,
      twoFactorEnabled,
      password,
    } = req.body;
    const updateFields = {};
    if (name) updateFields.name = String(name).trim();
    else if (firstName || lastName) {
      updateFields.name = `${firstName || ""} ${lastName || ""}`.trim();
    }
    if (firstName) updateFields.firstName = String(firstName).trim();
    if (lastName) updateFields.lastName = String(lastName).trim();
    if (email) updateFields.email = String(email).trim().toLowerCase();
    if (phone) updateFields.phone = String(phone).trim();
    if (primaryHub) updateFields.primaryHub = String(primaryHub).trim();
    if (timezone) updateFields.timezone = String(timezone).trim();
    if (typeof twoFactorEnabled === "boolean")
      updateFields.twoFactorEnabled = twoFactorEnabled;
    if (password && String(password).trim().length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.password = hashedPassword;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET All Users
app.get("/users", authMiddleware, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// CREATE New User
app.post("/users", authMiddleware, async (req, res) => {
  try {
    const { name, email, password, role, status, hub } = req.body;
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ message: "Name, email, password, and role are required" });
    }

    const existingUser = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      role: String(role).trim(),
      status: status ? String(status).toLowerCase().trim() : "active",
      hub: hub ? String(hub).trim() : "",
    });

    await newUser.save();
    const userObj = newUser.toObject();
    delete userObj.password;

    return res
      .status(201)
      .json({ message: "User created successfully", user: userObj });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// DELETE User
app.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ message: "User deleted successfully", id: req.params.id });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ── USER MANAGEMENT ENDPOINTS (UPDATE_USER, ACTIVATE_USER, DEACTIVATE_USER) ──
app.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const updateFields = {};
    if (name) updateFields.name = String(name).trim();
    if (email) updateFields.email = String(email).trim().toLowerCase();
    if (role) updateFields.role = String(role).trim();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_USER",
      resource: "User",
      resourceId: updatedUser._id.toString(),
    });

    return res.status(200).json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.patch("/users/:id/status", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { status } = req.body || {};
    let targetStatus = status
      ? String(status).toLowerCase().trim()
      : user.status === "active"
        ? "inactive"
        : "active";

    if (targetStatus !== "active" && targetStatus !== "inactive") {
      return res
        .status(400)
        .json({ message: "Status must be active or inactive" });
    }

    user.status = targetStatus;
    await user.save();

    const action =
      targetStatus === "active" ? "ACTIVATE_USER" : "DEACTIVATE_USER";

    await createAuditLog({
      userId: req.user._id,
      action,
      resource: "User",
      resourceId: user._id.toString(),
    });

    return res.status(200).json({
      message: `User ${targetStatus === "active" ? "activated" : "deactivated"} successfully`,
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.patch("/users/:id/activate", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAuditLog({
      userId: req.user._id,
      action: "ACTIVATE_USER",
      resource: "User",
      resourceId: user._id.toString(),
    });

    return res.status(200).json({ message: "User activated", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.patch("/users/:id/deactivate", authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "inactive" },
      { new: true },
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    await createAuditLog({
      userId: req.user._id,
      action: "DEACTIVATE_USER",
      resource: "User",
      resourceId: user._id.toString(),
    });

    return res.status(200).json({ message: "User deactivated", user });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/shipments", authMiddleware, async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      customerId,
      driverId,
      driverName,
      myShipments,
      vehicleId,
      tripId,
      sortBy = "createdAt",
      sortOrder = "desc",
      pickupDateFrom,
      pickupDateTo,
      expectedDeliveryDateFrom,
      expectedDeliveryDateTo,
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 1000);

    const filter = {};

    // Auto-filter for drivers so they only see their assigned shipments
    if ((req.user && req.user.role === "Driver") || myShipments === "true") {
      const driverRecord = await Driver.findOne({
        $or: [
          { userId: req.user.userId },
          ...(mongosse.Types.ObjectId.isValid(req.user.userId)
            ? [
                { userId: new mongosse.Types.ObjectId(req.user.userId) },
                { _id: new mongosse.Types.ObjectId(req.user.userId) },
              ]
            : []),
        ],
      });
      if (driverRecord?._id) {
        filter.driverName = driverRecord._id;
      } else {
        filter.driverName = new mongosse.Types.ObjectId();
      }
    } else if (driverName && mongosse.Types.ObjectId.isValid(driverName)) {
      filter.driverName = new mongosse.Types.ObjectId(driverName);
    }

    if (search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      const searchOr = [
        { shipmentId: searchRegex },
        { trackingId: searchRegex },
        { senderName: searchRegex },
        { senderPhoneNumber: searchRegex },
        { receiverName: searchRegex },
        { receiverPhoneNumber: searchRegex },
        { pickupAddress: searchRegex },
        { deliveryAddress: searchRegex },
        { packageDescription: searchRegex },
        { vehicleId: searchRegex },
        { tripId: searchRegex },
      ];
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: searchOr });
    }

    if (status) {
      const statuses = status
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (statuses.length === 1) {
        filter.status = statuses[0];
      } else if (statuses.length > 1) {
        filter.status = {
          $in: statuses,
        };
      }
    }

    if (customerId) {
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        filter.customerId = customerId;
      } else {
        const customer = await Customer.findOne({
          $or: [
            { customerId: customerId },
            ...(!isNaN(customerId) ? [{ customerId: Number(customerId) }] : []),
          ],
        });

        if (!customer) {
          return res.status(200).json({
            message: "Shipment list fetched successfully",
            shipments: [],
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalRecords: 0,
              limit,
            },
          });
        }

        filter.customerId = customer._id;
      }
    }

    if (driverId) {
      if (!mongoose.Types.ObjectId.isValid(driverId)) {
        return res.status(400).json({
          message: "Invalid driverId",
        });
      }

      filter.driverId = driverId;
    }

    if (vehicleId) {
      filter.vehicleId = new RegExp(vehicleId.trim(), "i");
    }

    if (tripId) {
      filter.tripId = new RegExp(tripId.trim(), "i");
    }

    if (pickupDateFrom || pickupDateTo) {
      filter.pickupDate = {};

      if (pickupDateFrom) {
        filter.pickupDate.$gte = new Date(pickupDateFrom);
      }

      if (pickupDateTo) {
        const endDate = new Date(pickupDateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.pickupDate.$lte = endDate;
      }
    }

    if (expectedDeliveryDateFrom || expectedDeliveryDateTo) {
      filter.expectedDeliveryDate = {};

      if (expectedDeliveryDateFrom) {
        filter.expectedDeliveryDate.$gte = new Date(expectedDeliveryDateFrom);
      }

      if (expectedDeliveryDateTo) {
        const endDate = new Date(expectedDeliveryDateTo);
        endDate.setHours(23, 59, 59, 999);
        filter.expectedDeliveryDate.$lte = endDate;
      }
    }

    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "shipmentId",
      "trackingId",
      "pickupDate",
      "expectedDeliveryDate",
      "status",
      "packageCount",
      "totalWeight",
    ];

    if (!allowedSortFields.includes(sortBy)) {
      sortBy = "createdAt";
    }

    sortOrder = sortOrder.toLowerCase() === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const totalRecords = await Shipment.countDocuments(filter);

    const shipments = await Shipment.find(filter)
      .populate("customerId")
      .populate("tripNo")
      .populate("vehicleNo")
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit)
      .lean();

    let enrichedShipments = shipments;
    try {
      const drivers = await Driver.find().populate("userId", "name").lean();
      const driverMap = new Map();
      drivers.forEach((d) => {
        const info = {
          _id: d._id.toString(),
          driverId: d.driverId,
          name: d.userId?.name || d.name || "Driver",
        };
        driverMap.set(d._id.toString(), info);
        if (d.driverId) driverMap.set(d.driverId, info);
      });

      const vechiles = await Vechile.find().lean();
      const vehicleMap = new Map();
      vechiles.forEach((v) => {
        const vName =
          v.vmodel || v.vehicleName || v.model || v.vregistrationnumber || "";
        const reg = v.vregistrationnumber || v.registrationNumber || "";
        const info = {
          ...v,
          _id: v._id.toString(),
          vehicleName: vName,
          registrationNumber: reg,
        };
        if (v._id) vehicleMap.set(v._id.toString(), info);
        if (v.vregistrationnumber) vehicleMap.set(v.vregistrationnumber, info);
      });

      enrichedShipments = shipments.map((s) => {
        let driverData = {};
        if (s.driverName) {
          const key = s.driverName.toString();
          if (driverMap.has(key)) {
            const dInfo = driverMap.get(key);
            driverData = {
              driverId: s.driverId || dInfo.driverId,
              driverDetails: dInfo,
            };
          }
        }

        let vehicleData = {};
        const vRef = s.vehicleNo || s.tripNo?.vehicleId;
        if (vRef) {
          if (typeof vRef === "object" && vRef !== null) {
            vehicleData = {
              vehicleNo: {
                ...vRef,
                vehicleName:
                  vRef.vmodel ||
                  vRef.vehicleName ||
                  vRef.model ||
                  vRef.vregistrationnumber ||
                  "",
                registrationNumber:
                  vRef.vregistrationnumber || vRef.registrationNumber || "",
              },
            };
          } else {
            const vKey = vRef.toString();
            if (vehicleMap.has(vKey)) {
              vehicleData = {
                vehicleNo: vehicleMap.get(vKey),
              };
            }
          }
        }

        const originVal =
          s.origin || s.tripNo?.origin || s.senderCity || s.senderAddress || "";
        const destVal =
          s.destination ||
          s.tripNo?.destination ||
          s.receiverCity ||
          s.receiverAddress ||
          "";
        return {
          ...s,
          ...driverData,
          ...vehicleData,
          origin: originVal,
          destination: destVal,
          pickupAddress: s.pickupAddress || s.senderAddress || originVal,
          deliveryAddress: s.deliveryAddress || s.receiverAddress || destVal,
        };
      });
    } catch (driverErr) {
      console.warn(
        "Could not enrich shipments with driver or vehicle info:",
        driverErr,
      );
    }

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      message: "Shipment list fetched successfully",
      shipments: enrichedShipments,
      pagination: {
        currentPage: page,
        totalPages,
        totalRecords,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: {
        search,
        status,
        customerId,
        driverId,
        vehicleId,
        tripId,
        pickupDateFrom,
        pickupDateTo,
        expectedDeliveryDateFrom,
        expectedDeliveryDateTo,
      },
      sorting: {
        sortBy,
        sortOrder: sortOrder === 1 ? "asc" : "desc",
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch shipments",
      error: error.message,
    });
  }
});

app.get("/customers/:id/shipments", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    let customer = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id);
    }
    if (!customer) {
      customer = await Customer.findOne({
        $or: [
          { customerId: id },
          ...(!isNaN(id) ? [{ customerId: Number(id) }] : []),
        ],
      });
    }

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    let { page = 1, limit = 100, status, search = "" } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    const filter = {
      customerId: customer._id,
    };

    if (status && status !== "All") {
      filter.status = new RegExp(status.trim().replace(/_/g, " "), "i");
    }

    if (search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$and = [
        {
          $or: [
            { shipmentId: searchRegex },
            { trackingId: searchRegex },
            { receiverName: searchRegex },
            { deliveryAddress: searchRegex },
          ],
        },
      ];
    }

    const totalRecords = await Shipment.countDocuments(filter);

    const shipments = await Shipment.find(filter)
      .populate("customerId")
      .populate({
        path: "driverName",
        populate: { path: "userId", select: "name email phonenumber" },
      })
      .populate("vehicleNo")
      .sort({
        createdAt: -1,
      })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      message: "Customer shipment history fetched successfully",
      customer,
      shipments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRecords / limit),
        totalRecords,
        limit,
      },
    });
  } catch (error) {
    console.error("GET CUSTOMER SHIPMENTS ERROR:", error);
    return res.status(500).json({
      message: "Failed to fetch customer shipment history",
      error: error.message,
    });
  }
});

app.put("/shipments/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "senderName",
      "senderPhoneNumber",
      "senderEmail",
      "senderAddress",
      "senderCity",
      "senderState",
      "senderpincode",
      "receiverName",
      "receiverPhoneNumber",
      "receiverEmail",
      "receiverAddress",
      "receiverCity",
      "receiverState",
      "receiverpincode",
      "packageCount",
      "totalWeight",
      "dimensions",
      "packageDescription",
      "priority",
      "driverName",
      "vehicleNo",
      "tripNo",
      "pickupDate",
      "expectedDeliveryDate",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Support common aliases
    if (
      req.body.senderPhone !== undefined &&
      updates.senderPhoneNumber === undefined
    ) {
      updates.senderPhoneNumber = req.body.senderPhone;
    }
    if (
      req.body.receiverPhone !== undefined &&
      updates.receiverPhoneNumber === undefined
    ) {
      updates.receiverPhoneNumber = req.body.receiverPhone;
    }
    if (
      req.body.pickupAddress !== undefined &&
      updates.senderAddress === undefined
    ) {
      updates.senderAddress = req.body.pickupAddress;
    }
    if (
      req.body.deliveryAddress !== undefined &&
      updates.receiverAddress === undefined
    ) {
      updates.receiverAddress = req.body.deliveryAddress;
    }
    if (req.body.count !== undefined && updates.packageCount === undefined) {
      updates.packageCount = Number(req.body.count);
    }
    if (req.body.weightKg !== undefined && updates.totalWeight === undefined) {
      updates.totalWeight = Number(req.body.weightKg);
    }
    if (
      req.body.description !== undefined &&
      updates.packageDescription === undefined
    ) {
      updates.packageDescription = req.body.description;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update",
      });
    }

    let shipment;

    if (mongosse.Types.ObjectId.isValid(id)) {
      shipment = await Shipment.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).populate("customerId", "customerId name email");
    } else {
      shipment = await Shipment.findOneAndUpdate(
        {
          $or: [{ shipmentId: id }, { trackingId: id }],
        },
        updates,
        { new: true, runValidators: true },
      ).populate("customerId", "customerId name email");
    }

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    return res.status(200).json({
      message: "Shipment updated successfully",
      shipment,
    });
  } catch (error) {
    console.error("UPDATE SHIPMENT ERROR:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
});

app.patch("/shipments/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let { status } = req.body;

    const validStatuses = [
      "created",
      "pickup_scheduled",
      "picked_up",
      "at_warehouse",
      "dispatched",
      "in_transit",
      "out_for_delivery",
      "delivered",
      "failed_delivery",
    ];

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    if (typeof status === "string") {
      status = status.trim().toLowerCase().replace(/\s+/g, "_");
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid shipment status",
      });
    }

    let shipment;

    if (mongosse.Types.ObjectId.isValid(id)) {
      shipment = await Shipment.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true },
      ).populate("customerId", "customerId name email");
    } else {
      shipment = await Shipment.findOneAndUpdate(
        {
          $or: [{ shipmentId: id }, { trackingId: id }],
        },
        { status },
        { new: true, runValidators: true },
      ).populate("customerId", "customerId name email");
    }

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    await ShipmentStatusHistory.create({
      shipmentId: shipment._id,
      status: shipment.status,
    });

    if (shipment.status === "out_for_delivery") {
      await Delivery.findOneAndUpdate(
        { shipmentId: shipment._id },
        {
          $set: {
            status: "out_for_delivery",
          },
          $unset: {
            deliveredAt: "",
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    if (shipment.status === "delivered") {
      await Delivery.findOneAndUpdate(
        { shipmentId: shipment._id },
        {
          $set: {
            status: "delivered",
            deliveredAt: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    if (shipment.status === "failed_delivery") {
      await Delivery.findOneAndUpdate(
        { shipmentId: shipment._id },
        {
          $set: {
            status: "failed",
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );
    }

    const senderEmail = shipment.senderEmail;

    const senderName = shipment.senderName;

    const shipmentNumber = shipment.shipmentId;

    const shipmentStatus = shipment.status;

    const estimateDeliveryDate = shipment.expectedDeliveryDate;

    const trackingNumber = shipment.trackingId;

    const sendMail = await sendShipmentStatusUpdate(
      senderEmail,
      senderName,
      shipmentNumber,
      shipmentStatus,
      estimateDeliveryDate,
      trackingNumber,
    );

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_SHIPMENT_STATUS",
      resource: "Shipment",
      resourceId: shipment._id.toString(),
    });

    let notifType = "Shipment Status Updated";
    if (shipment.status === "picked_up") notifType = "Pickup Completed";
    else if (shipment.status === "dispatched")
      notifType = "Shipment Dispatched";
    else if (shipment.status === "out_for_delivery")
      notifType = "Out for Delivery";
    else if (shipment.status === "delivered") notifType = "Delivered";
    else if (shipment.status === "failed_delivery")
      notifType = "Failed Delivery";

    const formattedStatusText = shipment.status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    await createNotificationSystem({
      userId: req.user?._id || null,
      type: notifType,
      message: `Shipment ${shipment.trackingId || shipment.shipmentId} status updated to ${formattedStatusText}.`,
      shipmentId: shipment.shipmentId,
      referenceId: shipment.trackingId,
    });

    if (shipment.status === "delivered") {
      await createAuditLog({
        userId: req.user._id,
        action: "DELIVERY_COMPLETED",
        resource: "Delivery",
        resourceId: shipment._id.toString(),
      });
    } else if (shipment.status === "failed_delivery") {
      await createAuditLog({
        userId: req.user._id,
        action: "DELIVERY_FAILED",
        resource: "Delivery",
        resourceId: shipment._id.toString(),
      });
    }

    return res.status(200).json({
      message: "Shipment status updated successfully",
      shipment,
    });
  } catch (error) {
    console.error("UPDATE SHIPMENT STATUS ERROR:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
});

async function generateShipmentId() {
  let shipmentId;
  let exists = true;

  while (exists) {
    shipmentId = `SHP-${Math.floor(100000 + Math.random() * 900000)}`;

    const existingShipment = await Shipment.findOne({
      shipmentId,
    });

    exists = !!existingShipment;
  }

  return shipmentId;
}

async function generateTrackingId() {
  let trackingId;
  let exists = true;

  while (exists) {
    trackingId = `TRK-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const existingShipment = await Shipment.findOne({
      trackingId,
    });

    exists = !!existingShipment;
  }

  return trackingId;
}

app.post("/createshipment", authMiddleware, async (req, res) => {
  const {
    // Customer identifier – can be a name string or numeric customerId
    customerId,

    // Sender
    senderName,
    senderPhoneNumber, // frontend name
    senderEmail,
    senderAddress,
    senderCity,
    senderState,
    senderPincode,

    // Receiver
    receiverName,
    receiverPhoneNumber, // frontend name
    receiverEmail,
    receiverAddress,
    receiverCity,
    receiverState,
    receiverPincode,

    // Package
    description, // frontend name for packageDescription
    count, // frontend name for packageCount
    weightKg, // frontend name for totalWeight
    lengthCm, // frontend name for dimensions.length
    widthCm, // frontend name for dimensions.width
    heightCm, // frontend name for dimensions.height
    declaredValue,

    // Dates
    pickupDate,
    expectedDeliveryDate,

    // Optional
    priority = "Standard",
    driverName,
    vehicleNo,
    tripNo,
  } = req.body;

  try {
    // ── Validate required sender info ──────────────────────────────────────────
    if (!senderName || !senderPhoneNumber || !senderAddress) {
      return res.status(400).json({
        message: "Sender name, phone and address are required",
      });
    }

    // ── Validate required receiver info ────────────────────────────────────────
    if (!receiverName || !receiverPhoneNumber || !receiverAddress) {
      return res.status(400).json({
        message: "Receiver name, phone and address are required",
      });
    }

    // ── Validate package fields ────────────────────────────────────────────────
    const parsedCount = Number(count);
    if (!count || parsedCount < 1 || !Number.isInteger(parsedCount)) {
      return res.status(400).json({
        message: "Package count must be a whole number of at least 1",
      });
    }

    const parsedWeight = Number(weightKg);
    if (weightKg === undefined || weightKg === null || parsedWeight < 0) {
      return res.status(400).json({
        message: "Total weight must be 0 or greater",
      });
    }

    const parsedLength = Number(lengthCm);
    const parsedWidth = Number(widthCm);
    const parsedHeight = Number(heightCm);

    if (isNaN(parsedLength) || isNaN(parsedWidth) || isNaN(parsedHeight)) {
      return res.status(400).json({
        message: "Length, width and height are required",
      });
    }

    if (!description) {
      return res.status(400).json({
        message: "Package description is required",
      });
    }

    if (!pickupDate || !expectedDeliveryDate) {
      return res.status(400).json({
        message: "Pickup date and expected delivery date are required",
      });
    }

    const validPriorities = ["Standard", "Express", "Same Day", "Overnight"];
    let normalizedPriority = "Standard";
    if (priority) {
      const match = validPriorities.find(
        (p) => p.toLowerCase() === String(priority).trim().toLowerCase(),
      );
      if (match) {
        normalizedPriority = match;
      } else {
        return res.status(400).json({
          message: "Priority must be Standard, Express, Same Day or Overnight",
        });
      }
    }

    // ── Look up customer ───────────────────────────────────────────────────────
    // customerId can be Mongo _id, customerId (e.g. CUST-140015), or company/person name
    let customer = null;

    if (customerId) {
      const trimmedCustomerId = String(customerId).trim();

      // 1. Try Mongo _id
      if (mongosse.Types.ObjectId.isValid(trimmedCustomerId)) {
        customer = await Customer.findById(trimmedCustomerId);
      }

      // 2. Try customerId (e.g. CUST-140015 or numeric)
      if (!customer) {
        customer = await Customer.findOne({
          $or: [
            { customerId: trimmedCustomerId },
            { customerId: trimmedCustomerId.toUpperCase() },
            ...(!isNaN(trimmedCustomerId)
              ? [{ customerId: Number(trimmedCustomerId) }]
              : []),
          ],
        });
      }

      // 3. Try customer name lookup (case-insensitive exact)
      if (!customer) {
        customer = await Customer.findOne({
          name: new RegExp(
            `^${trimmedCustomerId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "i",
          ),
        });
      }

      // 4. Try customer name partial match
      if (!customer) {
        customer = await Customer.findOne({
          name: new RegExp(
            trimmedCustomerId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "i",
          ),
        });
      }
    }

    if (!customer) {
      return res.status(404).json({
        message: customerId
          ? `Customer "${customerId}" not found. Please use the registered customer name or numeric customer ID.`
          : "Customer identifier is required",
      });
    }

    // ── Generate IDs ───────────────────────────────────────────────────────────
    const shipmentId = await generateShipmentId();
    const trackingId = await generateTrackingId();

    // ── Save shipment ──────────────────────────────────────────────────────────
    const newShipment = new Shipment({
      shipmentId,
      trackingId,
      customerId: customer._id,

      // Sender — map frontend names → schema names
      senderName: String(senderName).trim(),
      senderPhoneNumber: String(senderPhoneNumber).trim(),
      senderEmail: String(senderEmail || "").trim(),
      senderAddress: String(senderAddress).trim(),
      senderCity: String(senderCity || "").trim(),
      senderState: String(senderState || "").trim(),
      senderpincode: Number(senderPincode) || 0,

      // Receiver
      receiverName: String(receiverName).trim(),
      receiverPhoneNumber: String(receiverPhoneNumber).trim(),
      receiverEmail: String(receiverEmail || "").trim(),
      receiverAddress: String(receiverAddress).trim(),
      receiverCity: String(receiverCity || "").trim(),
      receiverState: String(receiverState || "").trim(),
      receiverpincode: Number(receiverPincode) || 0,

      // Package
      packageCount: parsedCount,
      totalWeight: parsedWeight,
      dimensions: {
        length: parsedLength,
        width: parsedWidth,
        height: parsedHeight,
      },
      packageDescription: String(description).trim(),
      declaredValue: Number(declaredValue) || 0,

      // Dates
      pickupDate: new Date(pickupDate),
      expectedDeliveryDate: new Date(expectedDeliveryDate),

      // Misc
      priority: normalizedPriority,
      driverName: null,
      vehicleNo: null,
      tripNo: null,
      status: "created",
    });

    await newShipment.save();

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE_SHIPMENT",
      resource: "Shipment",
      resourceId: newShipment._id.toString(),
    });

    await createNotificationSystem({
      userId: req.user?._id || null,
      type: "Shipment Created",
      message: `Shipment ${newShipment.trackingId || newShipment.shipmentId} created for ${customer?.name || senderName || "Customer"}.`,
      shipmentId: newShipment.shipmentId,
      referenceId: newShipment.trackingId,
    });

    await newShipment.populate("customerId");

    const shipmentObj = newShipment.toObject
      ? newShipment.toObject()
      : newShipment;
    shipmentObj.customerName =
      newShipment.customerId?.name || customer?.name || "";
    shipmentObj.origin =
      shipmentObj.origin ||
      shipmentObj.senderCity ||
      shipmentObj.senderAddress ||
      "";
    shipmentObj.destination =
      shipmentObj.destination ||
      shipmentObj.receiverCity ||
      shipmentObj.receiverAddress ||
      "";
    shipmentObj.pickupAddress =
      shipmentObj.pickupAddress || shipmentObj.senderAddress || "";
    shipmentObj.deliveryAddress =
      shipmentObj.deliveryAddress || shipmentObj.receiverAddress || "";

    return res.status(201).json({
      message: "Shipment created successfully",
      shipment: shipmentObj,
    });
  } catch (error) {
    console.error("CREATE SHIPMENT ERROR:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
});

const shipmentStatusHistorySchema = new mongosse.Schema(
  {
    shipmentId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "shipments",
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
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    updatedBy: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const ShipmentStatusHistory = mongosse.model(
  "shipmentStatusHistory",
  shipmentStatusHistorySchema,
);

app.get("/shipments/:id/timeline", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    let shipment;

    if (mongosse.Types.ObjectId.isValid(id)) {
      shipment = await Shipment.findById(id);
    } else {
      shipment = await Shipment.findOne({
        $or: [{ shipmentId: id }, { trackingId: id }],
      });
    }

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const timeline = await ShipmentStatusHistory.find({
      shipmentId: shipment._id,
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      message: "Shipment status timeline fetched successfully",
      result: {
        shipmentId: shipment.shipmentId,
        trackingId: shipment.trackingId,
        currentStatus: shipment.status,
        timeline,
      },
    });
  } catch (error) {
    console.error("GET SHIPMENT TIMELINE ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

const shipmentDocumentSchema = new mongosse.Schema(
  {
    shipmentId: {
      type: mongosse.Schema.Types.ObjectId,
      ref: "shipments",
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: false,
    },
    url: {
      type: String,
      required: true,
    },
    documentUrl: {
      type: String,
      default: function () {
        return this.url;
      },
    },
    publicId: {
      type: String,
      default: "",
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const ShipmentDocument = mongosse.model(
  "shipmentDocument",
  shipmentDocumentSchema,
);

const shipmentImportSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
    },

    fileName: {
      type: String,
      required: true,
    },

    fileType: {
      type: String,
      required: true,
    },

    totalRecords: {
      type: Number,
      default: 0,
    },

    successfulRecords: {
      type: Number,
      default: 0,
    },

    failedRecords: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["completed", "completed_with_errors", "failed"],
      default: "completed",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const ShipmentImport = mongoose.model("shipmentImport", shipmentImportSchema);

const shipmentImportFailureSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      index: true,
    },

    rowNumber: {
      type: Number,
      required: true,
    },

    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    errors: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

const ShipmentImportFailure = mongoose.model(
  "shipmentImportFailure",
  shipmentImportFailureSchema,
);

const findShipment = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const shipment = await Shipment.findById(id)
      .populate("customerId")
      .populate("driverId", "name email role status");

    if (shipment) {
      return shipment;
    }
  }

  let shipment = await Shipment.findOne({
    shipmentId: id,
  })
    .populate("customerId")
    .populate("driverId", "name email role status");

  if (shipment) {
    return shipment;
  }

  shipment = await Shipment.findOne({
    trackingId: id,
  })
    .populate("customerId")
    .populate("driverId", "name email role status");

  return shipment;
};

app.post(
  "/shipments/:id/documents",
  authMiddleware,
  upload.single("document"),
  async (req, res) => {
    try {
      const { id } = req.params;

      let shipment;

      if (mongosse.Types.ObjectId.isValid(id)) {
        shipment = await Shipment.findById(id);
      } else {
        shipment = await Shipment.findOne({
          $or: [{ shipmentId: id }, { trackingId: id }],
        });
      }

      if (!shipment) {
        if (req.file) {
          fs.unlinkSync(req.file.path);
        }

        return res.status(404).json({
          message: "Shipment not found",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          message: "Document file is required",
        });
      }

      // 1. Upload to Cloudinary
      const result = await uploadToCloudinary(
        req.file.path || req.file.buffer,
        req.file.originalname,
      );

      const documentUrl = result.secure_url || result.url;

      // 2. Save document record in MongoDB
      const document = new ShipmentDocument({
        shipmentId: shipment._id,
        originalName: req.file.originalname,
        fileName: req.file.filename || path.basename(documentUrl),
        filePath: req.file.path || documentUrl,
        url: documentUrl,
        documentUrl: documentUrl,
        publicId: result.public_id || "",
        mimeType:
          req.file.mimetype || result.format || "application/octet-stream",
        size: req.file.size || result.bytes || 0,
      });

      await document.save();

      // 3. Remove local temporary file after successful Cloudinary upload
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.warn("Failed to delete temp file:", unlinkErr.message);
        }
      }

      return res.status(201).json({
        message: "Shipment document uploaded to Cloudinary successfully",
        document,
      });
    } catch (error) {
      console.error("UPLOAD SHIPMENT DOCUMENT ERROR:", error);

      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkErr) {
          console.warn(
            "Failed to delete temp file on error:",
            unlinkErr.message,
          );
        }
      }

      return res.status(500).json({
        message: error.message || "Internal server error",
      });
    }
  },
);

app.get("/shipments/:id/documents", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    let shipment;

    if (mongosse.Types.ObjectId.isValid(id)) {
      shipment = await Shipment.findById(id);
    } else {
      shipment = await Shipment.findOne({
        $or: [{ shipmentId: id }, { trackingId: id }],
      });
    }

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const documents = await ShipmentDocument.find({
      shipmentId: shipment._id,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Shipment documents fetched successfully",
      shipmentId: shipment.shipmentId,
      trackingId: shipment.trackingId,
      documents,
    });
  } catch (error) {
    console.error("GET SHIPMENT DOCUMENTS ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.get("/shipments/:id", authMiddleware, async (req, res) => {
  try {
    const shipment = await findShipment(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    const timeline = await ShipmentStatusHistory.find({
      shipmentId: shipment._id,
    }).sort({
      createdAt: 1,
    });

    const documents = await ShipmentDocument.find({
      shipmentId: shipment._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      message: "Shipment details fetched successfully",
      shipment,
      timeline,
      documents,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch shipment details",
      error: error.message,
    });
  }
});

app.get(
  ["/shipments/:id/documents/:documentId", "/documents/:documentId"],
  authMiddleware,
  async (req, res) => {
    try {
      const document = await ShipmentDocument.findById(req.params.documentId);

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      // If document is stored in Cloudinary
      if (
        document.url &&
        (document.publicId || document.url.includes("cloudinary.com"))
      ) {
        // Extract publicId if not saved on model
        let publicId = document.publicId;
        if (!publicId && document.url.includes("/upload/")) {
          const parts = document.url.split("/upload/");
          if (parts[1]) {
            const rawPath = parts[1].replace(/^v\d+\//, ""); // strip version tag like v1791201747/
            publicId = rawPath.replace(/\.[^/.]+$/, ""); // strip extension
          }
        }

        const isPdf =
          (document.mimeType &&
            document.mimeType.toLowerCase().includes("pdf")) ||
          (document.originalName &&
            document.originalName.toLowerCase().endsWith(".pdf")) ||
          (document.url && document.url.toLowerCase().endsWith(".pdf"));

        const dispositionType =
          req.query.download === "true" ? "attachment" : "inline";
        const filename = document.originalName || "document.pdf";

        let downloadUrl = document.url;
        if (publicId) {
          try {
            downloadUrl = cloudinary.utils.private_download_url(
              publicId,
              isPdf ? "pdf" : document.url.split(".").pop() || "pdf",
              {
                resource_type: "image",
                type: "upload",
                expires_at: Math.floor(Date.now() / 1000) + 3600,
              },
            );
          } catch (e) {
            console.warn("Failed to generate private download URL:", e.message);
          }
        }

        // Stream file directly to client with appropriate content headers
        return https
          .get(downloadUrl, (cloudRes) => {
            if (cloudRes.statusCode >= 200 && cloudRes.statusCode < 300) {
              res.setHeader(
                "Content-Type",
                document.mimeType ||
                  (isPdf
                    ? "application/pdf"
                    : cloudRes.headers["content-type"] ||
                      "application/octet-stream"),
              );
              res.setHeader(
                "Content-Disposition",
                `${dispositionType}; filename="${encodeURIComponent(filename)}"`,
              );
              if (cloudRes.headers["content-length"]) {
                res.setHeader(
                  "Content-Length",
                  cloudRes.headers["content-length"],
                );
              }
              return cloudRes.pipe(res);
            }

            // Fallback: if streaming failed or Cloudinary status not 200, try raw redirect
            return res.redirect(document.url);
          })
          .on("error", (streamErr) => {
            console.error("Cloudinary stream error:", streamErr);
            return res.redirect(document.url);
          });
      }

      if (document.filePath) {
        const filePath = path.resolve(document.filePath);
        if (fs.existsSync(filePath)) {
          if (req.query.download === "true") {
            return res.download(filePath, document.originalName);
          }
          return res.sendFile(filePath);
        }
      }

      return res.status(404).json({
        message: "Document file not found",
      });
    } catch (error) {
      console.error("DOWNLOAD/VIEW SHIPMENT DOCUMENT ERROR:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  },
);

app.patch("/shipments/:id/assign-driver", authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.body;

    if (!driverId) {
      return res.status(400).json({
        message: "driverId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(driverId)) {
      return res.status(400).json({
        message: "Invalid driverId",
      });
    }

    const driver = await User.findById(driverId);

    if (!driver) {
      return res.status(404).json({
        message: "Driver not found",
      });
    }

    if (driver.role !== "griver") {
      return res.status(400).json({
        message: "Selected user is not a driver",
      });
    }

    if (driver.status !== "active") {
      return res.status(400).json({
        message: "Driver is inactive",
      });
    }

    const shipment = await findShipment(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    shipment.driverId = driver._id;

    await shipment.save();

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_SHIPMENT",
      resource: "Shipment",
      resourceId: shipment._id.toString(),
    });

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_DRIVER",
      resource: "Driver",
      resourceId: driver._id.toString(),
    });

    await createNotificationSystem({
      userId: req.user?._id || null,
      type: "Driver Assigned",
      message: `Driver ${driver.name || "assigned"} assigned to Shipment ${shipment.trackingId || shipment.shipmentId}.`,
      shipmentId: shipment.shipmentId,
      referenceId: shipment.trackingId,
    });

    const updatedShipment = await Shipment.findById(shipment._id)
      .populate("customerId")
      .populate("driverId", "name email role status");

    res.status(200).json({
      message: "Driver assigned successfully",
      shipment: updatedShipment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign driver",
      error: error.message,
    });
  }
});

app.patch("/shipments/:id/assign-vehicle", authMiddleware, async (req, res) => {
  try {
    const { vehicleId } = req.body;

    if (
      vehicleId === undefined ||
      vehicleId === null ||
      String(vehicleId).trim() === ""
    ) {
      return res.status(400).json({
        message: "vehicleId is required",
      });
    }

    const shipment = await findShipment(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    shipment.vehicleId = String(vehicleId).trim();

    await shipment.save();

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_SHIPMENT",
      resource: "Shipment",
      resourceId: shipment._id.toString(),
    });

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_VEHICLE",
      resource: "Vehicle",
      resourceId: String(vehicleId).trim(),
    });

    res.status(200).json({
      message: "Vehicle assigned successfully",
      shipment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign vehicle",
      error: error.message,
    });
  }
});

app.patch("/shipments/:id/assign-trip", authMiddleware, async (req, res) => {
  try {
    const { tripId } = req.body;

    if (
      tripId === undefined ||
      tripId === null ||
      String(tripId).trim() === ""
    ) {
      return res.status(400).json({
        message: "tripId is required",
      });
    }

    const shipment = await findShipment(req.params.id);

    if (!shipment) {
      return res.status(404).json({
        message: "Shipment not found",
      });
    }

    shipment.tripId = String(tripId).trim();

    await shipment.save();

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_SHIPMENT",
      resource: "Shipment",
      resourceId: shipment._id.toString(),
    });

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_TRIP",
      resource: "Trip",
      resourceId: String(tripId).trim(),
    });

    res.status(200).json({
      message: "Trip assigned successfully",
      shipment,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to assign trip",
      error: error.message,
    });
  }
});

app.post(
  "/shipments/import",
  authMiddleware,
  importUpload.single("file"),
  processShipmentImport,
);

app.post(
  "/shipments/import/csv",
  authMiddleware,
  importUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "CSV file is required",
        });
      }

      const fileType = getFileType(req.file.originalname);

      if (fileType !== "csv") {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Only CSV files are allowed",
        });
      }

      return processShipmentImport(req, res);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        message: "CSV import failed",
        error: error.message,
      });
    }
  },
);

app.post(
  "/shipments/import/excel",
  authMiddleware,
  importUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          message: "Excel file is required",
        });
      }

      const fileType = getFileType(req.file.originalname);

      if (fileType !== "excel") {
        fs.unlinkSync(req.file.path);

        return res.status(400).json({
          message: "Only XLS and XLSX files are allowed",
        });
      }

      return processShipmentImport(req, res);
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        message: "Excel import failed",
        error: error.message,
      });
    }
  },
);

app.get(
  "/shipments/import/:batchId/failed",
  authMiddleware,
  async (req, res) => {
    try {
      const importRecord = await ShipmentImport.findOne({
        batchId: req.params.batchId,
      });

      if (!importRecord) {
        return res.status(404).json({
          message: "Import batch not found",
        });
      }

      const failedRecords = await ShipmentImportFailure.find({
        batchId: req.params.batchId,
      }).sort({
        rowNumber: 1,
      });

      res.status(200).json({
        message: "Failed import records fetched successfully",
        batchId: req.params.batchId,
        failedRecords,
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch import records",
        error: error.message,
      });
    }
  },
);

app.get(
  "/shipments/import/:batchId/summary",
  authMiddleware,
  async (req, res) => {
    try {
      const importRecord = await ShipmentImport.findOne({
        batchId: req.params.batchId,
      });

      if (!importRecord) {
        return res.status(404).json({
          message: "Import batch not found",
        });
      }

      const failedRecords = await ShipmentImportFailure.countDocuments({
        batchId: req.params.batchId,
      });

      res.status(200).json({
        message: "Import summary fetched successfully",
        summary: {
          batchId: importRecord.batchId,
          fileName: importRecord.fileName,
          fileType: importRecord.fileType,
          totalRecords: importRecord.totalRecords,
          successfulRecords: importRecord.successfulRecords,
          failedRecords,
          status: importRecord.status,
          createdAt: importRecord.createdAt,
          updatedAt: importRecord.updatedAt,
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Failed to fetch import summary",
        error: error.message,
      });
    }
  },
);

//DRIVER

//profile setup by role driver
app.patch("/setup-driverprofile", authMiddleware, async (req, res) => {
  const { phonenumber, licensenumber, expiredate } = req.body;

  const userId = req.user.userId;

  try {
    if (!phonenumber || !licensenumber || !expiredate) {
      return res.status(400).json({
        message:
          "Mobile phone number, license number, and expiry date are required",
      });
    }

    const cleanPhone = String(phonenumber).replace(/\D/g, "").slice(-10);
    const phoneError = validatePhone(cleanPhone);

    if (phoneError) {
      return res.status(400).json({
        message: phoneError,
      });
    }

    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    const checkexistlicense = await Driver.findOne({
      "license.licensenumber": String(licensenumber).trim(),
      $and: [
        { userId: { $ne: userId } },
        ...(userIdObj ? [{ userId: { $ne: userIdObj } }] : []),
      ],
    });

    if (checkexistlicense) {
      return res.status(400).json({ message: "License Number Already Exist" });
    }

    let existDriver = await Driver.findOne({
      $or: [
        { userId: userId },
        ...(userIdObj ? [{ userId: userIdObj }] : []),
        ...(userIdObj ? [{ _id: userIdObj }] : []),
      ],
    });

    if (!existDriver) {
      const newDriverId = await generateDriverId();
      existDriver = new Driver({
        userId: userIdObj || userId,
        driverId: newDriverId,
      });
    }

    existDriver.phonenumber = cleanPhone;
    if (!existDriver.license) existDriver.license = {};
    existDriver.license.licensenumber = String(licensenumber).trim();
    existDriver.license.expiredate = new Date(expiredate);

    const isNewDriver = !existDriver._id || existDriver.isNew;

    await existDriver.save();

    await createAuditLog({
      userId: req.user._id,
      action: isNewDriver ? "CREATE_DRIVER" : "UPDATE_DRIVER",
      resource: "Driver",
      resourceId: existDriver._id.toString(),
    });

    res.status(200).json({
      message: "Profile Complete",
      driver: {
        _id: existDriver._id,
        driverId: existDriver.driverId,
        phonenumber: existDriver.phonenumber,
        license: existDriver.license,
        status: existDriver.status || "active",
        availability: existDriver.availability || "available",
        isProfileComplete: true,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current driver profile
app.get("/driver/profile", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    let driver = await Driver.findOne({
      $or: [
        { userId: userId },
        ...(userIdObj ? [{ userId: userIdObj }] : []),
        ...(userIdObj ? [{ _id: userIdObj }] : []),
      ],
    });

    if (!driver && user && user.role && user.role.toLowerCase() === "driver") {
      const newDriverId = await generateDriverId();
      driver = new Driver({
        userId: user._id,
        driverId: newDriverId,
      });
      await driver.save();
    }

    if (!driver) {
      return res.status(404).json({ message: "Driver record not found" });
    }

    const isComplete = Boolean(
      driver.phonenumber &&
      driver.license?.licensenumber &&
      driver.license?.expiredate,
    );

    res.status(200).json({
      user: {
        userId: user?._id,
        name: user?.name,
        email: user?.email,
        role: user?.role,
        driverId: driver.driverId,
        phonenumber: driver.phonenumber || "",
      },
      driver: {
        _id: driver._id,
        driverId: driver.driverId,
        name: user?.name || "",
        phonenumber: driver.phonenumber || "",
        license: {
          licensenumber: driver.license?.licensenumber || "",
          expiredate: driver.license?.expiredate || null,
        },
        status: driver.status,
        availability: driver.availability,
        isProfileComplete: isComplete,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//driver management
// app.get("/drivers", authMiddleware, async (req, res) => {
//   try {
//     const getdriver = await Driver.find().populate("userId", "name email role");

//     res.status(200).json(getdriver);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

//show driver name in create shipment form
app.get("/drivernames", authMiddleware, async (req, res) => {
  try {
    let getdriver = await Driver.find({
      status: "active",
      availability: "available",
    })
      .select("driverId userId availability")
      .populate("userId", "name");

    if (!getdriver || getdriver.length === 0) {
      getdriver = await Driver.find({ status: "active" })
        .select("driverId userId availability")
        .populate("userId", "name");
    }

    if (!getdriver || getdriver.length === 0) {
      getdriver = await Driver.find()
        .select("driverId userId availability")
        .populate("userId", "name");
    }

    const result = getdriver.map((driver) => ({
      _id: driver._id,
      driverId: driver.driverId,
      name: driver.userId?.name || "Driver",
      availability: driver.availability || "available",
    }));

    res.status(200).json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get shipments assigned specifically to the logged-in driver
app.get("/driver/myshipments", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get logged-in user
    const user = await User.findById(userId);

    // Get Driver document belonging to this user
    const userIdObj = mongoose.Types.ObjectId.isValid(userId)
      ? new mongoose.Types.ObjectId(userId)
      : null;

    let driver = await Driver.findOne({
      $or: [
        { userId: userId },
        ...(userIdObj ? [{ userId: userIdObj }] : []),
        ...(userIdObj ? [{ _id: userIdObj }] : []),
      ],
    });

    if (!driver && user && user.role && user.role.toLowerCase() === "driver") {
      const newDriverId = await generateDriverId();
      driver = new Driver({
        userId: user._id,
        driverId: newDriverId,
      });
      await driver.save();
    }

    if (!driver) {
      return res.status(404).json({
        message: "Driver profile not found",
        shipments: [],
      });
    }

    const isComplete = Boolean(
      driver.phonenumber &&
      driver.license?.licensenumber &&
      driver.license?.expiredate,
    );

    const driverPayload = {
      driverId: driver.driverId || "",
      name: user?.name || "",
      phonenumber: driver.phonenumber || "",
      license: {
        licensenumber: driver.license?.licensenumber || "",
        expiredate: driver.license?.expiredate || null,
      },
      status: driver.status || "active",
      availability: driver.availability || "available",
      isProfileComplete: isComplete,
    };

    // Since Shipment.driverName contains Driver._id,
    // directly search using the Driver document _id.
    const shipments = await Shipment.find({
      driverName: driver._id,
    })
      .populate("customerId")
      .populate({
        path: "driverName",
        populate: {
          path: "userId",
          select: "name",
        },
      })
      .populate("vehicleNo")
      .populate({
        path: "tripNo",
        populate: {
          path: "vehicleId",
        },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich shipments with vehicle name and details
    let enrichedShipments = shipments;
    try {
      const vechiles = await Vechile.find().lean();
      const vehicleMap = new Map();
      vechiles.forEach((v) => {
        const vName =
          v.vmodel ||
          v.vehicleName ||
          v.model ||
          v.name ||
          v.vregistrationnumber ||
          "";
        const reg = v.vregistrationnumber || v.registrationNumber || "";
        const info = {
          ...v,
          _id: v._id.toString(),
          vehicleName: vName,
          registrationNumber: reg,
        };
        if (v._id) vehicleMap.set(v._id.toString(), info);
        if (v.vregistrationnumber) vehicleMap.set(v.vregistrationnumber, info);
      });

      enrichedShipments = shipments.map((s) => {
        let vehicleData = {};
        const vRef = s.vehicleNo || s.tripNo?.vehicleId;
        if (vRef) {
          if (typeof vRef === "object" && vRef !== null) {
            const vName =
              vRef.vmodel ||
              vRef.vehicleName ||
              vRef.model ||
              vRef.name ||
              vRef.vregistrationnumber ||
              "";
            const reg =
              vRef.vregistrationnumber || vRef.registrationNumber || "";
            vehicleData = {
              vehicleNo: {
                ...vRef,
                vehicleName: vName,
                registrationNumber: reg,
              },
              vehicleName: vName,
              vehiclePlateNumber: reg,
            };
          } else {
            const vKey = vRef.toString();
            if (vehicleMap.has(vKey)) {
              const vInfo = vehicleMap.get(vKey);
              vehicleData = {
                vehicleNo: vInfo,
                vehicleName: vInfo.vehicleName,
                vehiclePlateNumber: vInfo.registrationNumber,
              };
            }
          }
        }
        return {
          ...s,
          ...vehicleData,
        };
      });
    } catch (vehErr) {
      console.warn(
        "Could not enrich driver shipments with vehicle info:",
        vehErr,
      );
    }

    // Enrich with delivery details (failureReason, failureNote, etc.)
    try {
      const shipmentIds = enrichedShipments.map((s) => s._id);
      const deliveries = await Delivery.find({
        shipmentId: { $in: shipmentIds },
      }).lean();
      if (deliveries.length > 0) {
        const delMap = new Map();
        deliveries.forEach((d) => delMap.set(String(d.shipmentId), d));
        enrichedShipments = enrichedShipments.map((s) => {
          const d = delMap.get(String(s._id));
          if (d) {
            const isDelivered =
              s.status === "delivered" || d.status === "delivered";
            return {
              ...s,
              failureReason: isDelivered
                ? ""
                : d.reason || s.failureReason || "",
              failureNote: isDelivered ? "" : d.notes || s.failureNote || "",
              statusNotes: isDelivered ? "" : d.notes || s.statusNotes || "",
              deliveryStatus: d.status || "",
              reattemptDate: isDelivered ? null : d.reattemptDate || null,
              rescheduleDate: isDelivered ? null : d.reattemptDate || null,
              attemptNumber: d.attemptNumber || 1,
            };
          }
          return s;
        });
      }
    } catch (delErr) {
      console.warn("Could not enrich shipments with delivery data:", delErr);
    }

    return res.status(200).json({
      shipments: enrichedShipments,
      driver: driverPayload,
    });
  } catch (error) {
    console.error("GET DRIVER SHIPMENTS ERROR:", error);

    return res.status(500).json({
      message: error.message || "Internal server error",
    });
  }
});

app.get("/customer-landing/:id", async (req, res) => {
  const customerId = req.params.id;

  try {
    const customerf = await Customer.findOne({ customerId });

    if (!customerf) {
      return res.status(400).json({ message: "Customer Not Found" });
    }

    const shipmentf = await Shipment.find({ customerId: customerf._id })
      .populate({
        path: "driverName",
        populate: { path: "userId", select: "name email phonenumber" },
      })
      .populate("vehicleNo")
      .lean();

    if (!shipmentf) {
      return res.status(400).json({ message: "Customer Not Found" });
    }

    // Build fallback driver map for any driverId/driverName stored as ObjectId or string
    const driverMap = new Map();
    try {
      const drivers = await Driver.find().populate("userId", "name").lean();
      drivers.forEach((d) => {
        const dName =
          d.userId?.name ||
          d.name ||
          (d.driverId ? `Driver (${d.driverId})` : "Driver");
        const info = {
          _id: d._id ? d._id.toString() : "",
          driverId: d.driverId || "",
          name: dName,
        };
        if (d._id) driverMap.set(d._id.toString(), info);
        if (d.driverId) driverMap.set(d.driverId, info);
        if (d.userId?._id) driverMap.set(d.userId._id.toString(), info);
      });

      const driverUsers = await User.find({
        role: { $in: ["driver", "griver"] },
      }).lean();
      driverUsers.forEach((u) => {
        if (u._id && !driverMap.has(u._id.toString())) {
          driverMap.set(u._id.toString(), {
            _id: u._id.toString(),
            driverId: "",
            name: u.name || "Driver",
          });
        }
      });
    } catch (driverErr) {
      console.warn("Could not load drivers map:", driverErr);
    }

    // Build fallback vehicle map
    const vehicleMap = new Map();
    try {
      const vechiles = await Vechile.find().lean();
      vechiles.forEach((v) => {
        const reg =
          v.vregistrationnumber ||
          v.registrationNumber ||
          v.vehicleName ||
          v.vmodel ||
          "";
        if (v._id) vehicleMap.set(v._id.toString(), reg);
        if (v.vregistrationnumber) vehicleMap.set(v.vregistrationnumber, reg);
      });
    } catch (vehErr) {
      console.warn("Could not load vehicles map:", vehErr);
    }

    const enrichedShipments = shipmentf.map((s) => {
      // 1. Resolve Driver Name
      let resolvedDriverName = "";
      if (s.driverName) {
        if (typeof s.driverName === "object" && s.driverName !== null) {
          resolvedDriverName =
            s.driverName.userId?.name ||
            s.driverName.name ||
            (s.driverName.driverId ? `Driver (${s.driverName.driverId})` : "");
        } else {
          const key = String(s.driverName).trim();
          if (driverMap.has(key)) {
            resolvedDriverName = driverMap.get(key).name;
          } else if (
            !/^[0-9a-fA-F]{24}$/.test(key) &&
            key.toLowerCase() !== "unassigned"
          ) {
            resolvedDriverName = key;
          }
        }
      }
      if (!resolvedDriverName && s.driverId) {
        const key = String(s.driverId).trim();
        if (driverMap.has(key)) {
          resolvedDriverName = driverMap.get(key).name;
        } else if (!/^[0-9a-fA-F]{24}$/.test(key)) {
          resolvedDriverName = key;
        }
      }

      // 2. Resolve Vehicle No
      let resolvedVehicleNo = "";
      if (s.vehicleNo) {
        if (typeof s.vehicleNo === "object" && s.vehicleNo !== null) {
          resolvedVehicleNo =
            s.vehicleNo.vregistrationnumber ||
            s.vehicleNo.registrationNumber ||
            s.vehicleNo.vehicleName ||
            s.vehicleNo.vmodel ||
            "";
        } else {
          const key = String(s.vehicleNo).trim();
          if (vehicleMap.has(key)) {
            resolvedVehicleNo = vehicleMap.get(key);
          } else if (
            !/^[0-9a-fA-F]{24}$/.test(key) &&
            key.toLowerCase() !== "unassigned"
          ) {
            resolvedVehicleNo = key;
          }
        }
      }

      return {
        ...s,
        driverName: resolvedDriverName,
        vehicleNo: resolvedVehicleNo,
      };
    });

    const shipmentIds = enrichedShipments.map((shipid) => shipid._id);

    const shipmenthistoryf = await ShipmentStatusHistory.find({
      shipmentId: { $in: shipmentIds },
    });

    res.status(200).json({
      message: "fetch done",
      result: {
        customerf,
        shipmentf: enrichedShipments,
        shipmenthistoryf,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/drivers", authMiddleware, async (req, res) => {
  try {
    const { search = "", status, availability } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [{ driverId: regex }];
    }

    if (status) filter.status = status;
    if (availability) filter.availability = availability;

    const drivers = await Driver.find(filter).populate("userId");

    res.json({ drivers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//driverdetails
app.get("/drivers/:id", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id).populate("userId");

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    res.json({ driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//updatedriver
app.put("/drivers/:id", authMiddleware, async (req, res) => {
  try {
    const updates = req.body;

    const driver = await Driver.findByIdAndUpdate(req.params.id, updates, {
      new: true,
    });

    if (driver) {
      await createAuditLog({
        userId: req.user._id,
        action: "UPDATE_DRIVER",
        resource: "Driver",
        resourceId: driver._id.toString(),
      });
    }

    res.json({ message: "Driver updated", driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//activate/deactivate
app.patch("/drivers/:id/status", authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);

    if (!driver) return res.status(404).json({ message: "Driver not found" });

    driver.status = driver.status === "active" ? "inactive" : "active";

    await driver.save();

    await createAuditLog({
      userId: req.user._id,
      action:
        driver.status === "active" ? "ACTIVATE_DRIVER" : "DEACTIVATE_DRIVER",
      resource: "Driver",
      resourceId: driver._id.toString(),
    });

    res.json({ message: "Driver status updated", driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//updateavailability
app.patch("/drivers/:id/availability", authMiddleware, async (req, res) => {
  try {
    const { availability } = req.body;

    const driver = await Driver.findByIdAndUpdate(
      req.params.id,
      { availability },
      { new: true },
    );

    res.json({ driver });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//assigndrivertoshipment
app.patch("/shipments/:id/assign-driver", authMiddleware, async (req, res) => {
  try {
    const { driverId } = req.body;

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { driverId },
      { new: true },
    );

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_SHIPMENT",
      resource: "Shipment",
      resourceId: shipment ? shipment._id.toString() : req.params.id,
    });

    if (driverId) {
      await createAuditLog({
        userId: req.user._id,
        action: "ASSIGN_DRIVER",
        resource: "Driver",
        resourceId: driverId.toString(),
      });
    }

    res.json({ message: "Driver assigned", shipment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//drivershipmenthistory
app.get("/drivers/:id/shipments", authMiddleware, async (req, res) => {
  try {
    const driverParam = req.params.id;
    const orConditions = [];

    if (mongoose.Types.ObjectId.isValid(driverParam)) {
      orConditions.push({ driverName: driverParam });
      orConditions.push({ driverId: driverParam });
    } else {
      orConditions.push({ driverId: driverParam });
    }

    try {
      let driverObj = null;
      if (mongoose.Types.ObjectId.isValid(driverParam)) {
        driverObj = await Driver.findById(driverParam);
      }
      if (!driverObj) {
        driverObj = await Driver.findOne({ driverId: driverParam });
      }
      if (driverObj) {
        if (driverObj._id) {
          orConditions.push({ driverName: driverObj._id });
          orConditions.push({ driverId: String(driverObj._id) });
        }
        if (driverObj.driverId) {
          orConditions.push({ driverId: driverObj.driverId });
        }
      }
    } catch (_) {}

    const shipments = await Shipment.find(
      orConditions.length > 0 ? { $or: orConditions } : { _id: null },
    )
      .populate("tripNo")
      .populate("vehicleNo")
      .populate("customerId")
      .sort({ createdAt: -1 });

    res.json({ shipments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//driverperformance
app.get("/drivers/:id/performance", authMiddleware, async (req, res) => {
  try {
    const driverParam = req.params.id;
    const orConditions = [];

    if (mongoose.Types.ObjectId.isValid(driverParam)) {
      orConditions.push({ driverName: driverParam });
      orConditions.push({ driverId: driverParam });
    } else {
      orConditions.push({ driverId: driverParam });
    }

    try {
      let driverObj = null;
      if (mongoose.Types.ObjectId.isValid(driverParam)) {
        driverObj = await Driver.findById(driverParam);
      }
      if (!driverObj) {
        driverObj = await Driver.findOne({ driverId: driverParam });
      }
      if (driverObj) {
        if (driverObj._id) {
          orConditions.push({ driverName: driverObj._id });
          orConditions.push({ driverId: String(driverObj._id) });
        }
        if (driverObj.driverId) {
          orConditions.push({ driverId: driverObj.driverId });
        }
      }
    } catch (_) {}

    const filter =
      orConditions.length > 0 ? { $or: orConditions } : { _id: null };
    const total = await Shipment.countDocuments(filter);

    const delivered = await Shipment.countDocuments({
      ...filter,
      status: "delivered",
    });

    res.json({
      totalTrips: total,
      deliveredTrips: delivered,
      successRate: total ? (delivered / total) * 100 : 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//vechile
app.get("/vechile", authMiddleware, async (req, res) => {
  try {
    const vechiles = await Vechile.find().sort({ _id: -1 }).lean();

    // Find active trips (planned, dispatched, in_transit, arrived)
    const activeTrips = await Trip.find({
      status: { $in: ["planned", "dispatched", "in_transit", "arrived"] },
    })
      .populate({
        path: "driverId",
        populate: { path: "userId", select: "name email phone phonenumber" },
      })
      .sort({ createdAt: -1 })
      .lean();

    // Map each vehicle to its active trip & driver if assigned
    const enrichedVehicles = vechiles.map((v) => {
      const activeTrip = activeTrips.find(
        (t) => t.vehicleId && String(t.vehicleId) === String(v._id),
      );

      if (activeTrip) {
        const driverObj = activeTrip.driverId;
        const driverName =
          driverObj?.userId?.name ||
          driverObj?.name ||
          driverObj?.driverId ||
          v.driver ||
          "";
        const driverPhone =
          driverObj?.phonenumber ||
          driverObj?.userId?.phone ||
          driverObj?.userId?.phonenumber ||
          v.driverPhone ||
          "";

        return {
          ...v,
          vstatus:
            v.vstatus === "In Maintenance" || v.vstatus === "Inactive"
              ? v.vstatus
              : "Assigned",
          driver: driverName,
          driverPhone: driverPhone,
          location: `${activeTrip.origin} → ${activeTrip.destination}`,
          currentTrip: {
            id: activeTrip.tripId,
            tripId: activeTrip.tripId,
            origin: activeTrip.origin,
            destination: activeTrip.destination,
            status: activeTrip.status,
            plannedDeparture: activeTrip.plannedDeparture,
            plannedArrival: activeTrip.plannedArrival,
            eta: activeTrip.plannedArrival
              ? new Date(activeTrip.plannedArrival).toLocaleString()
              : "",
          },
        };
      }

      return v;
    });

    res.status(200).json(enrichedVehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/vechile", authMiddleware, async (req, res) => {
  const vregistrationnumber = (
    req.body.vregistrationnumber ||
    req.body.registrationNumber ||
    ""
  )
    .trim()
    .toUpperCase();
  const vtype = req.body.vtype || req.body.type;
  const vmodel = (req.body.vmodel || req.body.model || "").trim();
  const rawCapacity =
    req.body.vcapacity !== undefined
      ? req.body.vcapacity
      : req.body.capacityValue !== undefined
        ? req.body.capacityValue
        : req.body.capacity;
  const numMatch = String(rawCapacity || "").match(/[\d.]+/);
  const vcapacity = numMatch ? parseFloat(numMatch[0]) : Number(rawCapacity);
  const vfuletype = req.body.vfuletype || req.body.fuelType;
  const vstatus = req.body.vstatus || req.body.status || "Available";

  const rawDocs = req.body.documents || {};
  const insurance = {
    documentName: rawDocs.insurance?.documentName || "Insurance",
    documentNumber: (
      rawDocs.insurance?.documentNumber ||
      req.body.insuranceDocumentNumber ||
      req.body.insurancePolicy ||
      ""
    ).trim(),
    expireDate:
      rawDocs.insurance?.expireDate ||
      req.body.insuranceExpireDate ||
      req.body.insuranceExpiry,
  };
  const rc = {
    documentName: rawDocs.rc?.documentName || "RC",
    documentNumber: (
      rawDocs.rc?.documentNumber ||
      req.body.rcDocumentNumber ||
      req.body.rcNumber ||
      ""
    ).trim(),
    expireDate:
      rawDocs.rc?.expireDate || req.body.rcExpireDate || req.body.rcExpiry,
  };
  const puc = {
    documentName: rawDocs.puc?.documentName || "PUC",
    documentNumber: (
      rawDocs.puc?.documentNumber ||
      req.body.pucDocumentNumber ||
      req.body.pucNumber ||
      ""
    ).trim(),
    expireDate:
      rawDocs.puc?.expireDate || req.body.pucExpireDate || req.body.pucExpiry,
  };
  const fitness = {
    documentName: rawDocs.fitness?.documentName || "Fitness Certificate",
    documentNumber: (
      rawDocs.fitness?.documentNumber ||
      req.body.fitnessDocumentNumber ||
      req.body.fitnessCertificateNumber ||
      ""
    ).trim(),
    expireDate:
      rawDocs.fitness?.expireDate ||
      req.body.fitnessExpireDate ||
      req.body.fitnessExpiry,
  };
  const permit = {
    documentName: rawDocs.permit?.documentName || "Transport Permit",
    documentNumber: (
      rawDocs.permit?.documentNumber ||
      req.body.permitDocumentNumber ||
      req.body.permitNumber ||
      ""
    ).trim(),
    expireDate:
      rawDocs.permit?.expireDate ||
      req.body.permitExpireDate ||
      req.body.permitExpiry,
  };

  try {
    if (
      !vregistrationnumber ||
      !vtype ||
      !vmodel ||
      !vcapacity ||
      isNaN(vcapacity) ||
      !vfuletype ||
      !vstatus ||
      !insurance.documentNumber ||
      !insurance.expireDate ||
      !rc.documentNumber ||
      !rc.expireDate ||
      !puc.documentNumber ||
      !puc.expireDate ||
      !fitness.documentNumber ||
      !fitness.expireDate ||
      !permit.documentNumber ||
      !permit.expireDate
    ) {
      return res.status(400).json({ message: "Please filled the all details" });
    }

    const existVechile = await Vechile.findOne({ vregistrationnumber });

    if (existVechile) {
      return res
        .status(400)
        .json({ message: "Vechile Registration Number Already Exist" });
    }

    const driver = (req.body.driver || "").trim();
    const driverPhone = (req.body.driverPhone || "").trim();
    const location = (req.body.location || "Central Depot, Mumbai").trim();

    const newVechile = new Vechile({
      vregistrationnumber,
      vtype,
      vmodel,
      vcapacity,
      vfuletype,
      vstatus,
      driver,
      driverPhone,
      location,
      documents: {
        insurance,
        rc,
        puc,
        fitness,
        permit,
      },
    });

    await newVechile.save();

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE_VEHICLE",
      resource: "Vehicle",
      resourceId: newVechile._id.toString(),
    });

    res.status(201).json({ message: "Vechile Created", vehicle: newVechile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update vehicle details (driver, location, status, specs)
app.put("/vechile/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    if (req.body.vregistrationnumber || req.body.registrationNumber) {
      updateData.vregistrationnumber = (
        req.body.vregistrationnumber || req.body.registrationNumber
      )
        .trim()
        .toUpperCase();
    }
    if (req.body.vtype || req.body.type) {
      updateData.vtype = req.body.vtype || req.body.type;
    }
    if (req.body.vmodel || req.body.model) {
      updateData.vmodel = (req.body.vmodel || req.body.model).trim();
    }
    if (
      req.body.vcapacity !== undefined ||
      req.body.capacityValue !== undefined ||
      req.body.capacity !== undefined
    ) {
      const rawCap =
        req.body.vcapacity ?? req.body.capacityValue ?? req.body.capacity;
      const numMatch = String(rawCap || "").match(/[\d.]+/);
      updateData.vcapacity = numMatch
        ? parseFloat(numMatch[0])
        : Number(rawCap);
    }
    if (req.body.vfuletype || req.body.fuelType) {
      updateData.vfuletype = req.body.vfuletype || req.body.fuelType;
    }
    if (req.body.vstatus || req.body.status) {
      updateData.vstatus = req.body.vstatus || req.body.status;
    }
    if (req.body.driver !== undefined) {
      updateData.driver = req.body.driver.trim();
    }
    if (req.body.driverPhone !== undefined) {
      updateData.driverPhone = req.body.driverPhone.trim();
    }
    if (req.body.location !== undefined) {
      updateData.location = req.body.location.trim();
    }
    if (req.body.documents) {
      updateData.documents = req.body.documents;
    }

    const updatedVehicle = await Vechile.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedVehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_VEHICLE",
      resource: "Vehicle",
      resourceId: updatedVehicle._id.toString(),
    });

    if (req.body.driver !== undefined && req.body.driver !== "") {
      await createAuditLog({
        userId: req.user._id,
        action: "ASSIGN_VEHICLE",
        resource: "Vehicle",
        resourceId: updatedVehicle._id.toString(),
      });
    }

    res.status(200).json({
      message: "Vehicle updated successfully",
      vehicle: updatedVehicle,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put("/vechile/:id/documents", authMiddleware, async (req, res) => {
  try {
    const { documents } = req.body;
    if (!documents) {
      return res.status(400).json({ message: "Documents payload is required" });
    }

    const vechile = await Vechile.findById(req.params.id);
    if (!vechile) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    if (!vechile.documents) vechile.documents = {};

    const docKeys = ["insurance", "rc", "puc", "fitness", "permit"];
    const defaultNames = {
      insurance: "Insurance",
      rc: "RC",
      puc: "PUC",
      fitness: "Fitness Certificate",
      permit: "Transport Permit",
    };

    docKeys.forEach((key) => {
      if (documents[key]) {
        vechile.documents[key] = {
          documentName: documents[key].documentName || defaultNames[key],
          documentNumber: (documents[key].documentNumber || "").trim(),
          expireDate: documents[key].expireDate,
        };
      }
    });

    await vechile.save();

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_VEHICLE",
      resource: "Vehicle",
      resourceId: vechile._id.toString(),
    });

    res
      .status(200)
      .json({ message: "Documents updated successfully", vechile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/vechile-maintenance", authMiddleware, async (req, res) => {
  const targetVehicleId = req.body.vehicleId || req.body.vechileId;
  const {
    serviceDate,
    serviceType,
    description,
    odometer,
    serviceCost,
    serviceProvider,
    nextServiceDate,
  } = req.body;

  try {
    if (
      !targetVehicleId ||
      !serviceDate ||
      !serviceType ||
      !description ||
      odometer === undefined ||
      odometer === null ||
      odometer === "" ||
      serviceCost === undefined ||
      serviceCost === null ||
      serviceCost === "" ||
      !serviceProvider
    ) {
      return res.status(400).json({ message: "Please Filled Missing Details" });
    }

    const newLog = new VehicleMaintenance({
      vehicleId: targetVehicleId,
      vechileId: targetVehicleId,
      serviceDate: new Date(serviceDate),
      serviceType,
      description: String(description).trim(),
      odometer: Number(odometer),
      serviceCost: Number(serviceCost),
      serviceProvider: String(serviceProvider).trim(),
      nextServiceDate: nextServiceDate ? new Date(nextServiceDate) : undefined,
    });
    await newLog.save();

    await createAuditLog({
      userId: req.user._id,
      action: "VEHICLE_MAINTENANCE",
      resource: "Vehicle",
      resourceId: String(targetVehicleId),
    });

    res.status(200).json({ message: "Log Saved", log: newLog });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/vechile-maintenance", authMiddleware, async (req, res) => {
  try {
    const logs = await VehicleMaintenance.find()
      .populate("vehicleId")
      .populate("vechileId")
      .sort({ serviceDate: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/vechile-maintenance/:vehicleId", authMiddleware, async (req, res) => {
  try {
    const logs = await VehicleMaintenance.find({
      $or: [
        { vehicleId: req.params.vehicleId },
        { vechileId: req.params.vehicleId },
      ],
    }).sort({ serviceDate: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/vechile-fuel", authMiddleware, async (req, res) => {
  const targetVehicleId = req.body.vehicleId || req.body.vechileId;
  const fuelDate = req.body.fuelDate || req.body.date;
  const fuelType = req.body.fuelType;
  const rawQuantity =
    req.body.quantity !== undefined &&
    req.body.quantity !== null &&
    req.body.quantity !== ""
      ? req.body.quantity
      : req.body.quatity !== undefined &&
          req.body.quatity !== null &&
          req.body.quatity !== ""
        ? req.body.quatity
        : req.body.litres;
  const rawCost =
    req.body.fuelCost !== undefined &&
    req.body.fuelCost !== null &&
    req.body.fuelCost !== ""
      ? req.body.fuelCost
      : req.body.fuelConst !== undefined &&
          req.body.fuelConst !== null &&
          req.body.fuelConst !== ""
        ? req.body.fuelConst
        : req.body.totalCost;
  const rawOdometer = req.body.odometer;
  const fuelStation = req.body.fuelStation || req.body.station;

  try {
    if (
      !targetVehicleId ||
      !fuelDate ||
      !fuelType ||
      rawQuantity === undefined ||
      rawQuantity === null ||
      rawQuantity === "" ||
      rawCost === undefined ||
      rawCost === null ||
      rawCost === "" ||
      rawOdometer === undefined ||
      rawOdometer === null ||
      rawOdometer === "" ||
      !fuelStation
    ) {
      return res.status(400).json({ message: "Please Filled Missing Details" });
    }

    const numQuantity = Number(rawQuantity);
    const numCost = Number(rawCost);
    const numOdometer = Number(rawOdometer);

    const newRecord = new VehicleFuel({
      vehicleId: targetVehicleId,
      fuelDate: new Date(fuelDate),
      fuelType,
      quantity: numQuantity,
      fuelCost: numCost,
      odometer: numOdometer,
      fuelStation: String(fuelStation).trim(),
    });

    await newRecord.save();
    res.status(200).json({ message: "Record Saved", record: newRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/vechile-fuel", authMiddleware, async (req, res) => {
  try {
    const logs = await VehicleFuel.find()
      .populate("vehicleId")
      .sort({ fuelDate: -1, createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/vechile-fuel/:vehicleId", authMiddleware, async (req, res) => {
  try {
    const logs = await VehicleFuel.find({
      $or: [
        { vehicleId: req.params.vehicleId },
        { vechileId: req.params.vehicleId },
      ],
    }).sort({ fuelDate: -1, createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//warehouse

async function generateWarehouseId() {
  let warehouseId;
  let exists = true;

  while (exists) {
    warehouseId = `WH-${Math.floor(100000 + Math.random() * 900000)}`;

    const existingCustomer = await Warehouse.findOne({
      warehouseId,
    });

    exists = !!existingCustomer;
  }

  return warehouseId;
}

app.post("/warehouse-create", authMiddleware, async (req, res) => {
  const { warName, warAddress, warCity, warCapacity, warStatus } = req.body;

  try {
    if (!warName || !warAddress || !warCity || !warCapacity || !warStatus) {
      return res.status(400).json({ message: "Please Filled the All Details" });
    }

    const warid = await generateWarehouseId();

    const newWarehouse = new Warehouse({
      warehouseId: warid,
      warName,
      warAddress,
      warCity,
      warCapacity,
      warStatus,
    });
    await newWarehouse.save();

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE_WAREHOUSE",
      resource: "Warehouse",
      resourceId: newWarehouse._id.toString(),
    });

    res.status(200).json({ message: "Warehouse Created" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/warehouse-list", authMiddleware, async (req, res) => {
  try {
    const listwarehouse = await Warehouse.find();

    res.status(200).json({ message: "List of Warehouse", listwarehouse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/warehouse-update/:id", authMiddleware, async (req, res) => {
  const warid = req.params.id;
  const { warName, warAddress, warCity, warCapacity, warStatus } = req.body;

  try {
    if (!warName || !warAddress || !warCity || !warCapacity || !warStatus) {
      return res.status(400).json({ message: "Please Filled the All Details" });
    }

    const findwarhouse = await Warehouse.findById(warid);

    if (!findwarhouse) {
      return res.status(404).json({ message: "Warehouse Not Found" });
    }

    findwarhouse.warName = warName;
    findwarhouse.warAddress = warAddress;
    findwarhouse.warCity = warCity;
    findwarhouse.warCapacity = warCapacity;
    findwarhouse.warStatus = warStatus;

    await findwarhouse.save();

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_WAREHOUSE",
      resource: "Warehouse",
      resourceId: findwarhouse._id.toString(),
    });

    res.status(200).json({ message: "Warehouse Detail Updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/warehouse-update-status/:id", authMiddleware, async (req, res) => {
  const warid = req.params.id;
  const { warStatus } = req.body;

  try {
    const findwarhouse = await Warehouse.findById(warid);

    if (!findwarhouse) {
      return res.status(404).json({ message: "Warehouse Not Found" });
    }

    const updateStatus = await Warehouse.findByIdAndUpdate(warid, {
      warStatus,
    });

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_WAREHOUSE",
      resource: "Warehouse",
      resourceId: warid.toString(),
    });

    res.status(200).json({ message: "Status Updated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/warehouse-location", authMiddleware, async (req, res) => {
  const {
    warehouseId,
    warlocZone,
    warlocRack,
    warlocBin,
    warlocCapacity,
    warlocStatus,
  } = req.body;

  try {
    if (
      !warehouseId ||
      !warlocZone ||
      !warlocRack ||
      !warlocBin ||
      !warlocCapacity ||
      !warlocStatus
    ) {
      return res.status(400).json({ message: "Please Fille the All Details" });
    }

    const findWarehouse = await Warehouse.findById(warehouseId);

    if (!findWarehouse) {
      return res.status(400).json({ message: "Warehouse Not Found" });
    }

    const newWareloc = await WarehouseLocation({
      warehouseId,
      warlocZone,
      warlocRack,
      warlocBin,
      warlocCapacity,
      warlocStatus,
    });

    await newWareloc.save();

    res.status(200).json({ message: "Warehouse Location Save" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/warehouse-location-get/:id", authMiddleware, async (req, res) => {
  const warehouseId = req.params.id;
  try {
    if (!warehouseId) {
      return res.status(400).json({ message: "Warehouse Not Found" });
    }

    const warhouseloclist = await WarehouseLocation.find({ warehouseId });

    res.status(200).json({ message: "Warehouse Location", warhouseloclist });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch(
  "/warehouse-location-update/:id",
  authMiddleware,
  async (req, res) => {
    const warehouseId = req.params.id;
    const { warlocZone, warlocRack, warlocBin, warlocCapacity, warlocStatus } =
      req.body;

    try {
      if (!warehouseId) {
        return res
          .status(400)
          .json({ message: "Warehouse Location Not Found" });
      }
      if (
        !warehouseId ||
        !warlocZone ||
        !warlocRack ||
        !warlocBin ||
        !warlocCapacity ||
        !warlocStatus
      ) {
        return res
          .status(400)
          .json({ message: "Please Fille the All Details" });
      }

      const findWarehouse = await WarehouseLocation.findById(warehouseId);

      if (!findWarehouse) {
        return res
          .status(400)
          .json({ message: "Warehouse Location Not Found" });
      }

      findWarehouse.warlocZone = warlocZone;
      findWarehouse.warlocRack = warlocRack;
      findWarehouse.warlocBin = warlocBin;
      findWarehouse.warlocCapacity = warlocCapacity;
      findWarehouse.warlocStatus = warlocStatus;

      await findWarehouse.save();
      res.status(200).json({ message: "Warehouse Location Update" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.patch(
  "/warehouse-location-status/:id",
  authMiddleware,
  async (req, res) => {
    const warehouselocId = req.params.id;

    const { warlocStatus } = req.body;

    try {
      const warloc = await WarehouseLocation.findById(warehouselocId);

      if (!warloc) {
        return res
          .status(400)
          .json({ message: "Warehouse Location Not Found" });
      }

      warloc.warlocStatus = warlocStatus;

      await warloc.save();
      res.status(200).json({ message: "Warehouse Location Status Update" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.get("/warehouse-scane/:id", async (req, res) => {
  const trackingId = req.params.id;

  try {
    let findshipment = await Shipment.findOne({ trackingId: trackingId })
      .populate("vehicleNo")
      .populate({
        path: "tripNo",
        populate: [
          {
            path: "driverId",
            populate: {
              path: "userId",
              select: "name email phone phonenumber",
            },
          },
          { path: "vehicleId" },
        ],
      })
      .populate({
        path: "driverName",
        populate: {
          path: "userId",
          select: "name email phone phonenumber",
        },
      });

    if (!findshipment && mongosse.Types.ObjectId.isValid(trackingId)) {
      findshipment = await Shipment.findById(trackingId)
        .populate("vehicleNo")
        .populate({
          path: "tripNo",
          populate: [
            {
              path: "driverId",
              populate: {
                path: "userId",
                select: "name email phone phonenumber",
              },
            },
            { path: "vehicleId" },
          ],
        })
        .populate({
          path: "driverName",
          populate: {
            path: "userId",
            select: "name email phone phonenumber",
          },
        });
    }

    if (!findshipment) {
      findshipment = await Shipment.findOne({ shipmentId: trackingId })
        .populate("vehicleNo")
        .populate({
          path: "tripNo",
          populate: [
            {
              path: "driverId",
              populate: {
                path: "userId",
                select: "name email phone phonenumber",
              },
            },
            { path: "vehicleId" },
          ],
        })
        .populate({
          path: "driverName",
          populate: {
            path: "userId",
            select: "name email phone phonenumber",
          },
        });
    }

    if (!findshipment) {
      return res.status(400).json({ message: "Shipment Not Found" });
    }

    if (findshipment.status !== "picked_up") {
      return res.status(400).json({
        message: `Shipment cannot be received. Current status: ${findshipment.status}`,
      });
    }

    const shipmentData = findshipment.toObject();

    // Fallbacks if vehicleNo / driverName weren't directly populated or stored as raw IDs
    if (
      shipmentData.vehicleNo &&
      !shipmentData.vehicleNo.vregistrationnumber &&
      !shipmentData.vehicleNo.vmodel
    ) {
      if (mongosse.Types.ObjectId.isValid(shipmentData.vehicleNo)) {
        const foundVeh = await Vechile.findById(shipmentData.vehicleNo);
        if (foundVeh) shipmentData.vehicleNo = foundVeh;
      }
    }
    if (
      (!shipmentData.vehicleNo ||
        (!shipmentData.vehicleNo.vregistrationnumber &&
          !shipmentData.vehicleNo.vmodel)) &&
      shipmentData.tripNo?.vehicleId
    ) {
      shipmentData.vehicleNo = shipmentData.tripNo.vehicleId;
    }

    if (
      shipmentData.driverName &&
      !shipmentData.driverName.driverId &&
      !shipmentData.driverName.userId
    ) {
      if (mongosse.Types.ObjectId.isValid(shipmentData.driverName)) {
        const foundDrv = await Driver.findById(
          shipmentData.driverName,
        ).populate("userId", "name email phone phonenumber");
        if (foundDrv) shipmentData.driverName = foundDrv;
      }
    }
    if (
      (!shipmentData.driverName ||
        (!shipmentData.driverName.driverId &&
          !shipmentData.driverName.userId)) &&
      shipmentData.tripNo?.driverId
    ) {
      shipmentData.driverName = shipmentData.tripNo.driverId;
    }

    if (shipmentData.tripNo && !shipmentData.tripNo.tripId) {
      if (mongosse.Types.ObjectId.isValid(shipmentData.tripNo)) {
        const foundTrip = await Trip.findById(shipmentData.tripNo);
        if (foundTrip) shipmentData.tripNo = foundTrip;
      }
    }

    res
      .status(200)
      .json({ message: "Verify the Shipment", findshipment: shipmentData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/warehouse/inbound", authMiddleware, async (req, res) => {
  const { warehouseId, shipmentId, locationId, wartansactonProcessBy } =
    req.body;

  try {
    if (!warehouseId || !shipmentId || !locationId) {
      return res.status(400).json({
        message: "Please Fill all details",
      });
    }

    let findwarehouse = null;
    if (mongosse.Types.ObjectId.isValid(warehouseId)) {
      findwarehouse = await Warehouse.findById(warehouseId);
    }
    if (!findwarehouse) {
      findwarehouse = await Warehouse.findOne({ warehouseId });
    }

    if (!findwarehouse) {
      return res.status(400).json({
        message: "Warehouse Not Found",
      });
    }

    let findShipment = null;
    if (mongosse.Types.ObjectId.isValid(shipmentId)) {
      findShipment = await Shipment.findById(shipmentId);
    }
    if (!findShipment) {
      findShipment = await Shipment.findOne({
        $or: [{ shipmentId: shipmentId }, { trackingId: shipmentId }],
      });
    }

    if (!findShipment) {
      return res.status(400).json({
        message: "Shipment Not Found",
      });
    }

    // Shipment must be picked up before entering warehouse
    if (findShipment.status !== "picked_up") {
      return res.status(400).json({
        message: `Shipment cannot be received. Current status: ${findShipment.status}`,
      });
    }

    let findLocation = null;
    if (mongosse.Types.ObjectId.isValid(locationId)) {
      findLocation = await WarehouseLocation.findById(locationId);
    }
    if (!findLocation) {
      findLocation = await WarehouseLocation.findOne({
        warehouseId: findwarehouse._id,
      });
    }

    if (!findLocation) {
      return res.status(400).json({
        message: "Location Not Found",
      });
    }

    let findUser = null;
    if (
      wartansactonProcessBy &&
      mongosse.Types.ObjectId.isValid(wartansactonProcessBy)
    ) {
      findUser = await User.findById(wartansactonProcessBy);
    }
    if (!findUser && wartansactonProcessBy) {
      findUser = await User.findOne({
        $or: [
          { name: new RegExp(`^${wartansactonProcessBy.trim()}$`, "i") },
          { email: wartansactonProcessBy.trim().toLowerCase() },
        ],
      });
    }
    if (!findUser && req.user?.userId) {
      findUser = await User.findById(req.user.userId);
    }
    if (!findUser) {
      findUser = await User.findOne();
    }

    if (!findUser) {
      return res.status(400).json({
        message: "User Not Found",
      });
    }

    // Check whether shipment is already stored
    const findShipmentInWarehouse = await WarehouseStorage.findOne({
      shipmentId: findShipment._id,
      warstorStatus: "store",
    });

    if (findShipmentInWarehouse) {
      return res.status(400).json({
        message: "Shipment Already Stored In Warehouse",
      });
    }

    // Update shipment
    findShipment.status = "at_warehouse";
    await findShipment.save();

    // Create storage record
    const newWarehouseStorage = new WarehouseStorage({
      warehouseId,
      shipmentId,
      locationId,
      warstorStatus: "store",
      removeAt: null,
    });

    await newWarehouseStorage.save();

    // Create inbound transaction
    const newWarehouseTransaction = new WarehouseTransaction({
      warehouseId,
      shipmentId,
      wartransactionType: "inbound",
      locationId,
      wartansactonProcessBy: findUser._id,
    });

    await newWarehouseTransaction.save();

    await createAuditLog({
      userId: req.user._id || findUser._id,
      action: "WAREHOUSE_INBOUND",
      resource: "Warehouse",
      resourceId: findShipment._id.toString(),
    });

    res.status(200).json({
      message: "Shipment Stored in Warehouse Successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get("/warehouse/:id/storage", authMiddleware, async (req, res) => {
  const warhouseId = req.params.id;

  try {
    const findWarehouse = await Warehouse.findOne({ _id: warhouseId });

    if (!findWarehouse) {
      return res.status(400).json({ message: "Warehouse Not Found" });
    }

    const warehouseStorage = await WarehouseStorage.find({
      warehouseId: warhouseId,
    }).populate("warehouseId shipmentId locationId");

    if (!warehouseStorage) {
      return res
        .status(400)
        .json({ message: "Storage Not Found of the Warehouse" });
    }

    res.status(200).json({ message: "Warehouse Storage", warehouseStorage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get(
  "/warehouses/storage/shipment/:shipmentId",
  authMiddleware,
  async (req, res) => {
    const shipmentId = req.params.shipmentId;

    try {
      const findShipmentId = await Shipment.findById(shipmentId);

      if (!findShipmentId) {
        return res.status(400).json({ message: "Shipment Not Found" });
      }

      const warehouseStorage = await WarehouseStorage.findOne({
        shipmentId,
      }).populate("warehouseId shipmentId locationId");

      if (!warehouseStorage) {
        return res
          .status(400)
          .json({ message: "Shipment Not Found in Warehouse" });
      }

      res
        .status(200)
        .json({ message: "Shipment Warehouse Information", warehouseStorage });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.get(
  "/warehouse/storage/tracking/:trackingId",
  authMiddleware,
  async (req, res) => {
    const trackingId = req.params.trackingId;

    try {
      const findShipment = await Shipment.findOne({ trackingId });

      if (!findShipment) {
        return res.status(400).json({ message: "Shipment Not Found" });
      }

      const findWarehouseStorage = await WarehouseStorage.findOne({
        shipmentId: findShipment._id,
      }).populate("warehouseId shipmentId locationId");

      if (!findWarehouseStorage) {
        return res
          .status(400)
          .json({ message: "Shipment Not Found In Warehouse Storage" });
      }

      res.status(200).json({
        message: "Shipment Found By Tracking ID",
        findWarehouseStorage,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.patch("/warehouse/outbound", authMiddleware, async (req, res) => {
  const { shipmentId } = req.body;

  try {
    if (!shipmentId) {
      return res.status(400).json({
        message: "Shipment ID is required",
      });
    }

    const findShipment = await Shipment.findById(shipmentId);

    if (!findShipment) {
      return res.status(400).json({
        message: "Shipment Not Found",
      });
    }

    // Shipment must currently be inside warehouse
    if (findShipment.status !== "at_warehouse") {
      return res.status(400).json({
        message: `Shipment cannot be dispatched. Current status: ${findShipment.status}`,
      });
    }

    const warehouseStorage = await WarehouseStorage.findOne({
      shipmentId: findShipment._id,
      warstorStatus: "store",
    });

    if (!warehouseStorage) {
      return res.status(400).json({
        message: "Shipment Not Found In Warehouse",
      });
    }

    // Update shipment
    findShipment.status = "dispatched";
    await findShipment.save();

    // Remove from current storage
    warehouseStorage.warstorStatus = "remove";
    warehouseStorage.removeAt = new Date();
    await warehouseStorage.save();

    // Create NEW outbound transaction
    const newWarehouseTransaction = new WarehouseTransaction({
      warehouseId: warehouseStorage.warehouseId,
      shipmentId: findShipment._id,
      wartransactionType: "outbound",
      locationId: warehouseStorage.locationId,
      wartansactonProcessBy: req.user.userId,
    });

    await newWarehouseTransaction.save();

    await createAuditLog({
      userId: req.user._id,
      action: "WAREHOUSE_OUTBOUND",
      resource: "Warehouse",
      resourceId: findShipment._id.toString(),
    });

    res.status(200).json({
      message: "Shipment Out of Warehouse",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

app.get(
  "/warehouses/:warehouseId/inbound-history",
  authMiddleware,
  async (req, res) => {
    const warehouseId = req.params.warehouseId;

    try {
      const findWarehouse = await Warehouse.findById(warehouseId);

      if (!findWarehouse) {
        return res.status(400).json({ message: "Warehouse Not Found" });
      }

      const warehouseTransaction = await WarehouseTransaction.find({
        warehouseId,
        wartransactionType: "inbound",
      }).populate("shipmentId locationId wartansactonProcessBy");

      res
        .status(200)
        .json({ message: "Warehouse Inbound History", warehouseTransaction });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

app.get(
  "/warehouses/:warehouseId/outbound-history",
  authMiddleware,
  async (req, res) => {
    const warehouseId = req.params.warehouseId;

    try {
      const findWarehouse = await Warehouse.findById(warehouseId);

      if (!findWarehouse) {
        return res.status(400).json({ message: "Warehouse Not Found" });
      }

      const warehouseTransaction = await WarehouseTransaction.find({
        warehouseId,
        wartransactionType: "outbound",
      }).populate("shipmentId locationId wartansactonProcessBy");

      res
        .status(200)
        .json({ message: "Warehouse Outbound History", warehouseTransaction });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
);

async function generateTripID() {
  let tripId;
  let exists = true;

  while (exists) {
    tripId = `TRP-${Math.floor(100000 + Math.random() * 900000)}`;

    const existingShipment = await Trip.findOne({
      tripId,
    });

    exists = !!existingShipment;
  }

  return tripId;
}

app.post("/trip", authMiddleware, async (req, res) => {
  const {
    origin,
    destination,
    stops,
    driverId,
    vechileId,
    shipmentIds,
    plannedDeparture,
    plannedArrival,
    plannedDistance,
    tripCost,
  } = req.body;

  try {
    // ── Validate required fields ──────────────────────────────────────────
    if (!origin || !destination) {
      return res
        .status(400)
        .json({ message: "Origin and destination are required" });
    }

    if (!driverId) {
      return res.status(400).json({ message: "Driver is required" });
    }

    if (!vechileId) {
      return res.status(400).json({ message: "Vehicle is required" });
    }

    if (
      !shipmentIds ||
      !Array.isArray(shipmentIds) ||
      shipmentIds.length === 0
    ) {
      return res
        .status(400)
        .json({ message: "At least one shipment is required" });
    }

    if (!plannedDeparture || !plannedArrival) {
      return res
        .status(400)
        .json({ message: "Planned departure and arrival dates are required" });
    }

    // ── Validate stops array ──────────────────────────────────────────────
    if (stops && !Array.isArray(stops)) {
      return res.status(400).json({ message: "Stops must be an array" });
    }

    if (stops && stops.length > 0) {
      for (let i = 0; i < stops.length; i++) {
        if (!stops[i].location || stops[i].stopOrder === undefined) {
          return res.status(400).json({
            message: `Each stop must have a location and stopOrder (issue at stop index ${i})`,
          });
        }
      }
    }

    // ── Verify driver exists and is available ─────────────────────────────
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }
    if (driver.availability !== "available") {
      return res.status(400).json({ message: "Driver is not available" });
    }

    // ── Verify vehicle exists and is available ────────────────────────────
    const vehicle = await Vechile.findById(vechileId);
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    if (vehicle.vstatus !== "Available") {
      return res.status(400).json({ message: "Vehicle is not available" });
    }

    // ── Verify all shipments exist ────────────────────────────────────────
    const shipments = await Shipment.find({ _id: { $in: shipmentIds } });
    if (shipments.length !== shipmentIds.length) {
      return res
        .status(404)
        .json({ message: "One or more shipments not found" });
    }

    // ── Generate unique trip ID ───────────────────────────────────────────
    const tripId = await generateTripID();

    // ── Build sorted stops ────────────────────────────────────────────────
    const sortedStops = stops
      ? stops
          .map((s) => ({
            location: s.location,
            stopOrder: Number(s.stopOrder),
          }))
          .sort((a, b) => a.stopOrder - b.stopOrder)
      : [];

    // ── Create trip ───────────────────────────────────────────────────────
    const trip = await Trip.create({
      tripId,
      origin,
      destination,
      stops: sortedStops,
      driverId,
      vehicleId: vechileId,
      shipmentIds,
      plannedDeparture,
      plannedArrival,
      plannedDistance: plannedDistance || 0,
      tripCost: tripCost || 0,
      status: "planned",
    });

    await createAuditLog({
      userId: req.user._id,
      action: "CREATE_TRIP",
      resource: "Trip",
      resourceId: trip._id.toString(),
    });

    await createAuditLog({
      userId: req.user._id,
      action: "ASSIGN_TRIP",
      resource: "Trip",
      resourceId: trip._id.toString(),
    });

    // ── Update driver availability to "assigned" ──────────────────────────
    await Driver.findByIdAndUpdate(driverId, { availability: "assigned" });

    // ── Update vehicle status to "Assigned" ───────────────────────────────
    await Vechile.findByIdAndUpdate(vechileId, { vstatus: "Assigned" });

    // ── Update each shipment: status → dispatched, tripNo → trip._id ─────
    await Shipment.updateMany(
      { _id: { $in: shipmentIds } },
      {
        $set: {
          tripNo: trip._id,
          driverName: driver._id,
          vehicleNo: vehicle._id,
        },
      },
    );

    const driverFind = await Driver.findById(driverId).populate("userId");

    const driveremail = driverFind.userId.email;

    const driverName = driverFind.userId.name;

    const shipmentNumber = shipments[0].shipmentId;

    const vehicleName = vehicle.vmodel;

    const vehicleNumber = vehicle.vregistrationnumber;

    const sendMail = await sendShipmentAssignedEmail(
      driveremail,
      driverName,
      shipmentNumber,
      origin,
      destination,
      vehicleName,
      vehicleNumber,
      sortedStops,
    );

    res.status(201).json({ message: "Trip created successfully", trip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/trip", authMiddleware, async (req, res) => {
  try {
    const getTrip = await Trip.find()
      .populate({
        path: "driverId",
        populate: { path: "userId", select: "name email phone phonenumber" },
      })
      .populate("vehicleId")
      .populate("shipmentIds")
      .sort({ createdAt: -1 });

    res.status(200).json({ message: "List of Trips", getTrip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/trip/:id", authMiddleware, async (req, res) => {
  const tripId = req.params.id;

  try {
    let getTrip = null;
    if (mongosse.Types.ObjectId.isValid(tripId)) {
      getTrip = await Trip.findById(tripId)
        .populate({
          path: "driverId",
          populate: { path: "userId", select: "name email phone phonenumber" },
        })
        .populate("vehicleId")
        .populate("shipmentIds");
    }
    if (!getTrip) {
      getTrip = await Trip.findOne({ tripId })
        .populate({
          path: "driverId",
          populate: { path: "userId", select: "name email phone phonenumber" },
        })
        .populate("vehicleId")
        .populate("shipmentIds");
    }

    if (!getTrip) {
      return res.status(400).json({ message: "Trip Not Found" });
    }

    res.status(200).json({ message: `Trip ${getTrip.tripId}`, getTrip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.patch("/trip-update/:id", authMiddleware, async (req, res) => {
  const {
    origin,
    destination,
    stops,
    driverId,
    vehicleId,
    shipmentIds,
    plannedDeparture,
    plannedArrival,
    plannedDistance,
    tripCost,
  } = req.body;

  try {
    // ── Find existing trip ────────────────────────────────────────────────
    const existingTrip = await Trip.findById(req.params.id);
    if (!existingTrip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // ── Only allow updates on planned/dispatched trips ────────────────────
    if (!["planned", "dispatched"].includes(existingTrip.status)) {
      return res.status(400).json({
        message: `Cannot update a trip with status "${existingTrip.status}"`,
      });
    }

    // ── Build update object (only include fields that were sent) ──────────
    const updateFields = {};

    if (origin !== undefined) updateFields.origin = origin;
    if (destination !== undefined) updateFields.destination = destination;
    if (plannedDeparture !== undefined)
      updateFields.plannedDeparture = plannedDeparture;
    if (plannedArrival !== undefined)
      updateFields.plannedArrival = plannedArrival;
    if (plannedDistance !== undefined)
      updateFields.plannedDistance = plannedDistance;
    if (tripCost !== undefined) updateFields.tripCost = tripCost;

    // ── Handle stops update ───────────────────────────────────────────────
    if (stops !== undefined) {
      if (!Array.isArray(stops)) {
        return res.status(400).json({ message: "Stops must be an array" });
      }
      for (let i = 0; i < stops.length; i++) {
        if (!stops[i].location || stops[i].stopOrder === undefined) {
          return res.status(400).json({
            message: `Each stop must have a location and stopOrder (issue at stop index ${i})`,
          });
        }
      }
      updateFields.stops = stops
        .map((s) => ({ location: s.location, stopOrder: Number(s.stopOrder) }))
        .sort((a, b) => a.stopOrder - b.stopOrder);
    }

    // ── Handle driver change ──────────────────────────────────────────────
    if (
      driverId !== undefined &&
      String(driverId) !== String(existingTrip.driverId)
    ) {
      // Validate new driver
      const newDriver = await Driver.findById(driverId);
      if (!newDriver) {
        return res.status(404).json({ message: "New driver not found" });
      }
      if (newDriver.availability !== "available") {
        return res.status(400).json({ message: "New driver is not available" });
      }

      // Release old driver
      await Driver.findByIdAndUpdate(existingTrip.driverId, {
        availability: "available",
      });

      // Assign new driver
      await Driver.findByIdAndUpdate(driverId, {
        availability: "assigned",
      });

      updateFields.driverId = driverId;
    }

    // ── Handle vehicle change ─────────────────────────────────────────────
    if (
      vehicleId !== undefined &&
      String(vehicleId) !== String(existingTrip.vehicleId)
    ) {
      // Validate new vehicle
      const newVehicle = await Vechile.findById(vehicleId);
      if (!newVehicle) {
        return res.status(404).json({ message: "New vehicle not found" });
      }
      if (newVehicle.vstatus !== "Available") {
        return res
          .status(400)
          .json({ message: "New vehicle is not available" });
      }

      // Release old vehicle
      await Vechile.findByIdAndUpdate(existingTrip.vehicleId, {
        vstatus: "Available",
      });

      // Assign new vehicle
      await Vechile.findByIdAndUpdate(vehicleId, {
        vstatus: "Assigned",
      });

      updateFields.vehicleId = vehicleId;
    }

    // ── Handle shipmentIds change ─────────────────────────────────────────
    if (shipmentIds !== undefined) {
      if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return res.status(400).json({
          message: "At least one shipment is required",
        });
      }

      // Validate all new shipments exist
      const newShipments = await Shipment.find({ _id: { $in: shipmentIds } });
      if (newShipments.length !== shipmentIds.length) {
        return res.status(404).json({
          message: "One or more shipments not found",
        });
      }

      const oldShipmentIds = existingTrip.shipmentIds.map(String);
      const newShipmentIdStrs = shipmentIds.map(String);

      // Shipments that were removed from trip
      const removedIds = oldShipmentIds.filter(
        (id) => !newShipmentIdStrs.includes(id),
      );

      // Shipments that were added to trip
      const addedIds = newShipmentIdStrs.filter(
        (id) => !oldShipmentIds.includes(id),
      );

      // Determine the current driver and vehicle for shipment assignment
      const finalDriverId = updateFields.driverId || existingTrip.driverId;
      const finalVehicleId = updateFields.vehicleId || existingTrip.vehicleId;

      // Get driver and vehicle _ids for shipment fields
      const assignedDriver = await Driver.findById(finalDriverId);
      const assignedVehicle = await Vechile.findById(finalVehicleId);

      // Clear removed shipments (unlink from this trip)
      if (removedIds.length > 0) {
        await Shipment.updateMany(
          { _id: { $in: removedIds } },
          {
            $set: {
              status: "created",
              tripNo: null,
              driverName: null,
              vehicleNo: null,
            },
          },
        );
      }

      // Assign newly added shipments to this trip
      if (addedIds.length > 0) {
        await Shipment.updateMany(
          { _id: { $in: addedIds } },
          {
            $set: {
              status: "dispatched",
              tripNo: existingTrip._id,
              driverName: assignedDriver ? assignedDriver._id : null,
              vehicleNo: assignedVehicle ? assignedVehicle._id : null,
            },
          },
        );
      }

      updateFields.shipmentIds = shipmentIds;
    }

    // ── If driver or vehicle changed, update all remaining shipments ──────
    if ((updateFields.driverId || updateFields.vehicleId) && !shipmentIds) {
      const finalDriverId = updateFields.driverId || existingTrip.driverId;
      const finalVehicleId = updateFields.vehicleId || existingTrip.vehicleId;

      const assignedDriver = await Driver.findById(finalDriverId);
      const assignedVehicle = await Vechile.findById(finalVehicleId);

      await Shipment.updateMany(
        { _id: { $in: existingTrip.shipmentIds } },
        {
          $set: {
            driverName: assignedDriver ? assignedDriver._id : null,
            vehicleNo: assignedVehicle ? assignedVehicle._id : null,
          },
        },
      );
    }

    // ── Apply update ──────────────────────────────────────────────────────
    const updatedTrip = await Trip.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true },
    );

    if (updatedTrip) {
      await createAuditLog({
        userId: req.user._id,
        action: updateFields.status ? "UPDATE_TRIP_STATUS" : "ASSIGN_TRIP",
        resource: "Trip",
        resourceId: updatedTrip._id.toString(),
      });
    }

    res
      .status(200)
      .json({ message: "Trip updated successfully", trip: updatedTrip });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ── 1. Trip Status API — Dispatch ──────────────────────────────────────
app.patch("/trips/:id/status", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    let trip = null;
    if (mongosse.Types.ObjectId.isValid(id)) {
      trip = await Trip.findById(id);
    }
    if (!trip) {
      trip = await Trip.findOne({ tripId: id });
    }

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Workflow: Dispatch
    if (status === "dispatched") {
      // Verify trip is currently "planned"
      if (trip.status !== "planned") {
        return res.status(400).json({
          message: `Cannot dispatch trip: current status is '${trip.status}'. Trip must be in 'planned' status to be dispatched.`,
        });
      }

      // Verify trip has shipments assigned
      if (!trip.shipmentIds || trip.shipmentIds.length === 0) {
        return res.status(400).json({
          message: "Trip has no shipments assigned",
        });
      }

      // Verify its shipments are ready (at_warehouse)
      // Verify all shipments are already dispatched from warehouse
      const shipments = await Shipment.find({
        _id: { $in: trip.shipmentIds },
      });

      const notReady = shipments.filter((s) => s.status !== "dispatched");

      if (notReady.length > 0) {
        return res.status(400).json({
          message:
            "All shipments must be 'dispatched' before dispatching the trip",
          notReadyShipments: notReady.map((s) => ({
            shipmentId: s.shipmentId,
            status: s.status,
          })),
        });
      }

      // Change Trip: planned -> dispatched
      trip.status = "dispatched";
      await trip.save();

      await createAuditLog({
        userId: req.user._id,
        action: "UPDATE_TRIP_STATUS",
        resource: "Trip",
        resourceId: trip._id.toString(),
      });

      return res.status(200).json({
        message: `Trip ${trip.tripId} status updated to dispatched`,
        trip,
      });
    }

    // Status validation for other transitions
    const validTransitions = {
      planned: ["dispatched", "cancelled"],
      dispatched: ["in_transit", "cancelled"],
      in_transit: ["arrived", "cancelled"],
      arrived: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[trip.status]?.includes(status)) {
      return res.status(400).json({
        message: `Invalid status transition from '${trip.status}' to '${status}'`,
      });
    }

    trip.status = status;
    await trip.save();

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_TRIP_STATUS",
      resource: "Trip",
      resourceId: trip._id.toString(),
    });

    // Release vehicle and driver when trip is completed or cancelled
    if (status === "completed" || status === "cancelled") {
      if (trip.vehicleId) {
        await Vechile.findByIdAndUpdate(trip.vehicleId, {
          vstatus: "Available",
        });
      }
      if (trip.driverId) {
        await Driver.findByIdAndUpdate(trip.driverId, {
          availability: "available",
        });
      }
    }

    return res.status(200).json({
      message: `Trip ${trip.tripId} status updated to ${status}`,
      trip,
    });
  } catch (error) {
    console.error("TRIP STATUS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// ── 2. Trip Departure API ──────────────────────────────────────────────
app.patch("/trips/:id/depart", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    let trip = null;
    if (mongosse.Types.ObjectId.isValid(id)) {
      trip = await Trip.findById(id);
    }
    if (!trip) {
      trip = await Trip.findOne({ tripId: id });
    }

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Verify current trip status is dispatched
    if (trip.status !== "dispatched") {
      return res.status(400).json({
        message: `Cannot depart trip: current status is '${trip.status}'. Trip must be in 'dispatched' status.`,
      });
    }

    // Set trip status and actualDeparture
    const departureTime = new Date();
    trip.status = "in_transit";
    trip.actualDeparture = departureTime;
    await trip.save();

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_TRIP_STATUS",
      resource: "Trip",
      resourceId: trip._id.toString(),
    });

    // Update all shipments belonging to this trip: dispatched -> in_transit
    if (trip.shipmentIds && trip.shipmentIds.length > 0) {
      await Shipment.updateMany(
        { _id: { $in: trip.shipmentIds } },
        { $set: { status: "in_transit" } },
      );

      // Create timeline/event for each shipment
      const updatedBy = req.user?.userId || req.user?._id || null;
      const historyRecords = trip.shipmentIds.map((shipmentId) => ({
        shipmentId,
        status: "in_transit",
        notes: "Trip departed, shipment in transit",
        updatedBy,
      }));
      await ShipmentStatusHistory.insertMany(historyRecords);
    }

    return res.status(200).json({
      message: `Trip ${trip.tripId} departed successfully`,
      trip,
      actualDeparture: departureTime,
    });
  } catch (error) {
    console.error("TRIP DEPART ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// ── 3. Trip Arrival API ────────────────────────────────────────────────
app.patch("/trips/:id/arrive", authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    let trip = null;
    if (mongosse.Types.ObjectId.isValid(id)) {
      trip = await Trip.findById(id);
    }
    if (!trip) {
      trip = await Trip.findOne({ tripId: id });
    }

    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }

    // Verify current trip status is in_transit
    if (trip.status !== "in_transit") {
      return res.status(400).json({
        message: `Cannot mark trip as arrived: current status is '${trip.status}'. Trip must be in 'in_transit' status.`,
      });
    }

    // Set trip status and actualArrival (do NOT automatically mark shipments as delivered)
    const arrivalTime = new Date();
    trip.status = "arrived";
    trip.actualArrival = arrivalTime;
    await trip.save();

    await createAuditLog({
      userId: req.user._id,
      action: "UPDATE_TRIP_STATUS",
      resource: "Trip",
      resourceId: trip._id.toString(),
    });

    return res.status(200).json({
      message: `Trip ${trip.tripId} marked as arrived`,
      trip,
      actualArrival: arrivalTime,
    });
  } catch (error) {
    console.error("TRIP ARRIVE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

//delivery management
app.patch(
  "/delivery-fail-note/:shipmentId",
  authMiddleware,
  async (req, res) => {
    const { reason, notes } = req.body;
    const shipmentId = req.params.shipmentId;

    try {
      if (!reason || !notes) {
        return res
          .status(400)
          .json({ message: "Please Fill All The Detailes" });
      }

      const isHexId = /^[0-9a-fA-F]{24}$/.test(String(shipmentId).trim());
      let findShipment = isHexId ? await Shipment.findById(shipmentId) : null;
      if (!findShipment) {
        findShipment = await Shipment.findOne({
          $or: [{ shipmentId: shipmentId }, { trackingId: shipmentId }],
        });
      }

      if (!findShipment) {
        return res.status(400).json({ message: "Shipment Not Found" });
      }

      let findDelivery = await Delivery.findOne({
        $or: [
          { shipmentId: findShipment._id },
          ...(isHexId ? [{ shipmentId: shipmentId }] : []),
        ],
      });

      if (!findDelivery) {
        findDelivery = new Delivery({
          shipmentId: findShipment._id,
          status: "failed",
          reason,
          notes,
        });
      } else {
        findDelivery.reason = reason;
        findDelivery.notes = notes;
        findDelivery.status = "failed";
      }

      await findDelivery.save();

      await createAuditLog({
        userId: req.user._id,
        action: "DELIVERY_FAILED",
        resource: "Delivery",
        resourceId: findDelivery._id.toString(),
      });

      res.status(200).json({
        message: "Reason & Note are Submited",
        delivery: findDelivery,
      });
    } catch (error) {
      console.error("DELIVERY FAIL NOTE ERROR:", error);
      return res.status(500).json({ message: error.message });
    }
  },
);

app.patch(
  "/delivery-reattempt-scheduled/:deliveryId",
  authMiddleware,
  async (req, res) => {
    const deliveryId = req.params.deliveryId;
    const { reattemptDate, driverName, driverId, notes } = req.body;

    try {
      const isHexId = /^[0-9a-fA-F]{24}$/.test(String(deliveryId).trim());
      let findDeliveryId = isHexId ? await Delivery.findById(deliveryId) : null;
      if (!findDeliveryId) {
        findDeliveryId = await Delivery.findOne({ shipmentId: deliveryId });
      }

      if (!findDeliveryId) {
        return res.status(400).json({ message: "Delivery Not Found" });
      }

      findDeliveryId.status = "reattempt_scheduled";
      findDeliveryId.attemptNumber = (findDeliveryId.attemptNumber || 1) + 1;
      if (reattemptDate) {
        findDeliveryId.reattemptDate = reattemptDate;
      }
      if (notes) {
        findDeliveryId.notes = notes;
      }

      await findDeliveryId.save();

      await createAuditLog({
        userId: req.user._id,
        action: "DELIVERY_REATTEMPT_SCHEDULED",
        resource: "Delivery",
        resourceId: findDeliveryId._id.toString(),
      });

      if (findDeliveryId.shipmentId && (driverName || driverId)) {
        const updateShipment = {};
        if (driverName) updateShipment.driverName = driverName;
        if (driverId) updateShipment.driverId = driverId;
        await Shipment.findByIdAndUpdate(
          findDeliveryId.shipmentId,
          updateShipment,
        );
      }

      res.status(200).json({
        message: "Delivery Rescheduled Successfully",
        delivery: findDeliveryId,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

app.get("/deliveries", authMiddleware, async (req, res) => {
  try {
    // 1. Auto-sync existing shipments that don't have a Delivery record yet
    const existingShipments = await Shipment.find().select("_id status").lean();
    if (existingShipments && existingShipments.length > 0) {
      const existingDeliveries = await Delivery.find()
        .select("shipmentId")
        .lean();
      const existingDelShipmentIds = new Set(
        existingDeliveries.map((d) => String(d.shipmentId)),
      );

      const missingShipments = existingShipments.filter(
        (s) => !existingDelShipmentIds.has(String(s._id)),
      );
      if (missingShipments.length > 0) {
        const toInsert = missingShipments.map((s) => ({
          shipmentId: s._id,
          status:
            s.status === "delivered"
              ? "delivered"
              : s.status === "out_for_delivery"
                ? "out_for_delivery"
                : s.status === "failed_delivery"
                  ? "failed"
                  : "pending",
          reason: null,
          notes: "",
        }));
        await Delivery.insertMany(toInsert, { ordered: false }).catch(() => {});
      }
    }

    // 2. Query all deliveries and populate shipment, customer, driver and vehicle
    const deliveries = await Delivery.find()
      .populate({
        path: "shipmentId",
        populate: [
          { path: "customerId" },
          {
            path: "driverName",
            populate: {
              path: "userId",
              select: "name email phonenumber",
            },
          },
          { path: "vehicleNo" },
        ],
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({ message: "List of Delivries", deliveries });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/delivery/shipment/:shipmentId", authMiddleware, async (req, res) => {
  const shipmentId = req.params.shipmentId;

  try {
    const isHexId = /^[0-9a-fA-F]{24}$/.test(String(shipmentId).trim());
    let verifyShipment = isHexId ? await Shipment.findById(shipmentId) : null;
    if (!verifyShipment) {
      verifyShipment = await Shipment.findOne({
        $or: [{ shipmentId: shipmentId }, { trackingId: shipmentId }],
      });
    }

    if (!verifyShipment) {
      return res.status(400).json({ message: "Shipment Not Found" });
    }

    const deliveryget = await Delivery.findOne({
      $or: [
        { shipmentId: verifyShipment._id },
        ...(isHexId ? [{ shipmentId: shipmentId }] : []),
      ],
    });

    if (!deliveryget) {
      return res.status(400).json({ message: "Delivery Not Found" });
    }

    res.status(200).json({
      message: "Delivery Shipment Info",
      delivery: deliveryget,
      deliveryget,
      data: deliveryget,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get(
  "/deliveries/tracking/:trackingId",
  authMiddleware,
  async (req, res) => {
    const trackingId = req.params.trackingId;

    try {
      const verifyTrackingId = await Shipment.findOne({
        trackingId: trackingId,
      });

      if (!verifyTrackingId) {
        return res.status(400).json({ message: "Tracking Id Not Found" });
      }

      const deliveryFind = await Delivery.findOne({
        shipmentId: verifyTrackingId._id,
      });

      if (!deliveryFind) {
        return res
          .status(400)
          .json({ message: "Delivery of Shipment Not Found" });
      }

      res.status(200).json({ message: "Delivery Found", deliveryFind });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
);

// Handler for sending receiver delivery OTP
const handleSendReceiverDeliveryOtp = async (req, res) => {
  const shipmentId = req.params.shipmentId;

  try {
    let findShipment = null;
    if (mongosse.Types.ObjectId.isValid(shipmentId)) {
      findShipment = await Shipment.findById(shipmentId);
    }
    if (!findShipment) {
      findShipment = await Shipment.findOne({
        $or: [{ trackingId: shipmentId }, { shipmentId: shipmentId }],
      });
    }

    if (!findShipment) {
      return res.status(404).json({ message: "Shipment Not Found" });
    }

    let receiverEmail = (findShipment.receiverEmail || "").trim();
    if (!receiverEmail && findShipment.customerId) {
      const cust = await Customer.findById(findShipment.customerId);
      if (cust && cust.email) {
        receiverEmail = cust.email.trim();
      }
    }

    if (!receiverEmail) {
      return res.status(400).json({
        message: "Receiver email address is missing for this shipment.",
      });
    }

    const receiverName = findShipment.receiverName || "Valued Customer";
    const trackingId = findShipment.trackingId || findShipment.shipmentId;
    const otp = crypto.randomInt(1000, 10000).toString();

    // Store OTP with 10-minute expiry
    findShipment.deliveryOtp = otp;
    findShipment.deliveryOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    findShipment.deliveryOtpVerified = false;
    await findShipment.save();

    await Delivery.updateMany(
      { shipmentId: findShipment._id },
      {
        $set: {
          deliveryOtp: otp,
          deliveryOtpExpiresAt: findShipment.deliveryOtpExpiresAt,
          deliveryOtpVerified: false,
        },
      },
    );

    await sendDeliveryOtpEmail(receiverEmail, otp, receiverName, trackingId);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      receiverEmail,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Handler for verifying receiver delivery OTP
const handleVerifyReceiverDeliveryOtp = async (req, res) => {
  const shipmentId = req.params.shipmentId;
  const enteredOtp =
    req.body && req.body.otp ? String(req.body.otp).trim() : "";

  try {
    let findShipment = null;
    if (mongosse.Types.ObjectId.isValid(shipmentId)) {
      findShipment = await Shipment.findById(shipmentId);
    }
    if (!findShipment) {
      findShipment = await Shipment.findOne({
        $or: [{ trackingId: shipmentId }, { shipmentId: shipmentId }],
      });
    }

    if (!findShipment) {
      return res.status(404).json({ message: "Shipment Not Found" });
    }

    if (!findShipment.deliveryOtp) {
      return res.status(400).json({
        message:
          "No OTP was requested for this shipment. Please generate an OTP first.",
      });
    }

    if (
      findShipment.deliveryOtpExpiresAt &&
      new Date() > new Date(findShipment.deliveryOtpExpiresAt)
    ) {
      return res.status(400).json({
        message: "Delivery OTP has expired. Please request a new OTP.",
      });
    }

    if (findShipment.deliveryOtp !== enteredOtp) {
      return res.status(400).json({
        message:
          "Invalid OTP code. Please enter the OTP sent to the receiver's email.",
      });
    }

    findShipment.deliveryOtpVerified = true;
    await findShipment.save();

    await Delivery.updateMany(
      { shipmentId: findShipment._id },
      { $set: { deliveryOtpVerified: true } },
    );

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Dual-purpose endpoint: if req.body.otp is supplied, verify it; otherwise, send OTP to receiver
app.post(
  "/receiver/otpverify/:shipmentId",
  authMiddleware,
  async (req, res) => {
    if (req.body && req.body.otp) {
      return handleVerifyReceiverDeliveryOtp(req, res);
    }
    return handleSendReceiverDeliveryOtp(req, res);
  },
);

// Dedicated route aliases
app.post(
  "/receiver/send-delivery-otp/:shipmentId",
  authMiddleware,
  handleSendReceiverDeliveryOtp,
);

app.post(
  "/receiver/verify-delivery-otp/:shipmentId",
  authMiddleware,
  handleVerifyReceiverDeliveryOtp,
);

app.post("/pod-submit/:shipmentId", authMiddleware, async (req, res) => {
  const shipmentId = req.params.shipmentId;

  const {
    name,
    recipientName,
    relationship,
    recipientRelation,
    phone,
    recipientPhone,
    deliveryAddress,
    location,
    photo,
    photoUrl,
    signatureData,
    signatureUrl,
    notes,
    podDocumentUrl,
    otpVerified,
  } = req.body;

  try {
    let findShipment = null;
    if (mongosse.Types.ObjectId.isValid(shipmentId)) {
      findShipment = await Shipment.findById(shipmentId);
    }
    if (!findShipment) {
      findShipment = await Shipment.findOne({
        $or: [{ trackingId: shipmentId }, { shipmentId: shipmentId }],
      });
    }

    if (!findShipment) {
      return res.status(404).json({ message: "Shipment Not Found" });
    }

    const finalReceiverName = String(
      name || recipientName || findShipment.receiverName || "Customer",
    ).trim();

    if (!finalReceiverName) {
      return res.status(400).json({ message: "Receiver name is required" });
    }

    const finalRelationship = String(
      relationship || recipientRelation || "Self (Customer)",
    ).trim();

    const finalPhone = String(
      phone || recipientPhone || findShipment.receiverPhoneNumber || "",
    ).trim();

    const finalAddress = String(
      deliveryAddress ||
        location ||
        findShipment.receiverAddress ||
        "Customer Address",
    ).trim();

    const finalNotes = String(notes || "Delivered safely.").trim();

    // Determine submittedBy user ObjectId
    const tokenUserId = req.user?.userId || req.user?._id;
    let submittedBy = null;
    if (tokenUserId && mongosse.Types.ObjectId.isValid(tokenUserId)) {
      submittedBy = tokenUserId;
    } else {
      const anyUser = await User.findOne();
      submittedBy = anyUser ? anyUser._id : null;
    }

    const podData = {
      shipmentId: findShipment._id,
      receiver: {
        name: finalReceiverName,
        relationship: finalRelationship,
        phone: finalPhone,
      },
      deliveryAddress: finalAddress,
      deliveryDate: new Date(),
      otpVerified: otpVerified !== undefined ? Boolean(otpVerified) : true,
      signatureUrl: String(signatureData || signatureUrl || ""),
      photoUrl: String(photo || photoUrl || ""),
      notes: finalNotes,
      podDocumentUrl: String(podDocumentUrl || ""),
      submittedBy,
    };

    // 1. Save or update POD
    const savedPod = await POD.findOneAndUpdate(
      { shipmentId: findShipment._id },
      { $set: podData },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    // 2. Update Shipment status to delivered
    findShipment.status = "delivered";
    await findShipment.save();

    await ShipmentStatusHistory.create({
      shipmentId: findShipment._id,
      status: "delivered",
    }).catch(() => {});

    // 3. Update Delivery collection
    await Delivery.findOneAndUpdate(
      { shipmentId: findShipment._id },
      {
        $set: {
          status: "delivered",
          deliveredAt: new Date(),
          notes: finalNotes,
        },
        $unset: {
          reattemptDate: "",
          reason: "",
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    await createAuditLog({
      userId: req.user._id || submittedBy,
      action: "CREATE_POD",
      resource: "POD",
      resourceId: savedPod._id.toString(),
    });

    await createAuditLog({
      userId: req.user._id || submittedBy,
      action: "DELIVERY_COMPLETED",
      resource: "Delivery",
      resourceId: findShipment._id.toString(),
    });

    await createAuditLog({
      userId: req.user._id || submittedBy,
      action: "UPDATE_SHIPMENT_STATUS",
      resource: "Shipment",
      resourceId: findShipment._id.toString(),
    });

    return res.status(200).json({
      success: true,
      message: "Proof of Delivery submitted successfully",
      pod: savedPod,
      shipment: findShipment,
    });
  } catch (error) {
    console.error("Error submitting POD:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.get("/pod/:shipmentId", authMiddleware, async (req, res) => {
  const shipmentId = req.params.shipmentId;
  try {
    let findShipment = null;
    if (mongosse.Types.ObjectId.isValid(shipmentId)) {
      findShipment = await Shipment.findById(shipmentId);
    }
    if (!findShipment) {
      findShipment = await Shipment.findOne({
        $or: [{ trackingId: shipmentId }, { shipmentId: shipmentId }],
      });
    }

    let pod = null;
    if (findShipment) {
      pod = await POD.findOne({ shipmentId: findShipment._id }).populate(
        "submittedBy",
        "name email",
      );
    }

    if (!pod && mongosse.Types.ObjectId.isValid(shipmentId)) {
      pod = await POD.findOne({ shipmentId }).populate(
        "submittedBy",
        "name email",
      );
    }

    if (!pod) {
      return res
        .status(404)
        .json({ message: "POD not found for this shipment" });
    }

    return res.status(200).json({ success: true, pod, shipment: findShipment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// Alias for GET /pod-submit/:shipmentId
app.get("/pod-submit/:shipmentId", authMiddleware, async (req, res) => {
  const shipmentId = req.params.shipmentId;
  try {
    let findShipment = null;
    if (mongosse.Types.ObjectId.isValid(shipmentId)) {
      findShipment = await Shipment.findById(shipmentId);
    }
    if (!findShipment) {
      findShipment = await Shipment.findOne({
        $or: [{ trackingId: shipmentId }, { shipmentId: shipmentId }],
      });
    }

    let pod = null;
    if (findShipment) {
      pod = await POD.findOne({ shipmentId: findShipment._id }).populate(
        "submittedBy",
        "name email",
      );
    }

    if (!pod && mongosse.Types.ObjectId.isValid(shipmentId)) {
      pod = await POD.findOne({ shipmentId }).populate(
        "submittedBy",
        "name email",
      );
    }

    if (!pod) {
      return res
        .status(404)
        .json({ message: "POD not found for this shipment" });
    }

    return res.status(200).json({ success: true, pod, shipment: findShipment });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// GET all PODs
app.get("/pods", authMiddleware, async (req, res) => {
  try {
    const pods = await POD.find()
      .populate({
        path: "shipmentId",
        populate: [
          { path: "customerId", select: "customerId name email phonenumber" },
          {
            path: "driverName",
            populate: { path: "userId", select: "name email" },
          },
          { path: "vehicleNo", select: "vregistrationnumber vtype" },
        ],
      })
      .populate("submittedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, pods });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.post("/driver-reminder/:driverId", authMiddleware, async (req, res) => {
  const driverId = req.params.driverId;

  try {
    const findDriverid = await Driver.findOne({ _id: driverId });

    if (!findDriverid) {
      return res.status(400).json({ message: "Driver Not Found" });
    }

    const driverGet = await Driver.findById(driverId).populate("userId");

    const driverName = driverGet.userId.name;

    const driverLicence = driverGet.license.licensenumber;

    const driverExpiredate = driverGet.license.expiredate;

    const driverEmail = driverGet.userId.email;

    const drvId = driverGet.driverId;

    const senddMail = await sendDrivertoReminder(
      driverEmail,
      driverName,
      driverLicence,
      driverExpiredate,
      drvId,
    );

    res.status(200).json({ message: "Email Send Successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

// ── Helper: Format relative time for dashboard alerts ────────────────────────
function formatDashboardRelativeTime(date) {
  if (!date) return "Recently";
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}

// ── GET /dashboard/overview ──────────────────────────────────────────────────
app.get("/dashboard/overview", authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // 1. Shipments KPI
    const totalShipments = await Shipment.countDocuments();
    const pendingShipments = await Shipment.countDocuments({
      status: {
        $in: ["created", "pickup_scheduled", "picked_up", "at_warehouse"],
      },
    });
    const inTransitShipments = await Shipment.countDocuments({
      status: { $in: ["dispatched", "in_transit", "out_for_delivery"] },
    });
    const deliveredShipments = await Shipment.countDocuments({
      status: "delivered",
    });
    const failedShipments = await Shipment.countDocuments({
      status: "failed_delivery",
    });

    // 2. Deliveries KPI
    const deliveriesTodayCount = await Delivery.countDocuments({
      $or: [
        { createdAt: { $gte: startOfDay } },
        { deliveredAt: { $gte: startOfDay } },
        { reattemptDate: { $gte: startOfDay, $lte: endOfDay } },
      ],
    });
    const completedToday = await Delivery.countDocuments({
      status: "delivered",
      deliveredAt: { $gte: startOfDay },
    });
    const pendingDeliveries = await Delivery.countDocuments({
      status: { $in: ["pending", "out_for_delivery", "reattempt_scheduled"] },
    });
    const totalDeliveries = await Delivery.countDocuments();
    const allCompletedDeliveries = await Delivery.countDocuments({
      status: "delivered",
    });

    // 3. Fleet KPI
    const totalFleet = await Vechile.countDocuments();
    const availableFleet = await Vechile.countDocuments({
      vstatus: { $regex: /^available$/i },
    });
    const assignedFleet = await Vechile.countDocuments({
      vstatus: {
        $in: ["Assigned", "assigned", "In Maintenance", "in maintenance"],
      },
    });

    // 4. Drivers KPI
    const totalDrivers = await Driver.countDocuments();
    const availableDrivers = await Driver.countDocuments({
      availability: "available",
    });
    const assignedDrivers = await Driver.countDocuments({
      availability: { $in: ["assigned", "unavailable"] },
    });
    const driverWorkload =
      totalDrivers > 0 ? Math.round((assignedDrivers / totalDrivers) * 100) : 0;

    // 5. Warehouse KPI (Currently in warehouse / active in transit only, excluding historical delivered)
    // Currently inbound: packages picked up en-route to warehouse or currently at warehouse
    const inboundCount = await Shipment.countDocuments({
      status: { $in: ["picked_up", "at_warehouse"] },
    });

    // Currently outbound: packages at warehouse or dispatched
    const outboundCount = await Shipment.countDocuments({
      status: { $in: ["at_warehouse", "dispatched"] },
    });

    // Storage: Active packages currently stored in warehouse bins
    const activeStorageCount = await WarehouseStorage.countDocuments({
      warstorStatus: "store",
    });
    const totalLocations = await WarehouseLocation.countDocuments();
    const fullLocations = await WarehouseLocation.countDocuments({
      warlocStatus: "full",
    });
    const currentlyOccupied = Math.max(activeStorageCount, fullLocations);
    const storageUsedPct =
      totalLocations > 0
        ? Math.min(100, Math.round((currentlyOccupied / totalLocations) * 100))
        : 0;

    // 6. Trips KPI
    const activeTrips = await Trip.countDocuments({
      status: { $in: ["dispatched", "in_transit"] },
    });
    const completedTrips = await Trip.countDocuments({ status: "completed" });
    const tripsTodayCount = await Trip.countDocuments({
      $or: [
        { createdAt: { $gte: startOfDay } },
        { plannedDeparture: { $gte: startOfDay, $lte: endOfDay } },
        { actualDeparture: { $gte: startOfDay } },
      ],
    });
    const totalTrips = await Trip.countDocuments();

    // 7. Shipment Volume (Weekly, Monthly, Yearly)
    const requestedTimeframe = (req.query.timeframe || "weekly").toLowerCase();

    // 7a. Weekly (Mon - Sun)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const volumeMap = {
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
      Sun: 0,
    };

    const d = new Date();
    const currentDay = d.getDay();
    const diff = d.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    const weekShipments = await Shipment.find({
      createdAt: { $gte: startOfWeek },
    })
      .select("createdAt")
      .lean();

    if (weekShipments.length > 0) {
      for (const s of weekShipments) {
        const dt = new Date(s.createdAt);
        const name = dayNames[dt.getDay()];
        if (volumeMap[name] !== undefined) volumeMap[name]++;
      }
    } else {
      const allRecentShipments = await Shipment.find()
        .select("createdAt")
        .lean();
      for (const s of allRecentShipments) {
        const dt = new Date(s.createdAt);
        const name = dayNames[dt.getDay()];
        if (volumeMap[name] !== undefined) volumeMap[name]++;
      }
    }

    const shipmentVolumeWeekly = dayOrder.map((day) => ({
      day,
      shipments: volumeMap[day],
    }));

    // 7b. Monthly (Week 1 - Week 5)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthMap = {
      "Week 1": 0,
      "Week 2": 0,
      "Week 3": 0,
      "Week 4": 0,
      "Week 5": 0,
    };

    const monthShipments = await Shipment.find({
      createdAt: { $gte: startOfMonth },
    })
      .select("createdAt")
      .lean();

    const targetMonthShipments =
      monthShipments.length > 0
        ? monthShipments
        : await Shipment.find().select("createdAt").lean();

    for (const s of targetMonthShipments) {
      const dt = new Date(s.createdAt);
      const weekIndex = Math.min(5, Math.max(1, Math.ceil(dt.getDate() / 7)));
      const wKey = `Week ${weekIndex}`;
      if (monthMap[wKey] !== undefined) monthMap[wKey]++;
    }

    const shipmentVolumeMonthly = Object.keys(monthMap).map((day) => ({
      day,
      shipments: monthMap[day],
    }));

    // 7c. Yearly (Jan - Dec)
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const yearMap = {};
    monthNames.forEach((m) => {
      yearMap[m] = 0;
    });

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const yearShipments = await Shipment.find({
      createdAt: { $gte: startOfYear },
    })
      .select("createdAt")
      .lean();

    const targetYearShipments =
      yearShipments.length > 0
        ? yearShipments
        : await Shipment.find().select("createdAt").lean();

    for (const s of targetYearShipments) {
      const dt = new Date(s.createdAt);
      const mName = monthNames[dt.getMonth()];
      if (yearMap[mName] !== undefined) yearMap[mName]++;
    }

    const shipmentVolumeYearly = monthNames.map((day) => ({
      day,
      shipments: yearMap[day],
    }));

    // Active volume based on timeframe
    let activeShipmentVolume = shipmentVolumeWeekly;
    if (requestedTimeframe === "yearly") {
      activeShipmentVolume = shipmentVolumeYearly;
    } else if (requestedTimeframe === "monthly") {
      activeShipmentVolume = shipmentVolumeMonthly;
    }

    const shipmentVolume = activeShipmentVolume;

    // 8. Delivery Performance
    const failedCount =
      (await Shipment.countDocuments({ status: "failed_delivery" })) +
      (await Delivery.countDocuments({ status: "failed" }));

    const deliveredList = await Shipment.find({ status: "delivered" })
      .select("expectedDeliveryDate updatedAt")
      .lean();

    let onTimeCount = 0;
    let delayedCount = 0;

    for (const shp of deliveredList) {
      if (
        shp.expectedDeliveryDate &&
        new Date(shp.updatedAt) > new Date(shp.expectedDeliveryDate)
      ) {
        delayedCount++;
      } else {
        onTimeCount++;
      }
    }

    const activeDelayed = await Shipment.countDocuments({
      status: {
        $in: [
          "created",
          "pickup_scheduled",
          "picked_up",
          "at_warehouse",
          "dispatched",
          "in_transit",
          "out_for_delivery",
        ],
      },
      expectedDeliveryDate: { $lt: now },
    });
    delayedCount += activeDelayed;

    const deliveryPerformance = [
      { label: "On time", value: onTimeCount },
      { label: "Delayed", value: delayedCount },
      { label: "Failed", value: failedCount },
    ];

    // 9. Alerts
    const alerts = [];

    // Failed deliveries
    const failedDeliveries = await Delivery.find({
      status: { $in: ["failed", "failed_delivery"] },
    })
      .populate("shipmentId")
      .sort({ updatedAt: -1 })
      .limit(3)
      .lean();

    for (const d of failedDeliveries) {
      const tracking =
        d.shipmentId?.trackingId || d.shipmentId?.shipmentId || "Unknown";
      alerts.push({
        id: `fail_${d._id}`,
        type: "failedDelivery",
        message: `Shipment #${tracking} failed delivery — ${d.reason || "delivery issue recorded"}`,
        time: formatDashboardRelativeTime(d.updatedAt || d.createdAt),
        timestamp: new Date(d.updatedAt || d.createdAt).getTime(),
      });
    }

    if (alerts.length === 0) {
      const failedShipmentsList = await Shipment.find({
        status: "failed_delivery",
      })
        .sort({ updatedAt: -1 })
        .limit(3)
        .lean();
      for (const s of failedShipmentsList) {
        alerts.push({
          id: `fail_shp_${s._id}`,
          type: "failedDelivery",
          message: `Shipment #${s.trackingId || s.shipmentId} delivery failed`,
          time: formatDashboardRelativeTime(s.updatedAt || s.createdAt),
          timestamp: new Date(s.updatedAt || s.createdAt).getTime(),
        });
      }
    }

    // Driver license expiry
    const drivers = await Driver.find().populate("userId").lean();
    for (const drv of drivers) {
      if (drv.license?.expiredate) {
        const expDate = new Date(drv.license.expiredate);
        const diffDays = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
        const drvName = drv.userId?.name || drv.name || drv.driverId;
        if (diffDays <= 30 && diffDays >= 0) {
          alerts.push({
            id: `drv_exp_${drv._id}`,
            type: "documentExpiry",
            message: `Driver license for ${drvName} expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
            time: `${diffDays}d left`,
            timestamp: expDate.getTime(),
          });
        } else if (diffDays < 0 && diffDays >= -30) {
          alerts.push({
            id: `drv_exp_past_${drv._id}`,
            type: "documentExpiry",
            message: `Driver license for ${drvName} expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`,
            time: "Urgent",
            timestamp: expDate.getTime(),
          });
        }
      }
    }

    // Vehicle documents expiry
    const vehicles = await Vechile.find().lean();
    for (const veh of vehicles) {
      const docs = veh.documents || {};
      const docKeys = ["insurance", "rc", "puc", "fitness", "permit"];
      for (const key of docKeys) {
        const doc = docs[key];
        if (doc?.expireDate) {
          const expDate = new Date(doc.expireDate);
          const diffDays = Math.round((expDate - now) / (1000 * 60 * 60 * 24));
          const docLabel = doc.documentName || key.toUpperCase();
          if (diffDays <= 30 && diffDays >= 0) {
            alerts.push({
              id: `veh_${key}_${veh._id}`,
              type: "documentExpiry",
              message: `${docLabel} for vehicle ${veh.vregistrationnumber} expires in ${diffDays} day${diffDays === 1 ? "" : "s"}`,
              time: `${diffDays}d left`,
              timestamp: expDate.getTime(),
            });
          } else if (diffDays < 0 && diffDays >= -30) {
            alerts.push({
              id: `veh_${key}_past_${veh._id}`,
              type: "documentExpiry",
              message: `${docLabel} for vehicle ${veh.vregistrationnumber} expired ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? "" : "s"} ago`,
              time: "Urgent",
              timestamp: expDate.getTime(),
            });
          }
        }
      }
    }

    // Trips
    const recentTrips = await Trip.find()
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(3)
      .lean();
    for (const t of recentTrips) {
      const statusText =
        t.status === "dispatched"
          ? "dispatched from"
          : t.status === "in_transit"
            ? "in transit to"
            : t.status === "completed"
              ? "completed at"
              : "scheduled for";
      alerts.push({
        id: `trip_${t._id}`,
        type: "dispatch",
        message: `Trip #${t.tripId} ${statusText} ${t.destination || t.origin}`,
        time: formatDashboardRelativeTime(
          t.actualDeparture || t.updatedAt || t.createdAt,
        ),
        timestamp: new Date(
          t.actualDeparture || t.updatedAt || t.createdAt,
        ).getTime(),
      });
    }

    alerts.sort((a, b) => b.timestamp - a.timestamp);

    return res.status(200).json({
      success: true,
      data: {
        shipments: {
          total: totalShipments,
          pending: pendingShipments,
          inTransit: inTransitShipments,
          delivered: deliveredShipments,
          failed: failedShipments,
        },
        deliveries: {
          today:
            deliveriesTodayCount > 0
              ? deliveriesTodayCount
              : totalDeliveries > 0
                ? totalDeliveries
                : 0,
          completed:
            completedToday > 0 ? completedToday : allCompletedDeliveries,
          pending: pendingDeliveries,
        },
        fleet: {
          total: totalFleet,
          available: availableFleet,
          assigned: assignedFleet,
        },
        drivers: {
          available: availableDrivers,
          assigned: assignedDrivers,
          workload: driverWorkload,
        },
        warehouse: {
          inbound: inboundCount,
          outbound: outboundCount,
          storageUsedPct,
        },
        trips: {
          today: tripsTodayCount > 0 ? tripsTodayCount : totalTrips,
          active: activeTrips,
          completed: completedTrips,
        },
        shipmentVolume,
        shipmentVolumes: {
          weekly: shipmentVolumeWeekly,
          monthly: shipmentVolumeMonthly,
          yearly: shipmentVolumeYearly,
        },
        timeframe: requestedTimeframe,
        deliveryPerformance,
        alerts: alerts.slice(0, 6),
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/report", authMiddleware, async (req, res) => {
  try {
    const getShipmentDetail = await Shipment.find()
      .populate("customerId")
      .populate({ path: "driverName", populate: { path: "userId" } })
      .populate("vehicleNo")
      .populate("tripNo");

    const getDriverDetail = await Driver.find().populate("userId");

    const getvehicleDetail = await Vechile.find();

    const getVehicleMaintenanceDetail = await VehicleMaintenance.find();

    const getVehicleFuelDetail = await VehicleFuel.find();

    const getWarehouseDetail = await Warehouse.find();

    const getWarehouseStorageDetail = await WarehouseStorage.find()
      .populate("warehouseId")
      .populate("shipmentId")
      .populate("locationId");

    const getWarehouseLocationDetail = await WarehouseLocation.find();

    const getWarehouseTxnDetail = await WarehouseTransaction.find()
      .populate("warehouseId")
      .populate("shipmentId")
      .populate("locationId")
      .populate("wartansactonProcessBy");

    const getTripDetail = await Trip.find()
      .populate({ path: "driverId", populate: { path: "userId" } })
      .populate("vehicleId")
      .populate("shipmentIds");

    const getDeliveryDetail = await Delivery.find().populate({
      path: "shipmentId",
      populate: [
        { path: "customerId" },
        { path: "driverName", populate: { path: "userId" } },
        { path: "vehicleNo" },
      ],
    });

    const getCustomerDetail = await Customer.find();

    // ── Helper Status Mappers ──────────────────────────────────────────────
    const mapShipmentStatus = (s) => {
      if (!s) return "Created";
      const map = {
        created: "Created",
        pickup_scheduled: "Pickup Scheduled",
        picked_up: "Picked Up",
        at_warehouse: "At Warehouse",
        dispatched: "Dispatched",
        in_transit: "In Transit",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        failed_delivery: "Failed Delivery",
      };
      return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
    };

    const mapDeliveryStatus = (s) => {
      if (!s) return "Pending";
      const map = {
        pending: "Pending",
        out_for_delivery: "Out for Delivery",
        delivered: "Delivered",
        failed: "Failed",
        reattempt_scheduled: "Re-attempt Scheduled",
      };
      return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
    };

    const mapTripStatus = (s) => {
      if (!s) return "Planned";
      const map = {
        planned: "Planned",
        dispatched: "Dispatched",
        in_transit: "In Transit",
        arrived: "Arrived",
        completed: "Completed",
        cancelled: "Cancelled",
      };
      return map[s.toLowerCase()] || s.charAt(0).toUpperCase() + s.slice(1);
    };

    // ── Dropdown Options ───────────────────────────────────────────────────
    const customerOptions = [
      "All",
      ...new Set([
        ...getCustomerDetail.map((c) => c.name).filter(Boolean),
        ...getShipmentDetail
          .map((s) => s.customerId?.name || s.senderName)
          .filter(Boolean),
      ]),
    ];

    const driverOptions = [
      "All",
      ...new Set([
        ...getDriverDetail.map((d) => d.userId?.name).filter(Boolean),
        ...getShipmentDetail
          .map((s) => s.driverName?.userId?.name)
          .filter(Boolean),
      ]),
    ];

    const vehicleOptions = [
      "All",
      ...new Set([
        ...getvehicleDetail.map((v) => v.vregistrationnumber).filter(Boolean),
        ...getShipmentDetail
          .map((s) => s.vehicleNo?.vregistrationnumber)
          .filter(Boolean),
      ]),
    ];

    const warehouseOptions = [
      "All",
      ...new Set([
        ...getWarehouseDetail.map((w) => w.warName).filter(Boolean),
        ...getWarehouseTxnDetail
          .map((tx) => tx.warehouseId?.warName)
          .filter(Boolean),
      ]),
    ];

    const options = {
      customers: customerOptions,
      drivers: driverOptions,
      vehicles: vehicleOptions,
      warehouses: warehouseOptions,
    };

    // ── 1. Shipment Report Data ───────────────────────────────────────────
    const shipmentData = getShipmentDetail.map((s) => {
      const assignedTrip =
        s.tripNo ||
        getTripDetail.find(
          (t) =>
            t.shipmentIds &&
            t.shipmentIds.some((id) => id.toString() === s._id.toString()),
        );
      const originStr = s.senderCity
        ? s.senderState
          ? `${s.senderCity}, ${s.senderState}`
          : s.senderCity
        : s.senderAddress || "N/A";
      const destStr = s.receiverCity
        ? s.receiverState
          ? `${s.receiverCity}, ${s.receiverState}`
          : s.receiverCity
        : s.receiverAddress || "N/A";
      const driverName =
        s.driverName?.userId?.name ||
        (typeof s.driverName === "string" ? s.driverName : "") ||
        assignedTrip?.driverId?.userId?.name ||
        "Unassigned";
      const driverPhone =
        s.driverName?.phonenumber ||
        s.driverName?.userId?.phonenumber ||
        assignedTrip?.driverId?.phonenumber ||
        "";
      const vehicleNum =
        s.vehicleNo?.vregistrationnumber ||
        assignedTrip?.vehicleId?.vregistrationnumber ||
        s.vehicleNo?.vmodel ||
        "Unassigned";
      const vehicleDetails = s.vehicleNo?.vmodel
        ? `${s.vehicleNo.vmodel} (${s.vehicleNo.vtype || "Truck"})`
        : assignedTrip?.vehicleId?.vmodel
          ? `${assignedTrip.vehicleId.vmodel} (${assignedTrip.vehicleId.vtype || "Truck"})`
          : "";

      return {
        id: s.shipmentId || String(s._id),
        tracking: s.trackingId || "N/A",
        customer: s.customerId?.name || s.senderName || "Unknown",
        customerContact:
          s.customerId?.phonenumber ||
          s.senderPhoneNumber ||
          s.customerId?.email ||
          s.senderEmail ||
          "",
        status: mapShipmentStatus(s.status),
        driver: driverName,
        driverPhone,
        vehicle: vehicleNum,
        vehicleDetails,
        origin: originStr,
        destination: destStr,
        routeDetails: `${s.packageCount || 1} pkg(s) • ${s.totalWeight || 0} kg • ${s.priority || "Standard"}`,
        date: s.pickupDate
          ? new Date(s.pickupDate).toISOString().split("T")[0]
          : s.createdAt
            ? new Date(s.createdAt).toISOString().split("T")[0]
            : "N/A",
        expectedDate: s.expectedDeliveryDate
          ? new Date(s.expectedDeliveryDate).toISOString().split("T")[0]
          : "",
        totalWeight: s.totalWeight || 0,
        packageCount: s.packageCount || 0,
      };
    });

    // ── 2. Delivery Report Data ───────────────────────────────────────────
    const deliveryData = getDeliveryDetail.map((d) => {
      const s = d.shipmentId || {};
      const fullAddress =
        [
          s.receiverAddress,
          s.receiverCity,
          s.receiverState,
          s.receiverpincode ? `- ${s.receiverpincode}` : null,
        ]
          .filter(Boolean)
          .join(", ") || "N/A";

      const driverName =
        s.driverName?.userId?.name ||
        (typeof s.driverName === "string" ? s.driverName : "") ||
        "Unassigned";
      const driverPhone =
        s.driverName?.phonenumber || s.driverName?.userId?.phonenumber || "";

      return {
        id: d._id
          ? "DEL-" + d._id.toString().slice(-6).toUpperCase()
          : s.shipmentId || "DEL-N/A",
        tracking: s.trackingId || "N/A",
        customer: s.customerId?.name || s.senderName || "N/A",
        recipient: s.receiverName || "",
        address: fullAddress,
        driver: driverName,
        driverPhone,
        attempts: d.attemptNumber || 1,
        status: mapDeliveryStatus(d.status),
        deliveryDate: d.deliveredAt
          ? new Date(d.deliveredAt).toISOString().split("T")[0]
          : d.reattemptDate
            ? new Date(d.reattemptDate).toISOString().split("T")[0]
            : s.expectedDeliveryDate
              ? new Date(s.expectedDeliveryDate).toISOString().split("T")[0]
              : d.updatedAt
                ? new Date(d.updatedAt).toISOString().split("T")[0]
                : "Pending",
        actualTime: d.deliveredAt
          ? new Date(d.deliveredAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : d.status === "pending"
            ? "Pending Delivery"
            : "",
        date: d.deliveredAt
          ? new Date(d.deliveredAt).toISOString().split("T")[0]
          : d.reattemptDate
            ? new Date(d.reattemptDate).toISOString().split("T")[0]
            : d.updatedAt
              ? new Date(d.updatedAt).toISOString().split("T")[0]
              : "Pending",
      };
    });

    // ── 3. Customer Report Data ───────────────────────────────────────────
    const customerData = getCustomerDetail.map((c) => {
      const custShipments = getShipmentDetail.filter(
        (s) =>
          s.customerId?._id?.toString() === c._id?.toString() ||
          s.customerId?.toString() === c._id?.toString() ||
          s.senderName === c.name,
      );
      const totalBookings = custShipments.length;
      const inTransit = custShipments.filter((s) =>
        ["in_transit", "dispatched", "out_for_delivery"].includes(
          s.status?.toLowerCase(),
        ),
      ).length;
      const delivered = custShipments.filter(
        (s) => s.status?.toLowerCase() === "delivered",
      ).length;
      const failed = custShipments.filter(
        (s) => s.status?.toLowerCase() === "failed_delivery",
      ).length;
      const totalWeight = custShipments.reduce(
        (sum, s) => sum + (s.totalWeight || 0),
        0,
      );
      const totalPkgs = custShipments.reduce(
        (sum, s) => sum + (s.packageCount || 0),
        0,
      );
      let lastDate = "N/A";
      if (custShipments.length > 0) {
        const dates = custShipments
          .map((s) => new Date(s.pickupDate || s.createdAt))
          .sort((a, b) => b - a);
        lastDate = dates[0].toISOString().split("T")[0];
      }
      return {
        customer: c.name,
        customerId: c.customerId || "",
        contact: [c.phonenumber, c.email].filter(Boolean).join(" • "),
        totalBookings,
        inTransit,
        delivered,
        failed,
        packages: totalPkgs,
        weight: `${totalWeight.toFixed(1)} kg`,
        lastDate,
        date: lastDate,
      };
    });

    // ── 4. Driver Report Data ─────────────────────────────────────────────
    const driverData = getDriverDetail.map((d) => {
      const driverName = d.userId?.name || "Driver " + d.driverId;
      const driverShipments = getShipmentDetail.filter(
        (s) =>
          s.driverName?._id?.toString() === d._id?.toString() ||
          s.driverName?.toString() === d._id?.toString(),
      );
      const assigned = driverShipments.length;
      const completed = driverShipments.filter(
        (s) => s.status?.toLowerCase() === "delivered",
      ).length;
      const delayed = driverShipments.filter((s) => {
        if (
          s.status?.toLowerCase() === "delivered" &&
          s.updatedAt &&
          s.expectedDeliveryDate
        ) {
          return new Date(s.updatedAt) > new Date(s.expectedDeliveryDate);
        }
        return false;
      }).length;
      const successRate =
        assigned > 0 ? `${Math.round((completed / assigned) * 100)}%` : "100%";
      const status = d.status === "active" ? "Active" : "Inactive";
      const availability = d.availability
        ? d.availability.charAt(0).toUpperCase() + d.availability.slice(1)
        : "Available";

      return {
        driverName,
        driverId: d.driverId,
        phone: d.phonenumber || d.userId?.phonenumber || "N/A",
        licenseNumber: d.license?.licensenumber || "",
        licenseExpiry: d.license?.expiredate
          ? new Date(d.license.expiredate).toISOString().split("T")[0]
          : "",
        assigned,
        completed,
        delayed,
        successRate,
        status,
        availability,
        date: d.updatedAt
          ? new Date(d.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });

    // ── 5. Vehicle Report Data ────────────────────────────────────────────
    const vehicleData = getvehicleDetail.map((v) => {
      const vehTrips = getTripDetail.filter(
        (t) =>
          t.vehicleId?._id?.toString() === v._id?.toString() ||
          t.vehicleId?.toString() === v._id?.toString(),
      );
      const tripsCount = vehTrips.length;
      const totalDistance = vehTrips.reduce(
        (sum, t) => sum + (t.plannedDistance || 0),
        0,
      );
      const vehFuels = getVehicleFuelDetail.filter(
        (f) =>
          f.vehicleId?._id?.toString() === v._id?.toString() ||
          f.vehicleId?.toString() === v._id?.toString(),
      );
      const totalFuelCost = vehFuels.reduce(
        (sum, f) => sum + (f.fuelCost || 0),
        0,
      );

      // Resolve driver from vehicle, trips, or shipments
      let driverName = v.driver && v.driver.trim() ? v.driver : "";
      let driverPhone = v.driverPhone || "";

      if (!driverName || driverName === "Unassigned") {
        const tripWithDriver = vehTrips.find((t) => t.driverId?.userId?.name);
        if (tripWithDriver) {
          driverName = tripWithDriver.driverId.userId.name;
          driverPhone = tripWithDriver.driverId.phonenumber || "";
        } else {
          const shpWithDriver = getShipmentDetail.find(
            (s) =>
              (s.vehicleNo?._id?.toString() === v._id?.toString() ||
                s.vehicleNo?.vregistrationnumber === v.vregistrationnumber) &&
              s.driverName?.userId?.name,
          );
          if (shpWithDriver) {
            driverName = shpWithDriver.driverName.userId.name;
            driverPhone = shpWithDriver.driverName.phonenumber || "";
          }
        }
      }

      if (!driverName) driverName = "Unassigned";

      return {
        vehicleNo: v.vregistrationnumber,
        model: v.vmodel,
        type: v.vtype,
        capacity: v.vcapacity ? `${v.vcapacity} Tons` : "",
        fuelType: v.vfuletype || "",
        driver: driverName,
        driverPhone,
        trips: tripsCount,
        distance: `${totalDistance} km`,
        fuelCost: `₹${totalFuelCost.toLocaleString()}`,
        status: v.vstatus || "Available",
        date: v.updatedAt
          ? new Date(v.updatedAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });

    // ── 6. Warehouse Report Data ──────────────────────────────────────────
    const txnRows = getWarehouseTxnDetail.map((tx) => ({
      txnId: "TXN-" + tx._id.toString().slice(-6).toUpperCase(),
      warehouse: tx.warehouseId?.warName || "Warehouse",
      city: tx.warehouseId?.warCity || "",
      type: tx.wartransactionType === "inbound" ? "Inbound" : "Outbound",
      shipment: tx.shipmentId?.shipmentId || "N/A",
      tracking: tx.shipmentId?.trackingId || "",
      location: tx.locationId
        ? `${tx.locationId.warlocZone || ""} - ${tx.locationId.warlocRack || ""} - ${tx.locationId.warlocBin || ""}`
        : "General Area",
      user: tx.wartansactonProcessBy?.name || "Admin",
      time: tx.wartransactionDate
        ? new Date(tx.wartransactionDate)
            .toISOString()
            .replace("T", " ")
            .substring(0, 16)
        : "",
      date: tx.wartransactionDate
        ? new Date(tx.wartransactionDate).toISOString().split("T")[0]
        : "",
    }));

    const storageRows = getWarehouseStorageDetail.map((st) => ({
      txnId: "STR-" + st._id.toString().slice(-6).toUpperCase(),
      warehouse: st.warehouseId?.warName || "Warehouse",
      city: st.warehouseId?.warCity || "",
      type: "Storage",
      shipment: st.shipmentId?.shipmentId || "N/A",
      tracking: st.shipmentId?.trackingId || "",
      location: st.locationId
        ? `${st.locationId.warlocZone || ""} - ${st.locationId.warlocRack || ""} - ${st.locationId.warlocBin || ""}`
        : "General Area",
      user: "System",
      time: st.storeAt
        ? new Date(st.storeAt).toISOString().replace("T", " ").substring(0, 16)
        : "",
      date: st.storeAt ? new Date(st.storeAt).toISOString().split("T")[0] : "",
    }));

    const warehouseData = [...txnRows, ...storageRows].sort((a, b) =>
      (b.time || "").localeCompare(a.time || ""),
    );

    // ── 7. Trip Report Data ───────────────────────────────────────────────
    const tripData = getTripDetail.map((t) => ({
      tripId: t.tripId,
      origin: t.origin,
      destination: t.destination,
      driver: t.driverId?.userId?.name || "Unassigned",
      driverPhone: t.driverId?.phonenumber || "",
      vehicle: t.vehicleId?.vregistrationnumber || "Unassigned",
      vehicleModel: t.vehicleId?.vmodel
        ? `${t.vehicleId.vmodel} (${t.vehicleId.vtype || "Truck"})`
        : "",
      packages: t.shipmentIds ? t.shipmentIds.length : 0,
      departure: t.actualDeparture
        ? new Date(t.actualDeparture)
            .toISOString()
            .replace("T", " ")
            .substring(0, 16)
        : t.plannedDeparture
          ? new Date(t.plannedDeparture)
              .toISOString()
              .replace("T", " ")
              .substring(0, 16)
          : "N/A",
      arrival: t.actualArrival
        ? new Date(t.actualArrival)
            .toISOString()
            .replace("T", " ")
            .substring(0, 16)
        : t.plannedArrival
          ? new Date(t.plannedArrival)
              .toISOString()
              .replace("T", " ")
              .substring(0, 16)
          : "Pending",
      status: mapTripStatus(t.status),
      date: t.plannedDeparture
        ? new Date(t.plannedDeparture).toISOString().split("T")[0]
        : new Date(t.createdAt).toISOString().split("T")[0],
    }));

    // ── 8. Invoice Report Data ────────────────────────────────────────────
    const invoiceData = getShipmentDetail.map((s, idx) => {
      const invNum =
        "INV-" +
        new Date(s.createdAt || Date.now()).getFullYear() +
        "-" +
        String(idx + 1).padStart(3, "0");
      const invDate = s.createdAt
        ? new Date(s.createdAt).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const weightCharge = (s.totalWeight || 5) * 40;
      const pkgCharge = (s.packageCount || 1) * 300;
      const baseRate = 1200;
      const amountVal = baseRate + weightCharge + pkgCharge;
      const taxVal = Math.round(amountVal * 0.18);
      const totalAmount = amountVal + taxVal;
      const dueDateObj = new Date(s.createdAt || Date.now());
      dueDateObj.setDate(dueDateObj.getDate() + 15);
      const dueDate = dueDateObj.toISOString().split("T")[0];

      let invStatus = "Pending";
      if (s.status?.toLowerCase() === "delivered") {
        invStatus = "Paid";
      } else if (new Date() > dueDateObj) {
        invStatus = "Overdue";
      }

      return {
        invoiceNo: invNum,
        date: invDate,
        customer: s.customerId?.name || s.senderName || "Unknown",
        customerEmail: s.customerId?.email || s.senderEmail || "",
        shipment: s.shipmentId || "N/A",
        tracking: s.trackingId || "",
        amount: `₹${amountVal.toLocaleString()}`,
        amountVal: totalAmount,
        tax: `₹${taxVal.toLocaleString()}`,
        dueDate,
        status: invStatus,
      };
    });

    // ── 9. Failed Delivery Report Data ────────────────────────────────────
    const failedDeliveryData = [];
    getDeliveryDetail.forEach((d) => {
      const isFailed =
        d.status === "failed" ||
        d.status === "reattempt_scheduled" ||
        Boolean(d.reason);
      const isShipmentFailed = d.shipmentId?.status === "failed_delivery";
      if (isFailed || isShipmentFailed) {
        const s = d.shipmentId || {};
        const driverName =
          s.driverName?.userId?.name ||
          (typeof s.driverName === "string" ? s.driverName : "") ||
          "Unassigned";
        const driverPhone =
          s.driverName?.phonenumber || s.driverName?.userId?.phonenumber || "";

        failedDeliveryData.push({
          id: s.shipmentId || "DEL-" + d._id.toString().slice(-6).toUpperCase(),
          tracking: s.trackingId || "N/A",
          customer: s.customerId?.name || s.senderName || "N/A",
          recipient: s.receiverName || "",
          driver: driverName,
          driverPhone,
          reason: d.reason || d.notes || "Customer Unavailable / Door Closed",
          attempts: d.attemptNumber || 1,
          reattemptDate: d.reattemptDate
            ? new Date(d.reattemptDate).toISOString().split("T")[0]
            : "Pending",
          status:
            d.reattemptDate || d.status === "reattempt_scheduled"
              ? "Re-attempt Scheduled"
              : d.status === "failed"
                ? "Failed"
                : "Re-attempt Scheduled",
          date: d.updatedAt
            ? new Date(d.updatedAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
        });
      }
    });

    getShipmentDetail
      .filter((s) => s.status?.toLowerCase() === "failed_delivery")
      .forEach((s) => {
        if (!failedDeliveryData.some((f) => f.tracking === s.trackingId)) {
          failedDeliveryData.push({
            id: s.shipmentId,
            tracking: s.trackingId,
            customer: s.customerId?.name || s.senderName || "N/A",
            recipient: s.receiverName || "",
            driver: s.driverName?.userId?.name || "Unassigned",
            driverPhone: s.driverName?.phonenumber || "",
            reason: "Delivery Attempt Failed",
            attempts: 1,
            reattemptDate: "Pending",
            status: "Failed",
            date: s.updatedAt
              ? new Date(s.updatedAt).toISOString().split("T")[0]
              : new Date().toISOString().split("T")[0],
          });
        }
      });

    // ── 10. Summary Report Data ───────────────────────────────────────────
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const summaryData = [];
    monthNames.forEach((mName, mIdx) => {
      const mShipments = getShipmentDetail.filter((s) => {
        const d = new Date(s.pickupDate || s.createdAt);
        return d.getFullYear() === 2026 && d.getMonth() === mIdx;
      });
      const mDelivered = mShipments.filter(
        (s) => s.status?.toLowerCase() === "delivered",
      );
      const mInbound = getWarehouseTxnDetail.filter((t) => {
        const d = new Date(t.wartransactionDate || t.createdAt);
        return (
          t.wartransactionType === "inbound" &&
          d.getFullYear() === 2026 &&
          d.getMonth() === mIdx
        );
      }).length;
      const mOutbound = getWarehouseTxnDetail.filter((t) => {
        const d = new Date(t.wartransactionDate || t.createdAt);
        return (
          t.wartransactionType === "outbound" &&
          d.getFullYear() === 2026 &&
          d.getMonth() === mIdx
        );
      }).length;

      const mFuels = getVehicleFuelDetail.filter((f) => {
        const d = new Date(f.fuelDate || f.createdAt);
        return d.getFullYear() === 2026 && d.getMonth() === mIdx;
      });
      const mMaints = getVehicleMaintenanceDetail.filter((m) => {
        const d = new Date(m.serviceDate || m.createdAt);
        return d.getFullYear() === 2026 && d.getMonth() === mIdx;
      });
      const mFuelMaintCost =
        mFuels.reduce((sum, f) => sum + (f.fuelCost || 0), 0) +
        mMaints.reduce((sum, m) => sum + (m.serviceCost || 0), 0);

      const totalShp = mShipments.length;
      const onTime = mDelivered.length;
      const eff =
        totalShp > 0 ? `${((onTime / totalShp) * 100).toFixed(1)}%` : "100%";
      const cost =
        mFuelMaintCost > 0
          ? `₹${Math.round(mFuelMaintCost).toLocaleString()}`
          : "₹0";

      summaryData.push({
        period: `${mName} 2026`,
        periodType: "Monthly",
        year: "2026",
        month: mName,
        shipments: totalShp,
        onTime,
        fuelCost: cost,
        inbound: mInbound,
        outbound: mOutbound,
        efficiency: eff,
      });
    });

    const yShipments = getShipmentDetail.filter(
      (s) => new Date(s.pickupDate || s.createdAt).getFullYear() === 2026,
    );
    const yDelivered = yShipments.filter(
      (s) => s.status?.toLowerCase() === "delivered",
    );
    const totalYearFuelCost =
      getVehicleFuelDetail.reduce((sum, f) => sum + (f.fuelCost || 0), 0) +
      getVehicleMaintenanceDetail.reduce(
        (sum, m) => sum + (m.serviceCost || 0),
        0,
      );

    summaryData.push({
      period: "Year 2026",
      periodType: "Yearly",
      year: "2026",
      month: "All",
      shipments: yShipments.length,
      onTime: yDelivered.length,
      fuelCost: `₹${totalYearFuelCost.toLocaleString()}`,
      inbound: getWarehouseTxnDetail.filter(
        (t) => t.wartransactionType === "inbound",
      ).length,
      outbound: getWarehouseTxnDetail.filter(
        (t) => t.wartransactionType === "outbound",
      ).length,
      efficiency:
        yShipments.length > 0
          ? `${((yDelivered.length / yShipments.length) * 100).toFixed(1)}%`
          : "100%",
    });

    // ── Complete Database Reports (All 10 Reports sent together) ──────────
    const reports = {
      shipment: shipmentData,
      delivery: deliveryData,
      customer: customerData,
      driver: driverData,
      vehicle: vehicleData,
      warehouse: warehouseData,
      trip: tripData,
      invoice: invoiceData,
      failed_delivery: failedDeliveryData,
      summary: summaryData,
    };

    return res.status(200).json({
      success: true,
      options,
      reports,
      data: reports[req.query.type] || shipmentData,
    });
  } catch (error) {
    console.error("Report fetch error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. INVOICE & BILLING RECORDS MODULE
// ─────────────────────────────────────────────────────────────────────────────

async function generateInvoiceNumber() {
  let invoiceNumber;
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    attempts++;
    invoiceNumber = `INV-${Math.floor(100000 + Math.random() * 900000)}`;
    const existing = await Invoice.findOne({ invoiceNumber });
    exists = !!existing;
  }

  return invoiceNumber;
}

async function syncOverdueInvoices(filter = {}) {
  try {
    const now = new Date();
    await Invoice.updateMany(
      {
        ...filter,
        dueDate: { $lt: now },
        paymentStatus: { $in: ["pending", "partially_paid"] },
      },
      { $set: { paymentStatus: "overdue" } },
    );
  } catch (err) {
    console.warn("Could not sync overdue invoices:", err.message);
  }
}

// 1. Calculate Shipment Charges Endpoint
app.post("/billing/calculate-charges", authMiddleware, async (req, res) => {
  try {
    const {
      shipmentId,
      packageCount,
      totalWeight,
      length,
      width,
      height,
      priority,
      distanceKm,
      additionalCharges,
      additionalItems,
      items,
      taxRate,
    } = req.body;

    let calcData = {
      packageCount,
      totalWeight,
      dimensions: { length, width, height },
      priority,
      distanceKm,
      additionalCharges,
      additionalItems,
      items,
      taxRate,
    };

    let shipmentDoc = null;

    if (shipmentId) {
      if (mongoose.Types.ObjectId.isValid(shipmentId)) {
        shipmentDoc = await Shipment.findById(shipmentId);
      }
      if (!shipmentDoc) {
        shipmentDoc = await Shipment.findOne({
          $or: [{ shipmentId }, { trackingId: shipmentId }],
        });
      }

      if (shipmentDoc) {
        let tripDoc = null;
        if (shipmentDoc.tripNo) {
          if (mongoose.Types.ObjectId.isValid(shipmentDoc.tripNo)) {
            tripDoc = await Trip.findById(shipmentDoc.tripNo);
          } else {
            tripDoc = await Trip.findOne({ tripId: shipmentDoc.tripNo });
          }
        }
        if (!tripDoc && shipmentDoc._id) {
          tripDoc = await Trip.findOne({ shipmentIds: shipmentDoc._id });
        }

        const resolvedDistanceKm =
          distanceKm !== undefined && distanceKm !== null && distanceKm !== ""
            ? Number(distanceKm)
            : tripDoc?.plannedDistance || 0;

        calcData = {
          packageCount: packageCount || shipmentDoc.packageCount || 1,
          totalWeight: totalWeight || shipmentDoc.totalWeight || 0,
          dimensions: {
            length: length || shipmentDoc.dimensions?.length || 0,
            width: width || shipmentDoc.dimensions?.width || 0,
            height: height || shipmentDoc.dimensions?.height || 0,
          },
          priority: priority || shipmentDoc.priority || "Standard",
          distanceKm: resolvedDistanceKm,
          additionalCharges,
          additionalItems,
          items,
          taxRate,
        };
      }
    }

    const calculation = calculateShipmentCharges(calcData);

    return res.status(200).json({
      message: "Shipment charges calculated successfully",
      shipment: shipmentDoc
        ? {
            shipmentId: shipmentDoc.shipmentId,
            trackingId: shipmentDoc.trackingId,
            sender: `${shipmentDoc.senderName} (${shipmentDoc.senderCity})`,
            receiver: `${shipmentDoc.receiverName} (${shipmentDoc.receiverCity})`,
          }
        : null,
      calculation,
    });
  } catch (error) {
    console.error("CALCULATE CHARGES ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 2. Create Shipment/Service Invoices
const handleCreateInvoice = async (req, res) => {
  try {
    const {
      invoiceType = "shipment",
      shipmentId,
      customerId,
      customerName,
      contactPerson,
      customerEmail,
      customerPhone,
      customerAddress,
      customerGstin,
      dueDate,
      taxRate = 18,
      notes = "",
      termsAndConditions,
      items,
      baseCharges,
      additionalCharges = 0,
      paidAmount = 0,
      paymentMethod = "",
      transactionRef = "",
      distanceKm,
      origin,
      destination,
      vehicleNo,
      weight,
      invoiceDate,
      bankDetails,
    } = req.body;

    // Strict field validations - reject if any required user input from DashboardInvoice.jsx is missing
    if (!customerName || !String(customerName).trim()) {
      return res.status(400).json({ message: "Customer name is required" });
    }
    if (!customerEmail || !String(customerEmail).trim()) {
      return res
        .status(400)
        .json({ message: "Customer email address is required" });
    }
    if (!customerPhone || !String(customerPhone).trim()) {
      return res
        .status(400)
        .json({ message: "Customer phone number is required" });
    }
    if (!customerAddress || !String(customerAddress).trim()) {
      return res
        .status(400)
        .json({ message: "Customer billing address is required" });
    }

    const resolvedInvoiceType = ["shipment", "service"].includes(invoiceType)
      ? invoiceType
      : "shipment";

    if (resolvedInvoiceType === "shipment" || shipmentId) {
      if (!shipmentId || !String(shipmentId).trim()) {
        return res
          .status(400)
          .json({ message: "Shipment AWB reference is required" });
      }
      if (!origin || !String(origin).trim()) {
        return res
          .status(400)
          .json({ message: "Origin city / hub is required" });
      }
      if (!destination || !String(destination).trim()) {
        return res
          .status(400)
          .json({ message: "Destination city / hub is required" });
      }
      if (!vehicleNo || !String(vehicleNo).trim()) {
        return res
          .status(400)
          .json({ message: "Assigned vehicle number is required" });
      }
      if (!weight || !String(weight).trim()) {
        return res
          .status(400)
          .json({ message: "Cargo weight / volume is required" });
      }
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one charge line item is required" });
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it || !it.description || !String(it.description).trim()) {
        return res
          .status(400)
          .json({ message: `Description is required for line item #${i + 1}` });
      }
    }

    if (!dueDate) {
      return res.status(400).json({ message: "Invoice due date is required" });
    }

    let customerDoc = null;
    let shipmentDoc = null;

    // Resolve shipment if provided
    if (shipmentId) {
      if (mongoose.Types.ObjectId.isValid(shipmentId)) {
        shipmentDoc = await Shipment.findById(shipmentId);
      }
      if (!shipmentDoc) {
        shipmentDoc = await Shipment.findOne({
          $or: [{ shipmentId }, { trackingId: shipmentId }],
        });
      }
    }

    // Resolve customer
    const targetCustId = customerId || customerName || shipmentDoc?.customerId;

    if (targetCustId) {
      if (mongoose.Types.ObjectId.isValid(targetCustId)) {
        customerDoc = await Customer.findById(targetCustId);
      }
      if (!customerDoc) {
        const cleanTarget = String(targetCustId).trim();
        const escaped = cleanTarget.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        customerDoc = await Customer.findOne({
          $or: [
            { name: new RegExp(`^${escaped}$`, "i") },
            { customerId: cleanTarget },
            ...(!isNaN(cleanTarget)
              ? [{ customerId: Number(cleanTarget) }]
              : []),
          ],
        });
      }
    }

    if (!customerDoc && (customerName || targetCustId)) {
      const custName = String(customerName || targetCustId).trim();
      if (custName) {
        const lastCust = await Customer.findOne().sort({ customerId: -1 });
        const nextCustId = (lastCust?.customerId || 1000) + 1;
        customerDoc = await Customer.create({
          customerId: nextCustId,
          name: custName,
          contactPerson: String(contactPerson || custName).trim(),
          email: String(customerEmail).trim(),
          phonenumber:
            Number(String(customerPhone).replace(/\D/g, "")) || 9876543210,
          address: String(customerAddress).trim(),
          gstin: String(customerGstin || "").trim(),
        });
      }
    }

    if (!customerDoc) {
      return res
        .status(400)
        .json({ message: "Customer information is invalid or missing" });
    }

    if (customerGstin && String(customerGstin).trim()) {
      customerDoc.gstin = String(customerGstin).trim();
      await customerDoc.save();
    }

    // Normalize payment method enum
    const normalizePaymentMethod = (pm) => {
      if (!pm) return "";
      const lower = String(pm).toLowerCase();
      if (lower.includes("upi")) return "upi";
      if (lower.includes("card")) return "card";
      if (
        lower.includes("bank") ||
        lower.includes("neft") ||
        lower.includes("rtgs") ||
        lower.includes("transfer")
      )
        return "bank_transfer";
      if (lower.includes("cheque") || lower.includes("check")) return "cheque";
      if (lower.includes("cash")) return "cash";
      if (lower.includes("credit")) return "credit";
      return "other";
    };

    const safePaymentMethod = normalizePaymentMethod(paymentMethod);

    // Calculate or compile charges
    let finalItems = [];
    let finalBase = 0;
    let finalWeightCharges = 0;
    let finalPriorityCharges = 0;
    let finalFuelSurcharge = 0;
    let finalHandlingCharges = 0;
    let finalAdditionalCharges = Number(additionalCharges) || 0;
    let finalSubtotal = 0;
    let finalTaxRate = Number(taxRate) >= 0 ? Number(taxRate) : 18;
    let finalTaxAmount = 0;
    let finalTotal = 0;

    if (resolvedInvoiceType === "shipment" && shipmentDoc) {
      let tripDoc = null;
      if (shipmentDoc.tripNo) {
        if (mongoose.Types.ObjectId.isValid(shipmentDoc.tripNo)) {
          tripDoc = await Trip.findById(shipmentDoc.tripNo);
        } else {
          tripDoc = await Trip.findOne({ tripId: shipmentDoc.tripNo });
        }
      }
      if (!tripDoc && shipmentDoc._id) {
        tripDoc = await Trip.findOne({ shipmentIds: shipmentDoc._id });
      }

      const resolvedDistanceKm =
        distanceKm !== undefined && distanceKm !== null && distanceKm !== ""
          ? Number(distanceKm)
          : tripDoc?.plannedDistance || 0;

      const calc = calculateShipmentCharges({
        packageCount: shipmentDoc.packageCount,
        totalWeight: shipmentDoc.totalWeight,
        dimensions: shipmentDoc.dimensions,
        priority: shipmentDoc.priority,
        distanceKm: resolvedDistanceKm,
        additionalCharges: finalAdditionalCharges,
        additionalItems:
          items && Array.isArray(items)
            ? items.filter((it) => it.isCustom)
            : undefined,
        items: items && Array.isArray(items) ? items : undefined,
        taxRate: finalTaxRate,
      });

      finalBase = Number(baseCharges) || calc.baseCharges;
      finalWeightCharges = calc.weightCharges;
      finalPriorityCharges = calc.priorityCharges;
      finalFuelSurcharge = calc.fuelSurcharge;
      finalHandlingCharges = calc.handlingCharges;
      finalAdditionalCharges = calc.additionalCharges;
      finalSubtotal = calc.subtotal;
      finalTaxAmount = calc.taxAmount;
      finalTotal = calc.totalAmount;
      finalItems = items && items.length > 0 ? items : calc.breakdownItems;
    } else {
      // Service / Custom invoice
      if (items && Array.isArray(items) && items.length > 0) {
        finalItems = items.map((it) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const price = Math.max(0, Number(it.unitPrice ?? it.rate) || 0);
          const amt = Number(it.amount) || qty * price;
          const tp = Number.isFinite(Number(it.taxPercent))
            ? Number(it.taxPercent)
            : 18;
          const ta = Number.isFinite(Number(it.taxAmount))
            ? Number(it.taxAmount)
            : Math.round(amt * (tp / 100) * 100) / 100;
          const tot = Number.isFinite(Number(it.totalAmount))
            ? Number(it.totalAmount)
            : Math.round((amt + ta) * 100) / 100;
          return {
            description: String(it.description || "Service Item").trim(),
            quantity: qty,
            unit: it.unit || "Service",
            unitPrice: price,
            amount: amt,
            taxPercent: tp,
            taxAmount: ta,
            totalAmount: tot,
          };
        });
        finalSubtotal = finalItems.reduce((acc, curr) => acc + curr.amount, 0);
      } else {
        const base = Math.max(0, Number(baseCharges) || 0);
        finalSubtotal = base + finalAdditionalCharges;
        finalItems = [
          {
            description: notes || "General Logistics Service",
            quantity: 1,
            unit: "Service",
            unitPrice: finalSubtotal,
            amount: finalSubtotal,
          },
        ];
      }

      const taxable = finalSubtotal;
      finalTaxAmount =
        finalItems.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0) ||
        Math.round(taxable * (finalTaxRate / 100) * 100) / 100;
      finalTotal = Math.round((taxable + finalTaxAmount) * 100) / 100;
    }

    // Payment & balance calculations
    const numPaid = Math.max(0, Number(paidAmount) || 0);
    const balanceAmount = Math.max(
      0,
      Math.round((finalTotal - numPaid) * 100) / 100,
    );

    let paymentStatus = "pending";
    let paidAt = null;

    if (numPaid >= finalTotal && finalTotal > 0) {
      paymentStatus = "paid";
      paidAt = new Date();
    } else if (numPaid > 0) {
      paymentStatus = "partially_paid";
    }

    const paymentHistory = [];
    if (numPaid > 0) {
      paymentHistory.push({
        amount: numPaid,
        paymentMethod: safePaymentMethod || "cash",
        transactionRef: transactionRef || "",
        paidAt: new Date(),
        notes: "Initial payment recorded at invoice creation",
        recordedBy: req.user?.userId || null,
      });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const newInvoice = new Invoice({
      invoiceNumber,
      invoiceType: resolvedInvoiceType,
      shipmentId: shipmentDoc ? shipmentDoc._id : null,
      shipmentRef: String(shipmentId || "").trim(),
      shipmentDetails: {
        origin: String(origin || "").trim(),
        destination: String(destination || "").trim(),
        vehicleNo: String(vehicleNo || "").trim(),
        weight: String(weight || "").trim(),
      },
      customerId: customerDoc._id,
      customerGstin: String(customerGstin || customerDoc.gstin || "").trim(),
      bankDetails: {
        accountName: String(bankDetails?.accountName || "").trim(),
        accountNumber: String(bankDetails?.accountNumber || "").trim(),
        bankAndBranch: String(bankDetails?.bankAndBranch || "").trim(),
        ifscCode: String(bankDetails?.ifscCode || "").trim(),
      },
      items: finalItems,
      baseCharges: finalBase,
      weightCharges: finalWeightCharges,
      priorityCharges: finalPriorityCharges,
      fuelSurcharge: finalFuelSurcharge,
      handlingCharges: finalHandlingCharges,
      additionalCharges: finalAdditionalCharges,
      subtotal: finalSubtotal,
      taxRate: finalTaxRate,
      taxAmount: finalTaxAmount,
      totalAmount: finalTotal,
      paidAmount: numPaid,
      balanceAmount,
      paymentStatus,
      paymentMethod: safePaymentMethod,
      paymentHistory,
      issueDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: new Date(dueDate),
      paidAt,
      notes: String(notes || "").trim(),
      termsAndConditions:
        termsAndConditions ||
        "Payment is due within 15 days of invoice date. Late payments may incur a 2% monthly fee.",
    });

    await newInvoice.save();
    await newInvoice.populate("customerId");
    await newInvoice.populate("shipmentId");

    await createAuditLog({
      userId: req.user?._id || req.user?.userId || newInvoice.createdBy,
      action: "CREATE_INVOICE",
      resource: "Invoice",
      resourceId: newInvoice._id
        ? newInvoice._id.toString()
        : newInvoice.invoiceNumber,
    });

    return res.status(201).json({
      message: "Invoice created successfully",
      invoice: newInvoice,
    });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
};

app.post("/invoices", authMiddleware, handleCreateInvoice);
app.post("/invoice", authMiddleware, handleCreateInvoice);

// 3. List Invoices with Search, Filter, Pagination & Auto-Overdue Status
app.get("/invoices", authMiddleware, async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      customerId,
      shipmentId,
      dateFrom,
      dateTo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    page = Math.max(parseInt(page) || 1, 1);
    limit = Math.min(Math.max(parseInt(limit) || 10, 1), 1000);
    const skip = (page - 1) * limit;

    // Synchronize any overdue records
    await syncOverdueInvoices();

    const filter = {};

    if (status) {
      const statuses = status
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      if (statuses.length === 1) {
        filter.paymentStatus = statuses[0];
      } else if (statuses.length > 1) {
        filter.paymentStatus = { $in: statuses };
      }
    }

    if (customerId) {
      if (mongosse.Types.ObjectId.isValid(customerId)) {
        filter.customerId = customerId;
      } else {
        const foundCust = await Customer.findOne({
          $or: [
            { customerId },
            ...(!isNaN(customerId) ? [{ customerId: Number(customerId) }] : []),
          ],
        });
        if (foundCust) {
          filter.customerId = foundCust._id;
        } else {
          return res.status(200).json({
            message: "Invoices fetched successfully",
            pagination: {
              currentPage: page,
              totalPages: 0,
              totalInvoices: 0,
              limit,
            },
            summary: {
              totalAmount: 0,
              totalPaid: 0,
              totalBalance: 0,
              overdueCount: 0,
            },
            invoices: [],
          });
        }
      }
    }

    if (shipmentId && mongosse.Types.ObjectId.isValid(shipmentId)) {
      filter.shipmentId = shipmentId;
    }

    if (dateFrom || dateTo) {
      filter.issueDate = {};
      if (dateFrom) filter.issueDate.$gte = new Date(dateFrom);
      if (dateTo) filter.issueDate.$lte = new Date(dateTo);
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedCustomers = await Customer.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { customerId: searchRegex },
        ],
      }).select("_id");
      const custIds = matchedCustomers.map((c) => c._id);

      const matchedShipments = await Shipment.find({
        $or: [{ shipmentId: searchRegex }, { trackingId: searchRegex }],
      }).select("_id");
      const shpIds = matchedShipments.map((s) => s._id);

      filter.$or = [
        { invoiceNumber: searchRegex },
        { customerId: { $in: custIds } },
        { shipmentId: { $in: shpIds } },
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [totalInvoices, invoices, summaryAgg] = await Promise.all([
      Invoice.countDocuments(filter),
      Invoice.find(filter)
        .populate("customerId")
        .populate({
          path: "shipmentId",
          populate: { path: "vehicleNo" },
        })
        .sort(sortObj)
        .skip(skip)
        .limit(limit),
      Invoice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalBalance: { $sum: "$balanceAmount" },
            overdueCount: {
              $sum: { $cond: [{ $eq: ["$paymentStatus", "overdue"] }, 1, 0] },
            },
          },
        },
      ]),
    ]);

    const summary = summaryAgg[0] || {
      totalAmount: 0,
      totalPaid: 0,
      totalBalance: 0,
      overdueCount: 0,
    };

    return res.status(200).json({
      message: "Invoices fetched successfully",
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalInvoices / limit),
        totalInvoices,
        limit,
      },
      summary: {
        totalAmount: Math.round(summary.totalAmount * 100) / 100,
        totalPaid: Math.round(summary.totalPaid * 100) / 100,
        totalBalance: Math.round(summary.totalBalance * 100) / 100,
        overdueCount: summary.overdueCount,
      },
      invoices,
    });
  } catch (error) {
    console.error("GET INVOICES ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 4. Get Single Invoice by ID or InvoiceNumber
app.get("/invoices/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    let invoice = null;

    if (mongosse.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id);
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Auto-check overdue
    if (
      ["pending", "partially_paid"].includes(invoice.paymentStatus) &&
      invoice.dueDate &&
      new Date(invoice.dueDate) < new Date()
    ) {
      invoice.paymentStatus = "overdue";
      await invoice.save();
    }

    await invoice.populate("customerId");
    await invoice.populate("shipmentId");
    await invoice.populate("paymentHistory.recordedBy", "name email");

    return res.status(200).json({
      message: "Invoice details fetched successfully",
      invoice,
    });
  } catch (error) {
    console.error("GET INVOICE BY ID ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 5. Record Payment & Maintain Paid, Pending, and Overdue Status
app.post("/invoices/:id/payments", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      paymentMethod = "cash",
      transactionRef = "",
      notes = "",
    } = req.body;

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than 0",
      });
    }

    let invoice = null;
    if (mongosse.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id);
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (invoice.paymentStatus === "cancelled") {
      return res.status(400).json({
        message: "Cannot record payment on a cancelled invoice",
      });
    }

    if (invoice.paymentStatus === "paid" && invoice.balanceAmount <= 0) {
      return res.status(400).json({
        message: "Invoice is already fully paid",
      });
    }

    if (numAmount > invoice.balanceAmount) {
      return res.status(400).json({
        message: `Payment amount (${numAmount}) exceeds outstanding balance (${invoice.balanceAmount})`,
      });
    }

    const newPaidAmount =
      Math.round((invoice.paidAmount + numAmount) * 100) / 100;
    const newBalance = Math.max(
      0,
      Math.round((invoice.totalAmount - newPaidAmount) * 100) / 100,
    );

    const paymentRecord = {
      amount: numAmount,
      paymentMethod,
      transactionRef: String(transactionRef).trim(),
      paidAt: new Date(),
      notes: String(notes).trim(),
      recordedBy: req.user?.userId || null,
    };

    invoice.paymentHistory.push(paymentRecord);
    invoice.paidAmount = newPaidAmount;
    invoice.balanceAmount = newBalance;
    invoice.paymentMethod = paymentMethod || invoice.paymentMethod;

    if (newBalance === 0) {
      invoice.paymentStatus = "paid";
      invoice.paidAt = new Date();
    } else {
      invoice.paymentStatus = "partially_paid";
    }

    await invoice.save();
    await invoice.populate("customerId");
    await invoice.populate("shipmentId");

    await createAuditLog({
      userId: req.user?._id || req.user?.userId || invoice.createdBy,
      action: "RECORD_INVOICE_PAYMENT",
      resource: "Invoice",
      resourceId: invoice._id ? invoice._id.toString() : invoice.invoiceNumber,
    });

    return res.status(200).json({
      message: "Payment recorded successfully",
      payment: paymentRecord,
      invoice,
    });
  } catch (error) {
    console.error("RECORD PAYMENT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 6. Update Invoice Status Manually
app.patch("/invoices/:id/status", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      paidAmount,
      balanceAmount,
      paymentMethod,
      transactionRef,
      notes,
    } = req.body;

    const allowed = [
      "pending",
      "partially_paid",
      "paid",
      "overdue",
      "cancelled",
    ];
    if (!status || !allowed.includes(status.toLowerCase())) {
      return res.status(400).json({
        message: `Status must be one of: ${allowed.join(", ")}`,
      });
    }

    const normStatus = status.toLowerCase();

    let invoice = null;
    if (mongosse.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id);
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const safePaymentMethod = [
      "cash",
      "card",
      "bank_transfer",
      "upi",
      "credit",
      "cheque",
      "other",
    ].includes(String(paymentMethod || "").toLowerCase())
      ? String(paymentMethod).toLowerCase()
      : "cash";

    invoice.paymentStatus = normStatus;
    if (paymentMethod) {
      invoice.paymentMethod = safePaymentMethod;
    }

    if (paidAmount !== undefined && !isNaN(Number(paidAmount))) {
      const p = Math.max(0, Number(paidAmount));
      invoice.paidAmount = p;
      if (balanceAmount !== undefined && !isNaN(Number(balanceAmount))) {
        invoice.balanceAmount = Math.max(0, Number(balanceAmount));
      } else {
        invoice.balanceAmount = Math.max(
          0,
          Math.round((invoice.totalAmount - p) * 100) / 100,
        );
      }
    } else if (normStatus === "paid") {
      invoice.paidAmount = invoice.totalAmount;
      invoice.balanceAmount = 0;
    } else if (normStatus === "pending") {
      invoice.paidAmount = 0;
      invoice.balanceAmount = invoice.totalAmount;
    }

    if (normStatus === "paid") {
      invoice.paidAt = invoice.paidAt || new Date();
    } else if (
      ["pending", "partially_paid"].includes(normStatus) &&
      invoice.dueDate &&
      new Date(invoice.dueDate) < new Date()
    ) {
      invoice.dueDate = new Date(Date.now() + 15 * 86400000);
    }

    if (notes) {
      invoice.notes = invoice.notes ? `${invoice.notes}; ${notes}` : notes;
    }

    // Append to paymentHistory schema array
    if (invoice.paidAmount > 0 || transactionRef || paymentMethod) {
      invoice.paymentHistory.push({
        amount: invoice.paidAmount || 0,
        paymentMethod: safePaymentMethod,
        transactionRef: String(transactionRef || "").trim(),
        paidAt: new Date(),
        notes: String(notes || `Status updated to ${normStatus}`).trim(),
        recordedBy: req.user?.userId || null,
      });
    }

    await invoice.save();
    await invoice.populate("customerId");
    await invoice.populate("shipmentId");

    await createAuditLog({
      userId: req.user?._id || req.user?.userId || invoice.createdBy,
      action: "UPDATE_INVOICE_STATUS",
      resource: "Invoice",
      resourceId: invoice._id ? invoice._id.toString() : invoice.invoiceNumber,
    });

    return res.status(200).json({
      message: `Invoice status updated to ${normStatus}`,
      invoice,
    });
  } catch (error) {
    console.error("UPDATE INVOICE STATUS ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 7. Customer Billing History & Portfolio
app.get("/customers/:id/billing-history", authMiddleware, async (req, res) => {
  try {
    const custId = req.params.id;
    let customer = null;

    if (mongosse.Types.ObjectId.isValid(custId)) {
      customer = await Customer.findById(custId);
    }
    if (!customer) {
      customer = await Customer.findOne({
        $or: [
          { customerId: custId },
          ...(!isNaN(custId) ? [{ customerId: Number(custId) }] : []),
        ],
      });
    }

    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    // Auto-sync overdue invoices for this customer
    await syncOverdueInvoices({ customerId: customer._id });

    const invoices = await Invoice.find({ customerId: customer._id })
      .populate("shipmentId")
      .sort({ createdAt: -1 });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let outstandingBalance = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let partiallyPaidCount = 0;
    let overdueCount = 0;
    let cancelledCount = 0;
    const allPayments = [];

    invoices.forEach((inv) => {
      totalInvoiced += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      outstandingBalance += inv.balanceAmount || 0;

      if (inv.paymentStatus === "paid") paidCount++;
      else if (inv.paymentStatus === "pending") pendingCount++;
      else if (inv.paymentStatus === "partially_paid") partiallyPaidCount++;
      else if (inv.paymentStatus === "overdue") overdueCount++;
      else if (inv.paymentStatus === "cancelled") cancelledCount++;

      if (inv.paymentHistory && inv.paymentHistory.length > 0) {
        inv.paymentHistory.forEach((p) => {
          allPayments.push({
            invoiceNumber: inv.invoiceNumber,
            invoiceId: inv._id,
            amount: p.amount,
            paymentMethod: p.paymentMethod,
            transactionRef: p.transactionRef,
            paidAt: p.paidAt,
            notes: p.notes,
          });
        });
      }
    });

    allPayments.sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt));

    return res.status(200).json({
      message: "Customer billing history fetched successfully",
      customer: {
        _id: customer._id,
        customerId: customer.customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phonenumber,
        address: customer.address,
      },
      metrics: {
        totalInvoices: invoices.length,
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
        outstandingBalance: Math.round(outstandingBalance * 100) / 100,
        statusBreakdown: {
          paid: paidCount,
          pending: pendingCount,
          partially_paid: partiallyPaidCount,
          overdue: overdueCount,
          cancelled: cancelledCount,
        },
      },
      invoices,
      allPayments,
    });
  } catch (error) {
    console.error("CUSTOMER BILLING HISTORY ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 8. Generate Downloadable Invoice Documents (PDF or HTML)
app.get("/invoices/:id/download", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const format = (req.query.format || "pdf").toLowerCase();

    let invoice = null;
    if (mongosse.Types.ObjectId.isValid(id)) {
      invoice = await Invoice.findById(id);
    }
    if (!invoice) {
      invoice = await Invoice.findOne({ invoiceNumber: id });
    }

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    await invoice.populate("customerId");
    await invoice.populate("shipmentId");

    const customerObj = invoice.customerId?.toObject
      ? invoice.customerId.toObject()
      : invoice.customerId || {};
    const shipmentObj = invoice.shipmentId?.toObject
      ? invoice.shipmentId.toObject()
      : invoice.shipmentId || {};

    if (format === "html") {
      const htmlContent = generateInvoiceHTML(
        invoice,
        customerObj,
        shipmentObj,
      );
      res.setHeader("Content-Type", "text/html");
      return res.status(200).send(htmlContent);
    }

    // Default: PDF format
    const pdfBuffer = await generateInvoicePDF(
      invoice,
      customerObj,
      shipmentObj,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    return res.status(200).end(pdfBuffer);
  } catch (error) {
    console.error("DOWNLOAD INVOICE ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 9. Billing Reports & Analytics
app.get("/billing/reports", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, status, customerId } = req.query;

    await syncOverdueInvoices();

    const filter = {};

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    if (status) {
      filter.paymentStatus = status.toLowerCase();
    }

    if (customerId && mongosse.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    const invoices = await Invoice.find(filter)
      .populate("customerId", "customerId name email")
      .populate("shipmentId", "shipmentId trackingId")
      .sort({ issueDate: -1 });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;

    const statusCounts = {
      paid: 0,
      pending: 0,
      partially_paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    const paymentMethods = {};

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      totalOutstanding += inv.balanceAmount || 0;

      if (inv.paymentStatus === "overdue") {
        totalOverdue += inv.balanceAmount || 0;
      }

      if (statusCounts[inv.paymentStatus] !== undefined) {
        statusCounts[inv.paymentStatus]++;
      }

      if (inv.paymentMethod) {
        paymentMethods[inv.paymentMethod] =
          (paymentMethods[inv.paymentMethod] || 0) + 1;
      }
    });

    const summary = {
      totalInvoices: invoices.length,
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalOverdue: Math.round(totalOverdue * 100) / 100,
      paidCount: statusCounts.paid,
      pendingCount: statusCounts.pending,
      partiallyPaidCount: statusCounts.partially_paid,
      overdueCount: statusCounts.overdue,
      cancelledCount: statusCounts.cancelled,
      paymentMethods,
    };

    return res.status(200).json({
      message: "Billing report generated successfully",
      summary,
      invoices,
    });
  } catch (error) {
    console.error("BILLING REPORT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

// 10. Billing Report Export to Excel (.xlsx)
app.get("/billing/reports/export", authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, status, customerId } = req.query;

    await syncOverdueInvoices();

    const filter = {};

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    if (status) {
      filter.paymentStatus = status.toLowerCase();
    }

    if (customerId && mongosse.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    const invoices = await Invoice.find(filter)
      .populate("customerId")
      .populate("shipmentId")
      .sort({ issueDate: -1 });

    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let totalOverdue = 0;
    const statusCounts = {
      paid: 0,
      pending: 0,
      partially_paid: 0,
      overdue: 0,
      cancelled: 0,
    };

    invoices.forEach((inv) => {
      totalBilled += inv.totalAmount || 0;
      totalPaid += inv.paidAmount || 0;
      totalOutstanding += inv.balanceAmount || 0;
      if (inv.paymentStatus === "overdue")
        totalOverdue += inv.balanceAmount || 0;
      if (statusCounts[inv.paymentStatus] !== undefined)
        statusCounts[inv.paymentStatus]++;
    });

    const summary = {
      totalInvoices: invoices.length,
      totalBilled: Math.round(totalBilled * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOutstanding: Math.round(totalOutstanding * 100) / 100,
      totalOverdue: Math.round(totalOverdue * 100) / 100,
      paidCount: statusCounts.paid,
      pendingCount: statusCounts.pending,
      partiallyPaidCount: statusCounts.partially_paid,
      overdueCount: statusCounts.overdue,
      cancelledCount: statusCounts.cancelled,
    };

    const excelBuffer = generateBillingExcelReport(summary, invoices);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Billing-Report-${Date.now()}.xlsx"`,
    );
    res.setHeader("Content-Length", excelBuffer.length);

    return res.status(200).end(excelBuffer);
  } catch (error) {
    console.error("EXPORT BILLING REPORT ERROR:", error);
    return res.status(500).json({ message: error.message });
  }
});

app.post("/admin-signup", async (req, res) => {
  const { name, email, password, secretCode } = req.body || {};
  const secret = (secretCode || "").toString().trim();

  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ message: "Invalid request body" });
    }

    // Validate email format
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    // Clean email
    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const checkEmail = await User.findOne({ email: cleanEmail });
    if (checkEmail) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Validate password
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    // Check secret code
    if (!secret) {
      return res.status(400).json({ message: "Secret code is required" });
    }

    const envSecretCode = (process.env.SECRET_CODE || "").trim();
    if (!envSecretCode || secret !== envSecretCode) {
      return res.status(400).json({ message: "Invalid secret code" });
    }

    // Determine admin name (from request or fallback to email username)
    const adminName =
      typeof name === "string" && name.trim()
        ? name.trim()
        : cleanEmail.split("@")[0] || "Admin";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Admin user with default role Admin
    const newAdmin = new User({
      name: adminName,
      email: cleanEmail,
      password: hashedPassword,
      role: "Admin",
      status: "active",
    });

    await newAdmin.save();

    await createAuditLog({
      userId: newAdmin._id,
      action: "CREATE_ADMIN",
      resource: "User",
      resourceId: newAdmin._id.toString(),
    }).catch(() => {});

    return res.status(201).json({
      message: "Admin signup successful",
      role: "Admin",
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("ADMIN SIGNUP ERROR:", error);
    return res
      .status(500)
      .json({ message: error.message || "Failed to register admin" });
  }
});

app.post("/query", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Please Fill All the Details" });
    }

    const newQuery = new Query({
      name,
      email,
      message,
    });

    await newQuery.save();
    res.status(200).json({ message: "Query Was Send Successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.get("/query", authMiddleware, async (req, res) => {
  try {
    const getQuery = await Query.find().sort({ datetime: -1, _id: -1 });

    res.status(200).json({ message: "Queries", getQuery });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.delete("/query/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await Query.findByIdAndDelete(id);
    res.status(200).json({ message: "Query deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
