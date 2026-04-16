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
    genres: {
      type: [String],
      required: true,
      index: true,
    },
    specialties: [String],
    yearsOfExperience: Number,
    hourlyRate: {
      type: Number,
      required: true,
      index: true,
    },
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

// Recalculate rating when saved
artistProfileSchema.pre("save", async function (next) {
  if (this.isModified("rating")) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model("ArtistProfile", artistProfileSchema);
