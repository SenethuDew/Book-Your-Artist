const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addYuki = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "yuki@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Yuki Navaratne",
        email: email,
        password: bcryptjs.hashSync("Yuki123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Yuki Navaratne (email: yuki@music.test)");
    } else {
      console.log(`⚠️ User for Yuki Navaratne already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Yuki Navaratne",
        bio: "Yuki Navaratne is a talented Sri Lankan singer, songwriter, and music producer known for blending Hip-Hop, R&B, Trap, and modern electronic music with Sri Lankan musical influences. Born in Kandy, Sri Lanka, he began his artistic journey through traditional Kandyan dance before moving into music production and singing.",
        category: "Musician",
        artistType: "Singer/Producer",
        location: "Kandy, Sri Lanka",
        genres: ["Hip-Hop", "R&B", "Trap", "Electronic"],
        hourlyRate: 15000,
        experience: 5,
        profileImage: "/yuki.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/yuki_beatz/"
        },
        verified: true,
        rating: 4.9,
        reviewCount: 45
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Yuki Navaratne");
    } else {
      profile.profileImage = "/yuki.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Yuki Navaratne");
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
      console.log("✓ Added availability for Yuki Navaratne (status: Available, isPublished: true)");
    } else {
      console.log("✓ Yuki Navaratne already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Yuki Navaratne to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addYuki();