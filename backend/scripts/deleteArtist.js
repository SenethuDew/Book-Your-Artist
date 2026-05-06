/**
 * Deletes a single artist (User + ArtistProfile + their Availability slots
 * and any unpaid Bookings). Usage:
 *
 *   node scripts/deleteArtist.js "Master D"
 *
 * Match is case-insensitive, exact name. If multiple artists share the name,
 * the script lists them and exits without deleting — pass an _id instead:
 *
 *   node scripts/deleteArtist.js 65f1a2b3c4d5e6f708091011
 */

require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../src/models/User");
const ArtistProfile = require("../src/models/ArtistProfile");
const Availability = require("../src/models/Availability");
const Booking = require("../src/models/Booking");

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: node scripts/deleteArtist.js <name | userId>");
    process.exit(1);
  }

  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/book_your_artist";
  await mongoose.connect(uri);
  console.log("Connected:", uri);

  const isObjectId = /^[a-f0-9]{24}$/i.test(arg);
  let users = [];
  if (isObjectId) {
    const u = await User.findById(arg);
    if (u) users = [u];
  } else {
    users = await User.find({
      role: "artist",
      name: { $regex: `^${arg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
  }

  if (!users.length) {
    console.error(`No artist found matching "${arg}".`);
    await mongoose.disconnect();
    process.exit(2);
  }

  if (users.length > 1) {
    console.log(`Multiple artists named "${arg}". Re-run with one of these _id values:`);
    for (const u of users) {
      console.log(`  ${u._id}  ${u.name}  ${u.email}  created=${u.createdAt}`);
    }
    await mongoose.disconnect();
    process.exit(3);
  }

  const target = users[0];
  if (target.role !== "artist") {
    console.error(`User ${target._id} (${target.name}) is not an artist (role=${target.role}). Aborting.`);
    await mongoose.disconnect();
    process.exit(4);
  }

  console.log(`\nAbout to delete artist:\n  _id: ${target._id}\n  name: ${target.name}\n  email: ${target.email}\n  created: ${target.createdAt}\n`);

  const profile = await ArtistProfile.deleteOne({ userId: target._id });
  const avail = await Availability.deleteMany({ artistId: target._id });
  const bookings = await Booking.deleteMany({
    artistId: target._id,
    paymentStatus: { $ne: "paid" },
  });
  const paidLeft = await Booking.countDocuments({
    artistId: target._id,
    paymentStatus: "paid",
  });
  await User.deleteOne({ _id: target._id });

  console.log("Done:");
  console.log(`  ArtistProfile deleted: ${profile.deletedCount}`);
  console.log(`  Availability slots deleted: ${avail.deletedCount}`);
  console.log(`  Unpaid bookings deleted: ${bookings.deletedCount}`);
  console.log(`  Paid bookings preserved (refund/handle manually): ${paidLeft}`);
  console.log("  User deleted: 1");

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(99);
});
