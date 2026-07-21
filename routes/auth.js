// const express = require("express");
// const router = express.Router();
// const jwt = require("jsonwebtoken");
// const { OAuth2Client } = require("google-auth-library");
// const User = require("../models/User");

// const JWT_SECRET = process.env.JWT_SECRET || "mediflow_secret_key";
// const JWT_EXPIRES = "7d";

// const VALID_ROLES = ["admin", "doctor", "front_desk"];

// const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
// const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// // ─── Helper: sign token ───────────────────────────────────────────────────────
// function signToken(user) {
//   return jwt.sign(
//     {
//       id: user._id,
//       email: user.email,
//       role: user.role,
//       name: user.name,
//     },
//     JWT_SECRET,
//     { expiresIn: JWT_EXPIRES }
//   );
// }

// // ─── POST /api/auth/register ──────────────────────────────────────────────────
// // router.post("/register", async (req, res) => {
// //   try {
// //     const { name, email, password, role } = req.body;

// router.post("/register", async (req, res) => {
//   console.log("******** NEW AUTH.JS REGISTER ********");

//   try {
//     const { name, email, password, role } = req.body;

//     // All fields required
//     if (!name || !email || !password) {
//       return res.status(400).json({
//         message: "Name, email and password are required.",
//       });
//     }

//     // Password length check (server-side mirror of frontend check)s
//     if (password.length < 6) {
//       return res.status(400).json({
//         message: "Password must be at least 6 characters.",
//       });
//     }

//     // Validate role if provided
//     if (role && !VALID_ROLES.includes(role)) {
//       return res.status(400).json({
//         message: "Invalid role selected.",
//       });
//     }

//     const existing = await User.findOne({ email: email.toLowerCase().trim() });

//     if (existing) {
//       return res.status(409).json({
//         message: "An account with this email already exists.",
//       });
//     }

//     // User.js pre-save hook hashes the password with bcrypt automatically
//     const user = await User.create({
//       name,
//       email,
//       password,
//       role,
//     });

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
//     res.status(500).json({
//       message: "Server error during registration.",
//     });
//   }
// });

// // ─── POST /api/auth/login ─────────────────────────────────────────────────────
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         message: "Email and password are required.",
//       });
//     }

//     const user = await User.findOne({ email: email.toLowerCase().trim() });

//     if (!user) {
//       return res.status(401).json({
//         message: "Invalid email or password.",
//       });
//     }

//     // Verify the submitted password against the bcrypt hash on file
//     const isMatch = await user.comparePassword(password);

//     if (!isMatch) {
//       return res.status(401).json({
//         message: "Invalid email or password.",
//       });
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
//     res.status(500).json({
//       message: "Server error during login.",
//     });
//   }
// });

// // ─── POST /api/auth/google ────────────────────────────────────────────────────
// // Body: { credential } — the ID token returned by Google Identity Services
// router.post("/google", async (req, res) => {
//   try {
//     const { credential } = req.body;

//     if (!credential) {
//       return res.status(400).json({
//         message: "Missing Google credential.",
//       });
//     }

//     if (!GOOGLE_CLIENT_ID) {
//       console.error("GOOGLE_CLIENT_ID is not set in the environment.");
//       return res.status(500).json({
//         message: "Google Sign-In is not configured on the server.",
//       });
//     }

//     // Verify the ID token with Google
//     let payload;
//     try {
//       const ticket = await googleClient.verifyIdToken({
//         idToken: credential,
//         audience: GOOGLE_CLIENT_ID,
//       });
//       payload = ticket.getPayload();
//     } catch (verifyErr) {
//       console.error("Google token verification failed:", verifyErr);
//       return res.status(401).json({
//         message: "Invalid Google credential.",
//       });
//     }

//     const { sub: googleId, email, name, email_verified } = payload;

//     if (!email || !email_verified) {
//       return res.status(401).json({
//         message: "Google account email could not be verified.",
//       });
//     }

//     const normalizedEmail = email.toLowerCase().trim();

//     // 1) Look for an existing user linked to this Google account
//     let user = await User.findOne({ googleId });

//     if (!user) {
//       // 2) Fall back to matching by email (e.g. they previously registered
//       //    with a password using the same email) and link the Google account
//       user = await User.findOne({ email: normalizedEmail });

