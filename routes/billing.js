const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");
const Appointment = require("../models/Appointment");

// ─── Helper: find (and remember) which appointment a bill belongs to ─────────
// Prefers the stored link; falls back to matching patient + doctor name
// (most recent visit) since the "Add Bill" form doesn't collect an
// appointment ID directly.
async function linkAppointment(bill) {
  if (bill.appointmentId) {
    const linked = await Appointment.findById(bill.appointmentId);
    if (linked) return linked;
  }
  const match = await Appointment.findOne({
    pName: bill.patientName,
    dName: bill.doctorName,
  }).sort({ date: -1 });

  if (match) {
    bill.appointmentId = match._id;
    await bill.save();
  }
  return match;
}

// ─── Helper: push a bill's status onto its matching appointment's payment ────
async function syncAppointmentForBill(bill) {
  try {
    const appointment = await linkAppointment(bill);
    if (!appointment) return;
    if (appointment.payment !== bill.status) {
      appointment.payment = bill.status;
      await appointment.save();
    }
  } catch (err) {
    console.error("Appointment sync error:", err.message);
  }
}

// GET all bills
router.get("/", async (req, res) => {
  try {
    const bills = await Bill.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching bills", error: err.message });
  }
});

// POST create bill
router.post("/", async (req, res) => {
  try {
    const { patientName, doctorName, service, fee, date, status, notes } =
      req.body;
    if (!patientName || !doctorName || !service || !fee || !date) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const bill = await Bill.create({
      patientName,
      doctorName,
      service,
      fee,
      date,
      status: status || "Unpaid",
      notes: notes || "",
    });

    // Mirror the bill's status onto the matching appointment's payment field.
    await syncAppointmentForBill(bill);

    res.status(201).json(bill);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating bill", error: err.message });
  }
});

// PUT update bill (toggle paid/unpaid or edit)
router.put("/:id", async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!bill) return res.status(404).json({ message: "Bill not found" });

    // Whenever status is touched (e.g. toggleBillStatus), keep the
    // appointment's payment field synced to match.
    if (req.body.status !== undefined) {
      await syncAppointmentForBill(bill);
    }

    res.json(bill);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error updating bill", error: err.message });
  }
});

// DELETE bill
router.delete("/:id", async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: "Bill deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting bill", error: err.message });
  }
});

module.exports = router;