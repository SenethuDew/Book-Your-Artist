const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addCosta = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "costa@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Costa",
        email: email,
        password: bcryptjs.hashSync("Costa123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Costa (email: costa@music.test)");
    } else {
      console.log(`⚠️ User for Costa already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Costa",
        bio: "Costa is a popular Sri Lankan rapper, songwriter, and performer known for his energetic music style and modern Sinhala rap culture. He became well known among young audiences through hit songs that combine rap, hip-hop, and melodic influences.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap", "Melodic Rap"],
        hourlyRate: 16000,
        experience: 5,
        profileImage: "/costa.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/costamaarley/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 25
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Costa");
    } else {
      profile.profileImage = "/costa.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Costa");
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
        startTime: "13:00",
        endTime: "22:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Costa (status: Available, isPublished: true)");
    } else {
      console.log("✓ Costa already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Costa to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addCosta();