require("dotenv").config();

const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const jsonwebtoken = require("jsonwebtoken");
const { User, Customer } = require("./db/db");

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
        password: hashedPassword,
      });

      // Save Customer
      await newCustomer.save();

      return res.status(201).json({
        message: "Customer signup successful",
        customerId,
      });
    }

    // ==========================================
    // OTHER ROLES
    // ==========================================

    return res.status(201).json({
      message: "User signup successful",
      role: cleanRole,
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);

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

    if (existUser.status === false) {
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
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
