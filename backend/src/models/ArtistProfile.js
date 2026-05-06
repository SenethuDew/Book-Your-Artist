const mongoose = require("mongoose");

const artistProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    name: String,
    bio: String,
    category: String,
    artistType: String,
    location: String,
    genres: {
      type: [String],
      required: true,
      index: true,
    },
    hourlyRate: {
      type: Number,
      required: true,
      index: true,
    },
    experience: { type: Number, default: 0 },
    profileImage: String,
    coverImage: String,
    socialLinks: {
      instagram: String,
      spotify: String,
      youtube: String,
    },
    // Old fields matching original schema
    specialties: [String],
    yearsOfExperience: Number,
    minimumBooking: {
      type: Number,
      default: 1,
    },
    serviceTypes: [String],
    equipmentProvided: [String],
    travelRadius: Number,
    languages: [String],
    timezone: String,
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    portfolio: {
      videoLinks: [String],
      audioLinks: [String],
      images: [String],
      mediaLinks: [
        {
          platform: String,
          url: String,
        },
      ],
    },
    backgroundChecked: {
      type: Boolean,
      default: false,
    },
    verified: {
      type: Boolean,
      default: true,
    },
    /** Payout destination (owner-only via /api/artists/me/payout-bank — never expose in public listings) */
    payoutBank: {
      accountHolderName: { type: String, trim: true },
      bankName: { type: String, trim: true },
      branchName: { type: String, trim: true },
      branchCode: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountType: { type: String, enum: ["savings", "current"], default: "savings" },
      nicNumber: { type: String, trim: true },
      mobileNumber: { type: String, trim: true },
      emailAddress: { type: String, trim: true, lowercase: true },
      country: { type: String, trim: true, default: "Sri Lanka" },
      swiftBic: { type: String, trim: true },
      bankAddress: { type: String, trim: true },
      verificationStatus: {
        type: String,
        enum: ["not_submitted", "pending", "verified", "rejected"],
        default: "not_submitted",
      },
      verificationMethod: {
        type: String,
        enum: ["otp", "admin", "auto"],
      },
      verifiedAt: Date,
      verificationOtp: String,
      verificationOtpExpiresAt: Date,
      verificationOtpAttempts: { type: Number, default: 0 },
      verificationRejectionReason: String,
      submittedAt: Date,
      updatedAt: Date,
    },
    /** Earnings wallet (advance payments credited on artist accept) */
    wallet: {
      balance: { type: Number, default: 0 },
      totalEarned: { type: Number, default: 0 },
      totalRefunded: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      ledger: [
        {
          bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },
          type: { type: String, enum: ["credit", "refund", "payout"] },
          amount: Number,
          note: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ArtistProfile", artistProfileSchema);
