const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addDilu = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "dilu@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "DILU Beats",
        email: email,
        password: bcryptjs.hashSync("Dilu123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for DILU Beats (email: dilu@music.test)");
    } else {
      console.log(`⚠️ User for DILU Beats already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "DILU Beats",
        bio: "DILU Beats, whose real name is Dileepa Madushan, is a popular young Sri Lankan music producer, composer, arranger, and singer from Matara, Sri Lanka.",
        category: "Musician",
        artistType: "Producer/Singer",
        location: "Matara, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Electronic"],
        hourlyRate: 15000,
        experience: 5,
        profileImage: "/dilu.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/dilu.beats/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 25
      });
      await profile.save();
      console.log("✓ Created Artist Profile for DILU Beats");
    } else {
      profile.profileImage = "/dilu.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for DILU Beats");
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
      console.log("✓ Added availability for DILU Beats (status: Available, isPublished: true)");
    } else {
      console.log("✓ DILU Beats already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added DILU Beats to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addDilu();