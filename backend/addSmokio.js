const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");

const addSmokio = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    const email = "smokio@music.test";
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (!user) {
      const salt = bcryptjs.genSaltSync(10);
      user = new User({
        name: "Smokio",
        email: email,
        password: bcryptjs.hashSync("Smokio123!@", salt),
        role: "artist",
        status: "active",
      });
      await user.save();
      console.log("✓ Created User record for Smokio (email: smokio@music.test)");
    } else {
      console.log(`⚠️ User for Smokio already exists (${email})`);
    }

    // Upsert ArtistProfile
    let profile = await ArtistProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new ArtistProfile({
        userId: user._id,
        name: "Smokio",
        bio: "Smokio is a Sri Lankan rapper and hip-hop artist known for his energetic rap style, modern urban music, and strong influence on the local rap scene. He gained popularity through Sinhala rap songs that combine street culture, personal experiences, and modern trap and hip-hop beats. Smokio is recognized for attracting young audiences in Sri Lanka with his unique flow, stylish visuals, and collaborations with other local artists.",
        category: "Musician",
        artistType: "Rapper",
        location: "Colombo, Sri Lanka", // Standard fallback
        genres: ["Rap", "Hip-Hop", "Urban", "Sinhala Rap"],
        hourlyRate: 15000,
        experience: 5,
        // Since C:\Users\senet\OneDrive\Desktop\Book-Your-Artist is just the root folder, 
        // we'll set it here but realistically this should be a web-accessible URL later 
        // (like /uploads/smokio.jpg).
        profileImage: "C:\\Users\\senet\\OneDrive\\Desktop\\Book-Your-Artist", 
        socialLinks: {
          instagram: "https://www.instagram.com/king_smoka/"
        },
        verified: true,
        rating: 5,
        reviewCount: 15
      });
      await profile.save();
      console.log("✓ Created detailed Artist Profile for Smokio");
    } else {
      // Update existing profile just in case
      profile.bio = "Smokio is a Sri Lankan rapper and hip-hop artist known for his energetic rap style, modern urban music, and strong influence on the local rap scene. He gained popularity through Sinhala rap songs that combine street culture, personal experiences, and modern trap and hip-hop beats. Smokio is recognized for attracting young audiences in Sri Lanka with his unique flow, stylish visuals, and collaborations with other local artists.";
      profile.socialLinks = { instagram: "https://www.instagram.com/king_smoka/" };
      profile.profileImage = "C:\\Users\\senet\\OneDrive\\Desktop\\Book-Your-Artist";
      await profile.save();
      console.log("✓ Updated detailed Artist Profile for Smokio");
    }
    
    console.log("\n✅ Successfully added Smokio to the database!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addSmokio();