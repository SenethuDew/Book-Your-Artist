const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addManasick = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "manasick@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Manasick",
        email: email,
        password: bcryptjs.hashSync("Manasick123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Manasick (email: manasick@music.test)");
    } else {
      console.log(`⚠️ User for Manasick already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Manasick",
        bio: "Manasick is a talented Sri Lankan rapper and hip-hop artist known for his energetic flow, creative lyrics, and unique style in the local music scene. He has gained attention through his modern rap tracks, live performances, and collaborations that connect with Sri Lankan youth culture.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap"],
        hourlyRate: 13000,
        experience: 4,
        profileImage: "/manasik.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/manasick/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 18
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Manasick");
    } else {
      profile.profileImage = "/manasik.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Manasick");
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
        startTime: "12:00",
        endTime: "23:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Manasick (status: Available, isPublished: true)");
    } else {
      console.log("✓ Manasick already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Manasick to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addManasick();