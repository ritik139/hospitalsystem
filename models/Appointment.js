const mongoose = require("mongoose");

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

module.exports = mongoose.model("Appointment", appointmentSchema);