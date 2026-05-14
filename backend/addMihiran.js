const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addMihiran = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "mihiran@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Mihiran",
        email: email,
        password: bcryptjs.hashSync("Mihiran123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Mihiran (email: mihiran@music.test)");
    } else {
      console.log(`⚠️ User for Mihiran already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Mihiran",
        bio: "Mihiran is a rising Sri Lankan music artist known for his emotional Sinhala songs and modern music style. He became popular among young audiences through hit songs like “Mulawe,” “Ma Deparak,” and “Dewaduthiyak.”",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Modern"],
        hourlyRate: 15000,
        experience: 4,
        profileImage: "/mihiran.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/mihiraaan/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 22
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Mihiran");
    } else {
      profile.profileImage = "/mihiran.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Mihiran");
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
        startTime: "16:00",
        endTime: "22:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Mihiran (status: Available, isPublished: true)");
    } else {
      console.log("✓ Mihiran already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Mihiran to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addMihiran();