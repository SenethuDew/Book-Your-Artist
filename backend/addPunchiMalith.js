const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addPunchiMalith = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "punchimalith@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Punchi Malith",
        email: email,
        password: bcryptjs.hashSync("PunchiMalith123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Punchi Malith (email: punchimalith@music.test)");
    } else {
      console.log(`⚠️ User for Punchi Malith already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Punchi Malith",
        bio: "Punchi Malith, also known as Malith “Maliya” Gunaratne, is a talented Sri Lankan rapper and songwriter known for his unique style and energetic hip-hop music.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka",
        genres: ["Rap", "Hip-Hop", "Sinhala Rap"],
        hourlyRate: 12500,
        experience: 4,
        profileImage: "/pmalith.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/01_punchi_malith/?hl=en"
        },
        verified: true,
        rating: 4.7,
        reviewCount: 15
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Punchi Malith");
    } else {
      profile.profileImage = "/pmalith.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Punchi Malith");
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
      console.log("✓ Added availability for Punchi Malith (status: Available, isPublished: true)");
    } else {
      console.log("✓ Punchi Malith already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Punchi Malith to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addPunchiMalith();