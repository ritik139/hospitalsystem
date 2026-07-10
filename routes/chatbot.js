const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const Bill = require("../models/Bill");

const JWT_SECRET = process.env.JWT_SECRET || "mediflow_secret_key";

/* ────────────────────────────────────────────────────────────────────────
   EDITABLE FAQ KNOWLEDGE BASE
   Add or edit entries here any time - no code changes needed elsewhere.
   Each entry: keywords (lowercase substrings to match in the user's
   message) + the answer to send back. First match wins, so put more
   specific entries above more general ones.
──────────────────────────────────────────────────────────────────────── */
const FAQ = [
  {
    keywords: ["timing", "timings", "hours", "open", "close", "working hours"],
    answer:
      "🕒 Our hospital is open Monday–Saturday, 8:00 AM – 8:00 PM. The Emergency department is open 24/7.",
  },
  {
    keywords: [
      "book appointment",
      "schedule appointment",
      "how to book",
      "make an appointment",
      "new appointment",
      "appointment",
      "appointments",
    ],
    answer:
      "📅 To book an appointment, go to the Appointments tab in your dashboard, click '+ Add New Record', choose a patient, doctor, and date, then save. Front desk staff can also do this for you. If you're logged in, ask me things like 'pending appointments' for live numbers.",
  },
  {
    keywords: ["cancel appointment", "reschedule"],
    answer:
      "📅 To cancel or reschedule, please contact the front desk directly, or a staff member can update the appointment status from the dashboard.",
  },
  {
    keywords: ["bill", "billing", "invoice", "payment", "pay", "fee", "fees", "cost"],
    answer:
      "💳 Bills are generated after each visit and can be marked Paid/Unpaid from the Billing tab, where you can also print an invoice. If you're logged in, ask me 'unpaid bills' or 'total revenue' for live numbers.",
  },
  {
    keywords: ["insurance"],
    answer:
      "🏥 We accept most major insurance providers. Please bring your insurance card and ID to your appointment, and our billing staff will verify coverage.",
  },
  {
    keywords: ["service", "services", "specialt", "department", "doctor", "doctors"],
    answer:
      "🩺 We offer general consultation, lab tests, X-ray/scans, physiotherapy, minor surgery, and emergency care. If you're logged in, ask me 'list doctors' to see our specialists.",
  },
  {
    keywords: ["emergency"],
    answer:
      "🚑 For medical emergencies, please call our emergency line immediately or visit the Emergency department, open 24/7.",
  },
  {
    keywords: ["contact", "phone", "address", "location", "email"],
    answer:
      "📍 You can reach the front desk during working hours, or check the Contact section on our About page for full details.",
  },
  {
    keywords: ["parking"],
    answer: "🚗 Free visitor parking is available at the main entrance.",
  },
];

const GREETINGS = [
  "hi",
  "hello",
  "hey",
  "hii",
  "hlo",
  "good morning",
  "good afternoon",
  "good evening",
];

function normalize(text) {
  return (text || "").toLowerCase().trim();
}

/* ── Optional auth: attaches the decoded user if a valid token is present,
     but never blocks the request - plain FAQ must still work logged out. */
function getUserIfPresent(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  try {
    return jwt.verify(authHeader.split(" ")[1], JWT_SECRET); // { id, email, role, name }
  } catch {
    return null;
  }
}

/* ── Data-backed intents (require login). Reuses the same Patient/Doctor
     models already registered by routes/patients.js and routes/doctors.js
     (via mongoose.models) instead of redefining them, so nothing about
     those files needs to change. ─────────────────────────────────────── */
