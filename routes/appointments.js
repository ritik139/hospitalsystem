const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ─── Schema ───────────────────────────────────────────────────────────────────
const appointmentSchema = new mongoose.Schema(
  {
    pName: { type: String, required: true, trim: true },
    dName: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Completed"],
    },
    payment: { type: String, default: "Unpaid", enum: ["Unpaid", "Paid"] },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

// ─── GET all appointments ─────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ date: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create appointment ──────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { pName, dName, date, status, payment } = req.body;
    if (!pName || !dName || !date)
      return res
        .status(400)
        .json({ error: "Patient, doctor, and date are required." });

    const appointment = await Appointment.create({
      pName,
      dName,
      date,
      status: status || "Pending",
      payment: payment || "Unpaid",
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH toggle status / payment ───────────────────────────────────────────
// Called by toggleStatus() in index.html
router.patch("/:id", async (req, res) => {
  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body }, // accepts { status } or { payment } or both
      { new: true }
    );
    if (!updated)
      return res.status(404).json({ error: "Appointment not found." });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE appointment ───────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: "Appointment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
