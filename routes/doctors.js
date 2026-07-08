const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ─── Schema ───────────────────────────────────────────────────────────────────
const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    spec: { type: String, required: true, trim: true },
    status: {
      type: String,
      default: "Available",
      enum: ["Available", "Unavailable"],
    },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

// ─── GET all doctors ──────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create doctor ───────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, spec, status } = req.body;
    if (!name || !spec)
      return res
        .status(400)
        .json({ error: "Name and specialty are required." });

    const doctor = await Doctor.create({
      name,
      spec,
      status: status || "Available",
    });
    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE doctor ────────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
