const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addReezy = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "reezy@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Ramesses Reezy",
        email: email,
        password: bcryptjs.hashSync("Reezy123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Ramesses Reezy (email: reezy@music.test)");
    } else {
      console.log(`⚠️ User for Ramesses Reezy already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Ramesses Reezy",
        bio: "Ramesses Reezy, born Minru Silva, is a rising Sri Lankan rapper, songwriter, and record producer known for his unique blend of Sinhala hip-hop, emotional lyricism, and modern trap-inspired sounds.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap", "Trap"],
        hourlyRate: 15500,
        experience: 4,
        profileImage: "/rzzy.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/ramessesreezy/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 20
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Ramesses Reezy");
    } else {
      profile.profileImage = "/rzzy.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Ramesses Reezy");
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
        endTime: "20:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Ramesses Reezy (status: Available, isPublished: true)");
    } else {
      console.log("✓ Ramesses Reezy already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Ramesses Reezy to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addReezy();