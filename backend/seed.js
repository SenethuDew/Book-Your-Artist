const mongoose = require("mongoose");
require("dotenv").config();
const bcryptjs = require("bcryptjs");
const User = require("./src/models/User");

const seedTestUsers = async () => {
  try {
    // Connect to MongoDB
    require("dotenv").config({ override: true });
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB connected");

    // Test users data
    const testUsers = [
      {
        name: "Test Client",
        email: "client@test.com",
        password: "Client123!@",
        role: "client",
        status: "active",
      },
      {
        name: "Test Artist",
        email: "artist@test.com",
        password: "Artist123!@",
        role: "artist",
        status: "active", // Auto-approve artist
      },
      {
        name: "Test Admin",
        email: "admin@test.com",
        password: "Admin123!@",
        role: "admin",
        status: "active",
      },
    ];

    // Check and create users
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`⚠️  User ${userData.email} already exists (skipped)`);
        continue;
      }

      // Hash password
      const salt = bcryptjs.genSaltSync(10);
      const hashedPassword = bcryptjs.hashSync(userData.password, salt);

      // Create user
      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        status: userData.status,
      });

      await user.save();
      console.log(`✓ Created ${userData.role}: ${userData.email}`);
    }

    console.log("\n✅ Seeding complete!");
    console.log("\n📋 Test Credentials:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("CLIENT  | Email: client@test.com   | Password: Client123!@");
    console.log("ARTIST  | Email: artist@test.com   | Password: Artist123!@");
    console.log("ADMIN   | Email: admin@test.com    | Password: Admin123!@");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🌐 Login at: http://localhost:3000/auth/login");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
};

seedTestUsers();
