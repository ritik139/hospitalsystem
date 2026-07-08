const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ── Contact Message Schema (inline, lightweight) ──────────────────────────────
const contactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: "General Enquiry" },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Contact =
  mongoose.models.Contact || mongoose.model("Contact", contactSchema);

// POST /api/about/contact — PUBLIC (no auth required)
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ message: "Name, email and message are required." });
    }

    const entry = await Contact.create({ name, email, subject, message });

    res.status(201).json({
      message: "Message received! We'll get back to you within 24 hours.",
      id: entry._id,
    });
  } catch (err) {
    console.error("Contact form error:", err);
    res
      .status(500)
      .json({ message: "Failed to save message.", error: err.message });
  }
});

// GET /api/about/contact — ADMIN: view all contact messages (protected separately)
router.get("/contact", async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching messages." });
  }
});

module.exports = router;
