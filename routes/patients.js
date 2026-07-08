const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// ─── Schema ───────────────────────────────────────────────────────────────────
const patientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true },
    disease: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

// ─── GET all patients ─────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create patient ──────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, age, disease } = req.body;
    if (!name || !age || !disease)
      return res.status(400).json({ error: "All fields are required." });

    const patient = await Patient.create({ name, age, disease });
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE patient ───────────────────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: "Patient deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
