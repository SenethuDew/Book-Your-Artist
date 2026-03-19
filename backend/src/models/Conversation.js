const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      required: true,
      index: true,
    },
    relatedBookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    lastMessage: String,
    lastMessageAt: Date,
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
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

module.exports = mongoose.model("Conversation", conversationSchema);