//       if (user) {
//         user.googleId = googleId;
//         if (!user.authProvider || user.authProvider === "local") {
//           // Keep authProvider as "local" if they already have a password,
//           // so they can still log in either way.
//         }
//         await user.save();
//       }
//     }

//     // 3) No existing account at all — create one automatically
//     if (!user) {
//       user = await User.create({
//         name: name || normalizedEmail.split("@")[0],
//         email: normalizedEmail,
//         googleId,
//         authProvider: "google",
//         role: "front_desk", // default role for self-service Google sign-ups
//         // No password field — schema treats it as optional when googleId is set
//       });
//     }

//     const token = signToken(user);

//     res.json({
//       message: "Google sign-in successful.",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (err) {
//     console.error("Google auth error:", err);
//     res.status(500).json({
//       message: "Server error during Google sign-in.",
//     });
//   }
// });

// // ─── GET /api/auth/me ─────────────────────────────────────────────────────────
// router.get("/me", async (req, res) => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return res.status(401).json({
//         message: "No token provided.",
//       });
//     }

//     const token = authHeader.split(" ")[1];
//     const decoded = jwt.verify(token, JWT_SECRET);

//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return res.status(404).json({
//         message: "User not found.",
//       });
//     }

//     res.json({ user });
//   } catch (err) {
//     res.status(401).json({
//       message: "Invalid or expired token.",
//     });
//   }
// });

// module.exports = router;








const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "mediflow_secret_key";
const JWT_EXPIRES = "7d";

const VALID_ROLES = ["admin", "doctor", "front_desk"];

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

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
// router.post("/register", async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

router.post("/register", async (req, res) => {
  console.log("******** NEW AUTH.JS REGISTER ********");

  try {
    const { name, email, password, role } = req.body;

    // All fields required
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required.",
      });
    }

    // Password length check (server-side mirror of frontend check)s
    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters.",
      });
    }

    // Validate role if provided
    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: "Invalid role selected.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    // User.js pre-save hook hashes the password with bcrypt automatically
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

    // Duplicate key error (e.g. email already exists, or the googleId
    // sparse-unique index being tripped) - not a real server fault.
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
      return res.status(409).json({
        message:
          field === "email"
            ? "An account with this email already exists."
            : "That account could not be created due to a conflicting record. Please try again.",
      });
    }

    // Mongoose schema validation error (e.g. password too short, missing
    // required field that slipped past the manual checks above).
    if (err.name === "ValidationError") {
      const firstMessage = Object.values(err.errors)[0]?.message;
      return res.status(400).json({
        message: firstMessage || "Invalid registration data.",
      });
    }

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

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    // Verify the submitted password against the bcrypt hash on file
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
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

// ─── POST /api/auth/google ────────────────────────────────────────────────────
// Body: { credential } — the ID token returned by Google Identity Services
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Missing Google credential.",
      });
    }

    if (!GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not set in the environment.");
      return res.status(500).json({
        message: "Google Sign-In is not configured on the server.",
      });
    }

    // Verify the ID token with Google
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      console.error("Google token verification failed:", verifyErr);
      return res.status(401).json({
        message: "Invalid Google credential.",
      });
    }

    const { sub: googleId, email, name, email_verified } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({
        message: "Google account email could not be verified.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1) Look for an existing user linked to this Google account
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2) Fall back to matching by email (e.g. they previously registered
      //    with a password using the same email) and link the Google account
      user = await User.findOne({ email: normalizedEmail });

      if (user) {
        user.googleId = googleId;
        if (!user.authProvider || user.authProvider === "local") {
          // Keep authProvider as "local" if they already have a password,
          // so they can still log in either way.
        }
        await user.save();
      }
    }

    // 3) No existing account at all — create one automatically
    if (!user) {
      user = await User.create({
        name: name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        googleId,
        authProvider: "google",
        role: "front_desk", // default role for self-service Google sign-ups
        // No password field — schema treats it as optional when googleId is set
      });
    }

    const token = signToken(user);

    res.json({
      message: "Google sign-in successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(500).json({
      message: "Server error during Google sign-in.",
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