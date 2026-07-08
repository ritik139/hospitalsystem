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

// ─── Serve index.html (works whether it's in /frontend or same folder) ────────
app.use(express.static(path.join(__dirname, "frontend")));
app.use(express.static(__dirname)); // fallback: index.html next to server.js

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use("/api/patients", require("./routes/patients"));
app.use("/api/doctors", require("./routes/doctors"));
app.use("/api/appointments", require("./routes/appointments"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/billing", require("./routes/billing"));
app.use("/api/home",  require("./routes/home"));
app.use("/api/about", require("./routes/about"));

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
