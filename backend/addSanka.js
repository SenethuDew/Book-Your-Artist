const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addSanka = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "sanka@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Sanka Dineth",
        email: email,
        password: bcryptjs.hashSync("Sanka123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Sanka Dineth (email: sanka@music.test)");
    } else {
      console.log(`⚠️ User for Sanka Dineth already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Sanka Dineth",
        bio: "Sanka Dineth is a popular Sri Lankan singer, songwriter, music director, and composer known for his emotional vocals and modern musical style.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Modern"],
        hourlyRate: 15000,
        experience: 8,
        profileImage: "/sanka.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/sankadinethofficial/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 50
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Sanka Dineth");
    } else {
      profile.profileImage = "/sanka.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Sanka Dineth");
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
      console.log("✓ Added availability for Sanka Dineth (status: Available, isPublished: true)");
    } else {
      console.log("✓ Sanka Dineth already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Sanka Dineth to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addSanka();