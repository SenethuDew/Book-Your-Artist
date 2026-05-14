const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addIraj = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "iraj@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Iraj Weeraratne",
        email: email,
        password: bcryptjs.hashSync("Iraj123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Iraj Weeraratne (email: iraj@music.test)");
    } else {
      console.log(`⚠️ User for Iraj Weeraratne already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Iraj Weeraratne",
        bio: "Iraj Weeraratne is a well-known Sri Lankan hip-hop and R&B artist, music producer, and songwriter who helped popularize Sinhala rap and urban music in Sri Lanka. Born in Colombo, he gained recognition for blending Sinhala, Tamil, and international music styles to create a modern sound that appealed to young audiences.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Hip-Hop", "R&B", "Sinhala Rap", "Pop"],
        hourlyRate: 20000,
        experience: 15,
        profileImage: "/iraj.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/irajfans/"
        },
        verified: true,
        rating: 4.9,
        reviewCount: 50
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Iraj Weeraratne");
    } else {
      profile.profileImage = "/iraj.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Iraj Weeraratne");
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
        startTime: "10:00",
        endTime: "22:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Iraj Weeraratne (status: Available, isPublished: true)");
    } else {
      console.log("✓ Iraj Weeraratne already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Iraj Weeraratne to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addIraj();