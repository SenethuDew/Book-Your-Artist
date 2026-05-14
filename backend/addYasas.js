const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addYasas = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "yasas@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Yasas Medagedara",
        email: email,
        password: bcryptjs.hashSync("Yasas123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Yasas Medagedara (email: yasas@music.test)");
    } else {
      console.log(`⚠️ User for Yasas Medagedara already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Yasas Medagedara",
        bio: "Yasas Medagedara is a talented Sri Lankan singer known for his energetic stage performances and modern musical style. He has gained popularity among young audiences through live concerts, social media performances, and creative music covers.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Modern"],
        hourlyRate: 15000,
        experience: 4,
        profileImage: "/yasas.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/yasasmedagedara/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 35
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Yasas Medagedara");
    } else {
      profile.profileImage = "/yasas.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Yasas Medagedara");
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
      console.log("✓ Added availability for Yasas Medagedara (status: Available, isPublished: true)");
    } else {
      console.log("✓ Yasas Medagedara already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Yasas Medagedara to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addYasas();