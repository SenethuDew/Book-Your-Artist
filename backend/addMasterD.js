const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addMasterD = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "masterd@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Master D",
        email: email,
        password: bcryptjs.hashSync("MasterD123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Master D (email: masterd@music.test)");
    } else {
      console.log(`⚠️ User for Master D already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Master D",
        bio: "Master D is a popular Sri Lankan rapper, singer, and music producer known for blending hip-hop, R&B, and Sinhala music styles. He gained recognition in the Sri Lankan music industry through his energetic performances, modern music production, and collaborations with well-known local artists.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "R&B", "Sinhala Rap"],
        hourlyRate: 15000,
        experience: 6,
        profileImage: "/masterd.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/realmasterd/"
        },
        verified: true,
        rating: 4.7,
        reviewCount: 30
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Master D");
    } else {
      profile.profileImage = "/masterd.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Master D");
    }

    // Add availability so he appears in search
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const avail = await Availability.findOne({ artistId: user._id, date: tomorrow });
    if (!avail) {
      const newAvail = new Availability({
        artistId: user._id,
        date: tomorrow,
        startTime: "14:00",
        endTime: "20:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Master D (status: Available, isPublished: true)");
    } else {
      console.log("✓ Master D already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Master D to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addMasterD();