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
  },
  { timestamps: true }
);

module.exports = mongoose.model("ArtistProfile", artistProfileSchema);
