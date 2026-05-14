const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addShihan = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "shihan@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Shihan Mihiranga",
        email: email,
        password: bcryptjs.hashSync("Shihan123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Shihan Mihiranga (email: shihan@music.test)");
    } else {
      console.log(`⚠️ User for Shihan Mihiranga already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Shihan Mihiranga",
        bio: "Shihan Mihiranga is a popular Sri Lankan singer, songwriter, and music composer who became famous after participating in the first season of Sirasa Superstar in 2006. Known for his smooth vocals and romantic songs, he quickly became one of the most loved artists among Sri Lankan youth.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Romantic", "Sinhala Pop"],
        hourlyRate: 18000,
        experience: 18,
        profileImage: "/shihan.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/shihanmihirangaofficial/"
        },
        verified: true,
        rating: 4.9,
        reviewCount: 45
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Shihan Mihiranga");
    } else {
      profile.profileImage = "/shihan.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Shihan Mihiranga");
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
        endTime: "22:00",
        isPublished: true,
        status: "Available"
      });
      await newAvail.save();
      console.log("✓ Added availability for Shihan Mihiranga (status: Available, isPublished: true)");
    } else {
      console.log("✓ Shihan Mihiranga already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Shihan Mihiranga to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addShihan();