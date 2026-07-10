const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");

// ─── Helper: keep linked/matching bill(s) in sync with an appointment's
//     payment field, whenever that field changes directly on the
//     appointment (e.g. via the payment badge toggle). ───────────────────────
async function syncBillsForAppointment(appointment) {
  try {
    const bills = await Bill.find({
      $or: [
        { appointmentId: appointment._id },
        {
          appointmentId: null,
          patientName: appointment.pName,
          doctorName: appointment.dName,
        },
      ],
    });

    for (const bill of bills) {
      let changed = false;
      if (!bill.appointmentId) {
        bill.appointmentId = appointment._id;
        changed = true;
      }
      if (bill.status !== appointment.payment) {
        bill.status = appointment.payment;
        changed = true;
      }
      if (changed) await bill.save();
    }
  } catch (err) {
    console.error("Bill sync error:", err.message);
  }
}

// ─── GET all appointments ─────────────────────────────────────────────────────
// Default (no query params): returns every appointment, unchanged from before,
// so the Dashboard's Total/Completed/Pending counts stay accurate.
// ?view=pending -> excludes appointments that are Completed AND Paid, i.e. a
//   ready-to-use "Pending Appointments" list. Completed+Paid appointments are
//   never deleted - they're still returned by the default call (or a future
//   "All Appointments / History" view) since they remain in the database.
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.view === "pending") {
      filter.$nor = [{ status: "Completed", payment: "Paid" }];
    }
    const appointments = await Appointment.find(filter).sort({ date: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create appointment ──────────────────────────────────────────────────
// Always created as Pending / Unpaid, regardless of what's sent in the body.
router.post("/", async (req, res) => {
  try {
    const { pName, dName, date } = req.body;
    if (!pName || !dName || !date)
      return res
        .status(400)
        .json({ error: "Patient, doctor, and date are required." });

    const appointment = await Appointment.create({
      pName,
      dName,
      date,
      status: "Pending",
      payment: "Unpaid",
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Shared update handler ─────────────────────────────────────────────────────
// The frontend's toggleStatus() calls this with method PUT; the previous
// version of this file only registered a PATCH route, so those calls were
// silently failing. Both PATCH and PUT are now supported.
async function updateAppointment(req, res) {
  try {
    const allowed = {};
    if (req.body.status !== undefined) allowed.status = req.body.status;
    if (req.body.payment !== undefined) allowed.payment = req.body.payment;
    if (req.body.pName !== undefined) allowed.pName = req.body.pName;
    if (req.body.dName !== undefined) allowed.dName = req.body.dName;
    if (req.body.date !== undefined) allowed.date = req.body.date;

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: allowed },
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ error: "Appointment not found." });

    // Keep billing in sync whenever payment status changes here.
    if (allowed.payment !== undefined) {
      await syncBillsForAppointment(updated);
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.patch("/:id", updateAppointment);
router.put("/:id", updateAppointment);

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