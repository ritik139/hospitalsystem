// const express = require("express");
// const router = express.Router();
// const jwt = require("jsonwebtoken");
// const User = require("../models/User");

// const JWT_SECRET = process.env.JWT_SECRET || "mediflow_secret_key";
// const JWT_EXPIRES = "7d";

// // ─── Helper: sign token ───────────────────────────────────────────────────────
// function signToken(user) {
//   return jwt.sign(
//     { id: user._id, email: user.email, role: user.role, name: user.name },
//     JWT_SECRET,
//     { expiresIn: JWT_EXPIRES }
//   );
// }

// // ─── POST /api/auth/register ──────────────────────────────────────────────────
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     if (!name || !email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Name, email and password are required." });
//     }

//     const existing = await User.findOne({ email });
//     if (existing) {
//       return res
//         .status(409)
//         .json({ message: "An account with this email already exists." });
//     }

//     const user = await User.create({ name, email, password, role });
//     const token = signToken(user);

//     res.status(201).json({
//       message: "Account created successfully.",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ message: "Server error during registration." });
//   }
// });

// // ─── POST /api/auth/login ─────────────────────────────────────────────────────
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res
//         .status(400)
//         .json({ message: "Email and password are required." });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: "Invalid email or password." });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid email or password." });
//     }

//     const token = signToken(user);

//     res.json({
//       message: "Login successful.",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ message: "Server error during login." });
//   }
// });

// // ─── GET /api/auth/me — verify token & return current user ───────────────────
// router.get("/me", async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({ message: "No token provided." });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) return res.status(404).json({ message: "User not found." });

//     res.json({ user });
//   } catch (err) {
//     res.status(401).json({ message: "Invalid or expired token." });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "mediflow_secret_key";
const JWT_EXPIRES = "7d";
const MASTER_PASSWORD = process.env.MASTER_PASSWORD;

// ─── Helper: sign token ───────────────────────────────────────────────────────
function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    // Fixed password check
    if (password !== MASTER_PASSWORD) {
      return res.status(401).json({
        message: "Invalid master password.",
      });
    }

    const existing = await User.findOne({ email });

    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    const token = signToken(user);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({
      message: "Server error during registration.",
    });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    // Fixed password check
    if (password !== MASTER_PASSWORD) {
      return res.status(401).json({
        message: "Invalid master password.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = signToken(user);

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Server error during login.",
    });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    res.json({ user });
  } catch (err) {
    res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
});

module.exports = router;
