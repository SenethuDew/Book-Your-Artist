const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const User = require("./src/models/User");
const ArtistProfile = require("./src/models/ArtistProfile");

const updateImage = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOne({ email: "smokio@music.test" });
    if (!user) throw new Error("User not found");

    const profile = await ArtistProfile.findOne({ userId: user._id });
    if (profile) {
      // Update the path to point to the Next.js public folder path
      profile.profileImage = "/smokio.png";
      await profile.save();
      console.log("✓ Successfully updated profile image path to /smokio.png");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
};

updateImage();