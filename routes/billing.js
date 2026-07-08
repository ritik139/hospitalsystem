const express = require("express");
const router = express.Router();
const Bill = require("../models/Bill");

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
