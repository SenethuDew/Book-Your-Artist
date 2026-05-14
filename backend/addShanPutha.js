const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addShanPutha = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "shanputha@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Shan Putha",
        email: email,
        password: bcryptjs.hashSync("ShanPutha123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Shan Putha (email: shanputha@music.test)");
    } else {
      console.log(`⚠️ User for Shan Putha already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Shan Putha",
        bio: "Shan Putha is a popular Sri Lankan rapper, songwriter, and music producer known for his unique Sinhala rap style and emotional storytelling.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap"],
        hourlyRate: 14000,
        experience: 5,
        profileImage: "/shanputha.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/kaushan_gunarathne/"
        },
        verified: true,
        rating: 4.9,
        reviewCount: 22
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Shan Putha");
    } else {
      profile.profileImage = "/shanputha.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Shan Putha");
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
      console.log("✓ Added availability for Shan Putha (status: Available, isPublished: true)");
    } else {
      console.log("✓ Shan Putha already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Shan Putha to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addShanPutha();