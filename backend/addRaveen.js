const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");
const Availability = require("./src/models/Availability");

const addRaveen = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "raveen@music.test";
    
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Raveen Tharuka",
        email: email,
        password: bcryptjs.hashSync("Raveen123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Raveen Tharuka (email: raveen@music.test)");
    } else {
      console.log(`⚠️ User for Raveen Tharuka already exists (${email})`);
    }

    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Raveen Tharuka",
        bio: "Raveen Tharuka is a talented Sri Lankan singer, performer, and music composer known for his soulful voice and emotional Sinhala songs. He gained popularity through his musical performances and later became widely recognized with hit songs such as Himi Nathi Adareka, Mata Aye Ona, and Wassak Wela. His unique style combines modern pop melodies with heartfelt lyrics, making him one of the rising young artists in the Sri Lankan music industry.",
        category: "Musician",
        artistType: "Singer",
        location: "Colombo, Sri Lanka",
        genres: ["Pop", "Sinhala Pop", "Romantic"],
        hourlyRate: 15000,
        experience: 5,
        profileImage: "/raveen.png", 
        socialLinks: {
          instagram: "https://www.instagram.com/raveen_tharuka/"
        },
        verified: true,
        rating: 4.8,
        reviewCount: 38
      });
      await profile.save();
      console.log("✓ Created Artist Profile for Raveen Tharuka");
    } else {
      profile.profileImage = "/raveen.png";
      await profile.save();
      console.log("✓ Updated Artist Profile for Raveen Tharuka");
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
      console.log("✓ Added availability for Raveen Tharuka (status: Available, isPublished: true)");
    } else {
      console.log("✓ Raveen Tharuka already has availability for tomorrow.");
    }
    
    console.log("\n✅ Successfully added Raveen Tharuka to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addRaveen();