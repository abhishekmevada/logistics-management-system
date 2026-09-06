require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jsonwebtoken = require("jsonwebtoken");
const crypto = require("crypto");
const { sendOtpEmail } = require("./utils/mailer");
const { User, Customer, Shipment } = require("./db/db");

const app = express();

app.use(cors());
app.use(express.json());

const port = 5000;

const jwt = process.env.JWT_SECRET;

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

async function generateCustomerId() {
  let customerId;
  let exists = true;

  while (exists) {
    customerId = Math.floor(100000 + Math.random() * 900000).toString();

    const existingCustomer = await Customer.findOne({
      customerId,
    });

    exists = !!existingCustomer;
  }

  return customerId;
}

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

    // If role is empty/missing, default to customer
    const cleanRole =
      typeof role === "string" && role.trim() !== ""
        ? role.trim().toLowerCase()
        : "customer";

    // Allowed roles
    const allowedRoles = [
      "admin",
      "logistic manager",
      "dispatcher",
      "warehouse manager",
      "griver",
      "customer",
    ];

    // Check invalid role
    if (!allowedRoles.includes(cleanRole)) {
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

    // // Check existing name
    // const existName = await User.findOne({
    //   name: cleanName,
    // });

    // if (existName) {
    //   return res.status(400).json({
    //     message: "Username already exists",
    //   });
    // }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const newUser = new User({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: cleanRole,
    });

    // Save User
    await newUser.save();

    // ==========================================
    // CUSTOMER
    // ==========================================

    if (cleanRole === "customer") {
      // Generate unique customer ID
      const customerId = await generateCustomerId();

      // Create Customer
      const newCustomer = new Customer({
        userId: newUser._id,
        customerId,
        name: cleanName,
        email: cleanEmail,
        phonenumber,
        address,
      });

      // Save Customer
      await newCustomer.save();

      return res.status(201).json({
        message: "Customer signup successful",
        customerId,
      });
    }

    return res.status(201).json({
      message: "User signup successful",
      role: cleanRole,
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

async function generateShipmentId() {
  let shipmentId;
  let exists = true;

  while (exists) {
    shipmentId = Math.floor(100000 + Math.random() * 900000).toString();

    const existingShipment = await Customer.findOne({
      shipmentId,
    });

    exists = !!existingShipment;
  }

  return shipmentId;
}

app.post("/createshipment", authMiddleware, async (req, res) => {
  const {
    customerId,
    senderName,
    senderPhonenumber,
    pickupaddress,
    receiverName,
    receiverPhonenumber,
    deliveryaddress,
    packageCount,
    totalweight,
    dimensions,
    length,
    width,
    height,
    packageDescription,
    pickupDate,
    expectedDeliveryDate,
  } = req.body;

  try {
    const genshipmentId = await generateShipmentId();
    const newShipment = new Shipment({
      shipmentId: genshipmentId,
      trackingId, // write a code for generate trackingId
      customerId,
      senderName,
      senderPhonenumber,
      pickupaddress,
      receiverName,
      receiverPhonenumber,
      deliveryaddress,
      packageCount,
      totalweight,
      dimensions,
      length,
      width,
      height,
      packageDescription,
      pickupDate,
      expectedDeliveryDate,
    });

    await newShipment.save();
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
