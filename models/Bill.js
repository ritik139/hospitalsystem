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
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);
