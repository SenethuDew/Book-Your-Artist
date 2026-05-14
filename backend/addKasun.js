const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addKasun = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "kasun@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Kasun Kalhara",
        email: email,
        password: bcryptjs.hashSync("Kasun123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Kasun Kalhara (email: kasun@music.test)");
    } else {
      console.log(`⚠️ User for Kasun Kalhara already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Kasun Kalhara",
        bio: "Kasun Kalhara is one of the most popular and respected singers in Sri Lanka. Born on 3 November 1981 in Rajagiriya, he is known for his emotional voice, creative music style, and unforgettable Sinhala songs. Kasun is the son of famous musician H. M. Jayawardena and veteran singer Malani Bulathsinhala, which inspired his musical journey from a young age.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Classical", "Sinhala Pop", "Alternative"],
        hourlyRate: 25000, // Premium rate corresponding to his profile
        experience: 20,
        profileImage: "/kasun.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/kasun.musik/"
        },
        verified: true,
        rating: 5.0,
        reviewCount: 65
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Kasun Kalhara");
    } else {
      profile.profileImage = "/kasun.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Kasun Kalhara");
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
        startTime: "18:00",
        endTime: "23:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Kasun Kalhara (status: Available, isPublished: true)");
    } else {
      console.log("✓ Kasun Kalhara already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Kasun Kalhara to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addKasun();