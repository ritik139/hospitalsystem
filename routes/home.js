const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient"); // adjust path if needed
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");

// GET /api/home/stats — PUBLIC (no auth required)
// Returns live counts for the home page live stats bar
router.get("/stats", async (req, res) => {
  try {
    const [patients, doctors, appointments, bills] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      Bill.find({ status: "Paid" }),
    ]);

    const revenue = bills.reduce((sum, b) => sum + Number(b.fee), 0);

    res.json({ patients, doctors, appointments, revenue });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error loading stats", error: err.message });
  }
});

module.exports = router;
