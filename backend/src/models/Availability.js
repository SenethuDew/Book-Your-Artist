const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Blocked', 'Draft'],
      default: 'Available',
    },
    isPublished: {
      type: Boolean,
      default: true, // Currently default to true for retro-compatibility until fully implemented
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient queries
availabilitySchema.index({ artistId: 1, date: 1 });

module.exports = mongoose.model("Availability", availabilitySchema);
