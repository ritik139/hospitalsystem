// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: function () {
//         // Google-authenticated users don't have a local password
//         return !this.googleId;
//       },
//       minlength: 6,
//     },
//     googleId: {
//       type: String,
//       default: null,
//       unique: true,
//       sparse: true, // allows many docs with no googleId without violating uniqueness
//     },
//     authProvider: {
//       type: String,
//       enum: ["local", "google"],
//       default: "local",
//     },
//     role: {
//       type: String,
//       enum: ["admin", "doctor", "front_desk"],
//       default: "front_desk",
//     },
//   },
//   { timestamps: true }
// );

// // Hash password before saving (skip if there's no password, e.g. Google users)
// userSchema.pre("save", async function (next) {
//   if (!this.password || !this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 12);
//   next();
// });

// // Compare password helper
// userSchema.methods.comparePassword = async function (candidatePassword) {
//   if (!this.password) return false; // Google-only account, no local password set
//   return bcrypt.compare(candidatePassword, this.password);
// };

// module.exports = mongoose.model("User", userSchema);









const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        // Google-authenticated users don't have a local password
        return !this.googleId;
      },
      minlength: 6,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many docs with no googleId without violating uniqueness
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "front_desk"],
      default: "front_desk",
    },
  },
  { timestamps: true }
);

// Hash password before saving (skip if there's no password, e.g. Google users)
userSchema.pre("save", async function (next) {
  if (!this.password || !this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google-only account, no local password set
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);