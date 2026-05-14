const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addGayan = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "gayan@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Gayan Perera",
        email: email,
        password: bcryptjs.hashSync("Gayan123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Gayan Perera (email: gayan@music.test)");
    } else {
      console.log(`⚠️ User for Gayan Perera already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Gayan Perera",
        bio: "Gayan Perera is a talented Sri Lankan singer known for his emotional voice, stage performances, and contribution to the local music industry. He has gained popularity through live musical shows, cover performances, and social media platforms, attracting many fans across Sri Lanka.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Modern"],
        hourlyRate: 15000,
        experience: 5,
        profileImage: "/gayan.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/gayyamusic/?hl=en"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 30
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Gayan Perera");
    } else {
      profile.profileImage = "/gayan.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Gayan Perera");
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
      console.log("✓ Added availability for Gayan Perera (status: Available, isPublished: true)");
    } else {
      console.log("✓ Gayan Perera already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Gayan Perera to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addGayan();