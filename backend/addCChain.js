const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addCChain = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "cchain@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "C Chain",
        email: email,
        password: bcryptjs.hashSync("CChain123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for C Chain (email: cchain@music.test)");
    } else {
      console.log(`⚠️ User for C Chain already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "C Chain",
        bio: "C Chain is a talented Sri Lankan rapper and hip-hop artist known for his energetic flow, modern trap-inspired sound, and creative lyrical style. He has gained attention in the Sri Lankan music scene through his unique rap performances, collaborations, and growing fan base among young music listeners.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap"],
        hourlyRate: 11000,
        experience: 3,
        profileImage: "/cchain.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/realcchain/"
        },
        verified: true,
        rating: 4.6,
        reviewCount: 12
      });
      await profile.save();
      console.log("✓ Created Artist Profile for C Chain");
    } else {
      profile.profileImage = "/cchain.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for C Chain");
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
        startTime: "11:00",
        endTime: "21:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for C Chain (status: Available, isPublished: true)");
    } else {
      console.log("✓ C Chain already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added C Chain to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addCChain();