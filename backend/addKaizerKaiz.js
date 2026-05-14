const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addKaizerKaiz = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "kaizerkaiz@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Kaizer Kaiz",
        email: email,
        password: bcryptjs.hashSync("Kaizer123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Kaizer Kaiz (email: kaizerkaiz@music.test)");
    } else {
      console.log(`⚠️ User for Kaizer Kaiz already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Kaizer Kaiz",
        bio: "Kaizer Kaiz is a talented Sri Lankan rapper known for his energetic performances, modern hip-hop style, and unique lyrical flow. He has gained attention in the Sri Lankan music scene through creative rap tracks, live performances, and collaborations with local artists.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap"],
        hourlyRate: 14000,
        experience: 5,
        profileImage: "/kaizerkaiz.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/kaizerkaiz/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 21
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Kaizer Kaiz");
    } else {
      profile.profileImage = "/kaizerkaiz.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Kaizer Kaiz");
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
        startTime: "15:00",
        endTime: "23:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Kaizer Kaiz (status: Available, isPublished: true)");
    } else {
      console.log("✓ Kaizer Kaiz already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Kaizer Kaiz to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addKaizerKaiz();