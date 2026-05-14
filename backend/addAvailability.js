const mongoose = require("mongoose");
require("dotenv").config({ override: true });
const User = require("./src/models/User");
const Availability = require("./src/models/Availability");

const addAvailability = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");
    
    // Get Smokio
    const user = await User.findOne({ email: "smokio@music.test" });
    if (!user) {
      throw new Error("Smokio user not found. Did you run the addSmokio.js seeder?");
    }

    // Give him availability for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const check = await Availability.findOne({ artistId: user._id, date: tomorrow });
    
    if (!check) {
      const avail = new Availability({
        artistId: user._id,
        date: tomorrow,
        startTime: "10:00",
        endTime: "22:00",
        isPublished: true,
        status: "Available"
      });
      await avail.save();
      console.log("✓ Generated future availability for Smokio (status: Available, isPublished: true)");
    } else {
      console.log("✓ Smokio already has availability for tomorrow.");
    }
    
    console.log("\n✅ Done. Smokio will now appear in the search results!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

addAvailability();