async function handleDataIntent(message, user) {
  const Patient = mongoose.models.Patient;
  const Doctor = mongoose.models.Doctor;

  if (/\bdoctors?\b/.test(message) && Doctor) {
    const doctors = await Doctor.find().limit(20);
    if (!doctors.length) return "There are no doctors on record yet.";
    const lines = doctors.map((d) => `• Dr. ${d.name} — ${d.spec} (${d.status})`);
    return `👨‍⚕️ ${doctors.length} doctor(s) on record:\n${lines.join("\n")}`;
  }

  if (/\bpatients?\b/.test(message) && Patient) {
    const count = await Patient.countDocuments();
    if (/\blist|all\b/.test(message)) {
      const patients = await Patient.find().limit(10);
      const lines = patients.map((p) => `• ${p.name} (age ${p.age}) — ${p.disease}`);
      return `🧑‍🤝‍🧑 ${count} patient(s) on record. Showing latest ${patients.length}:\n${lines.join("\n")}`;
    }
    return `🧑‍🤝‍🧑 There are currently ${count} patient(s) registered.`;
  }

  if (/\bmy appointments?\b/.test(message)) {
    const mine = await Appointment.find({ dName: user.name }).sort({ date: -1 }).limit(10);
    if (!mine.length) return `You have no appointments on record, ${user.name}.`;
    const lines = mine.map(
      (a) => `• ${a.pName} — ${new Date(a.date).toDateString()} (${a.status}, ${a.payment})`
    );
    return `📋 Your appointments:\n${lines.join("\n")}`;
  }

  if (/\bpending appointments?\b/.test(message)) {
    const count = await Appointment.countDocuments({ status: "Pending" });
    return `⏳ There are ${count} pending appointment(s) right now.`;
  }
  if (/\bcompleted appointments?\b/.test(message)) {
    const count = await Appointment.countDocuments({ status: "Completed" });
    return `✅ There are ${count} completed appointment(s) on record.`;
  }
  if (/\bappointments?\b/.test(message)) {
    const total = await Appointment.countDocuments();
    const pending = await Appointment.countDocuments({ status: "Pending" });
    const completed = await Appointment.countDocuments({ status: "Completed" });
    return `📋 ${total} total appointment(s): ${pending} pending, ${completed} completed.`;
  }

  if (/\bunpaid bills?\b/.test(message)) {
    const count = await Bill.countDocuments({ status: "Unpaid" });
    return `💳 There are ${count} unpaid bill(s).`;
  }
  if (/\bpaid bills?\b/.test(message)) {
    const count = await Bill.countDocuments({ status: "Paid" });
    return `💳 There are ${count} paid bill(s).`;
  }
  if (/\b(total revenue|revenue)\b/.test(message)) {
    const paidBills = await Bill.find({ status: "Paid" });
    const total = paidBills.reduce((sum, b) => sum + Number(b.fee || 0), 0);
    return `💰 Total revenue from paid bills: $${total.toLocaleString()}.`;
  }
  if (/\bbills?\b/.test(message)) {
    const total = await Bill.countDocuments();
    const unpaid = await Bill.countDocuments({ status: "Unpaid" });
    return `💳 ${total} total bill(s), ${unpaid} unpaid.`;
  }

  return null; // nothing data-related matched
}

// Phrases that clearly want live data - if these are asked while logged
// out, we tell the person to log in instead of silently falling back to FAQ.
const DATA_KEYWORDS = [
  "my appointments",
  "list doctors",
  "list patients",
  "how many patients",
  "pending appointments",
  "completed appointments",
  "unpaid bills",
  "paid bills",
  "revenue",
];

router.post("/", async (req, res) => {
  try {
    const rawMessage = req.body.message;
    if (!rawMessage || !rawMessage.trim()) {
      return res.json({ reply: "Please type a question and I'll do my best to help! 🙂" });
    }
    const message = normalize(rawMessage);
    const user = getUserIfPresent(req);

    // 1. Greeting
    if (GREETINGS.some((g) => message === g || message.startsWith(g))) {
      return res.json({
        reply:
          "👋 Hi! I'm the MediFlow Assistant. Ask me about doctors, appointments, billing, timings, or services. " +
          (user
            ? "Since you're logged in, you can also ask things like 'list doctors', 'pending appointments', or 'unpaid bills'."
            : "Log in for live data like appointments and billing."),
      });
    }

    // 2. If it's clearly a data question but no one's logged in, say so
    const looksLikeDataQuery = DATA_KEYWORDS.some((k) => message.includes(k));
    if (looksLikeDataQuery && !user) {
      return res.json({
        reply: "🔒 Please log in to view that information - it's only available to signed-in staff.",
      });
    }

    // 3. Logged-in staff: try live data first
    if (user) {
      const dataAnswer = await handleDataIntent(message, user);
      if (dataAnswer) return res.json({ reply: dataAnswer });
    }

    // 4. General FAQ keyword match
    const match = FAQ.find((entry) => entry.keywords.some((k) => message.includes(k)));
    if (match) return res.json({ reply: match.answer });

    // 5. Fallback
    return res.json({
      reply:
        "🤔 I'm not sure about that one. Try asking about doctors, appointments, billing, services, or timings" +
        (user ? ", or things like 'pending appointments' / 'unpaid bills'." : ". Log in for live data lookups."),
    });
  } catch (err) {
    console.error("Chatbot error:", err.message);
    res.status(500).json({ reply: "Sorry, something went wrong on my end. Please try again." });
  }
});

module.exports = router;