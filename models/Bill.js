const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    doctorName: { type: String, required: true },
    service: { type: String, required: true },
    fee: { type: Number, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ["Paid", "Unpaid"], default: "Unpaid" },
    notes: { type: String, default: "" },
    // Backend-only link to the Appointment this bill belongs to.
    // Not exposed in any form field, doesn't affect the UI - used purely
    // so Billing <-> Appointment payment status can stay in sync.
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);