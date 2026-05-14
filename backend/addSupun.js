const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addSupun = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "supun@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Supun Perera",
        email: email,
        password: bcryptjs.hashSync("Supun123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Supun Perera (email: supun@music.test)");
    } else {
      console.log(`⚠️ User for Supun Perera already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Supun Perera",
        bio: "Supun Perera is a popular Sri Lankan singer, songwriter, and performer known for his modern Sinhala music and energetic stage performances. He gained major recognition through hit songs and collaborations that became highly popular among young audiences in Sri Lanka.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Modern"],
        hourlyRate: 15000,
        experience: 6,
        profileImage: "/supun.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/supun_perera/?hl=en"
        },
        verified: true,
        rating: 4.9,
        reviewCount: 42
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Supun Perera");
    } else {
      profile.profileImage = "/supun.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Supun Perera");
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
      console.log("✓ Added availability for Supun Perera (status: Available, isPublished: true)");
    } else {
      console.log("✓ Supun Perera already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Supun Perera to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addSupun();