const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addKMac = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "kmac@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "K-Mac",
        email: email,
        password: bcryptjs.hashSync("KMac123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for K-Mac (email: kmac@music.test)");
    } else {
      console.log(`⚠️ User for K-Mac already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "K-Mac",
        bio: "K-Mac is a talented Sri Lankan rapper and hip-hop artist known for his energetic flow, unique lyrical style, and contribution to the growing Sri Lankan rap music scene.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap"],
        hourlyRate: 12000,
        experience: 4,
        profileImage: "/kmac.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/kmac_mahesh/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 10
      });
      await profile.save();
      console.log("✓ Created Artist Profile for K-Mac");
    } else {
      profile.profileImage = "/kmac.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for K-Mac");
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
        startTime: "09:00",
        endTime: "20:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for K-Mac (status: Available, isPublished: true)");
    } else {
      console.log("✓ K-Mac already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added K-Mac to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addKMac();