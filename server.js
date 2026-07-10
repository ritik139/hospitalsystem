const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
const authMiddleware = require("./middleware/authMiddleware");

// ─── Silence Chrome DevTools 404 probe ───────────────────────────────────────
app.get("/.well-known/appspecific/com.chrome.devtools.json", (req, res) => {
  res.json({});
});

// ─── Default route: open the Home page when the website loads ───────────────
// Registered BEFORE the static middleware below, and static's own
// auto-index behavior is disabled (index: false). Without this, express
// .static would silently serve frontend/index.html for "/" on its own,
// before this route ever ran - which is why the site was opening the
// Login page instead of the Home page on first visit.
app.get("/", (req, res) => {
  const fs = require("fs");
  const frontendHome = path.join(__dirname, "frontend", "home.html");
  const rootHome = path.join(__dirname, "home.html");
  if (fs.existsSync(frontendHome)) {
    res.sendFile(frontendHome);
  } else if (fs.existsSync(rootHome)) {
    res.sendFile(rootHome);
  } else {
    res
      .status(404)
      .send(
        "home.html not found. Please place it in the same folder as server.js or inside a /frontend subfolder."
      );
  }
});

// ─── Serve remaining static files (CSS/JS/images, other pages like
//     index.html, about.html, dashboard.html when explicitly requested) ──────
// { index: false } stops these from auto-serving index.html for "/" or any
// other directory-style request, so the explicit "/" route above is always
// the one that decides what opens by default.
app.use(express.static(path.join(__dirname, "frontend"), { index: false }));
app.use(express.static(__dirname, { index: false })); // fallback: files next to server.js

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/patients", require("./routes/patients"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/home",  require("./routes/home"));
app.use("/api/about", require("./routes/about"));
app.use("/api/chatbot", require("./routes/chatbot"));

// ─── Catch-all: serve index.html for any unknown route ───────────────────────
app.get("*", (req, res) => {
  // Try frontend/index.html first, then root index.html
  const frontendPath = path.join(__dirname, "frontend", "index.html");
  const rootPath = path.join(__dirname, "index.html");
  const fs = require("fs");
  if (fs.existsSync(frontendPath)) {
    res.sendFile(frontendPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res
      .status(404)
      .send(
        "index.html not found. Please place it in the same folder as server.js or inside a /frontend subfolder."
      );
  }
});

// ─── MongoDB + Server Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/kite";

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });