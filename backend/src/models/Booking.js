const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    artistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ArtistProfile",
      required: true,
      index: true,
    },
    eventDate: {
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
    durationHours: {
      type: Number,
      required: true,
    },
    eventType: String,
    eventLocation: {
      venue: String,
      address: String,
      city: String,
      country: String,
      latitude: Number,
      longitude: Number,
    },
    eventDetails: String,
    totalPrice: {
      type: Number,
      required: true,
    },
    artistPrice: Number,
    platformFee: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
      index: true,
    },
    paymentIntentId: String,
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled", "disputed"],
      default: "pending",
      index: true,
    },
    cancellationReason: String,
    cancellationBy: {
      type: String,
      enum: ["client", "artist"],
    },
    clientNotes: String,
    artistNotes: String,
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
