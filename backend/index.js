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
const csv = require("csv-parser");
const XLSX = require("xlsx");
const { sendOtpEmail } = require("./utils/mailer");
const { User, Customer, Shipment } = require("./db/db");

const app = express();

app.use(cors());
app.use(express.json());

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
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  if (!header.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Invalid authorization format. Use Bearer token",
    });
  }

  const token = header.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Token is missing",
    });
  }

  try {
    const decoded = jsonwebtoken.verify(token, jwt);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// Signup

app.post("/signup", async (req, res) => {
  const { name, email, phonenumber, password, address, role } = req.body;

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

    // ==========================================
    // CUSTOMER
    // ==========================================

    // if (cleanRole === "customer") {
    //   // Generate unique customer ID
    //   const customerId = await generateCustomerId();

    //   // Create Customer
    //   const newCustomer = new Customer({
    //     userId: newUser._id,
    //     customerId,
    //     phonenumber,
    //     address,
    //   });

    //   // Save Customer
    //   await newCustomer.save();

    //   return res.status(201).json({
    //     message: "Customer signup successful",
    //     customerId,
    //   });
    // }

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

    return res.status(200).json({
      message: "Sign in successful",

      token,

      user: {
        userId: existUser._id,
        userName: existUser.name,
        email: existUser.email,
        role: existUser.role,
        status: existUser.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
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

    if (customer.userId) {
      await User.findByIdAndUpdate(customer.userId, {
        name: cleanName,
        email: cleanEmail,
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

    if (customer.userId) {
      await User.findByIdAndUpdate(
        customer.userId,
        { status: targetStatus },
        { new: true },
      );
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

app.get("/shipments", authMiddleware, async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      search = "",
      status,
      customerId,
      driverId,
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

    if (search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");

      filter.$or = [
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
      // .populate("driverId", "name email role status")
      .sort({
        [sortBy]: sortOrder,
      })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      message: "Shipment list fetched successfully",
      shipments,
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
      driverName: driverName || "",
      vehicleNo: vehicleNo || "",
      tripNo: tripNo || "",
      status: "created",
    });

    await newShipment.save();

    return res.status(201).json({
      message: "Shipment created successfully",
      shipment: newShipment,
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
      shipmentId: shipment.shipmentId,
      trackingId: shipment.trackingId,
      currentStatus: shipment.status,
      timeline,
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
      required: true,
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

      const document = new ShipmentDocument({
        shipmentId: shipment._id,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        mimeType: req.file.mimetype,
        size: req.file.size,
      });

      await document.save();

      return res.status(201).json({
        message: "Shipment document uploaded successfully",
        document,
      });
    } catch (error) {
      console.error("UPLOAD SHIPMENT DOCUMENT ERROR:", error);

      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        message: "Internal server error",
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
  "/shipments/:id/documents/:documentId",
  authMiddleware,
  async (req, res) => {
    try {
      const document = await ShipmentDocument.findById(req.params.documentId);

      if (!document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      const filePath = path.resolve(document.filePath);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: "Document file not found",
        });
      }

      return res.download(filePath, document.originalName);
    } catch (error) {
      console.error("DOWNLOAD SHIPMENT DOCUMENT ERROR:", error);

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
