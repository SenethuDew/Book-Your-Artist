const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: String,
    location: String,
    profileImage: String,
    bio: String,
    role: {
      type: String,
      enum: ["client", "artist", "admin"],
      default: "client",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "active",
      index: true,
    },
  },
  { timestamps: true }
);

// Compare passwords - used during login
userSchema.methods.matchPassword = function(plainPassword) {
  return bcryptjs.compareSync(plainPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
