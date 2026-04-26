const mongoose = require("mongoose");
const Listing = require("./models/listing");

const MONGO_URL = "mongodb://127.0.0.1:27017/StaySphere";

async function updateCategories() {
  await mongoose.connect(MONGO_URL);
  console.log("DB connected");

  const listings = await Listing.find({});

  for (let listing of listings) {
    // Skip if already has category
    if (listing.category) continue;

    const title = listing.title.toLowerCase();
    const location = listing.location.toLowerCase();

    let category = "Trending"; // default

    if (title.includes("mountain") || location.includes("hill")) {
      category = "Mountains";
    } else if (title.includes("room")) {
      category = "Rooms";
    } else if (title.includes("pool")) {
      category = "Amazing Pools";
    } else if (title.includes("camp")) {
      category = "Camping";
    } else if (title.includes("castle")) {
      category = "Castles";
    } else if (title.includes("arctic") || location.includes("snow")) {
      category = "Arctic";
    } else if (title.includes("boat")) {
      category = "Boats";
    } else if (title.includes("dome")) {
      category = "Domes";
    }

    listing.category = category;
    await listing.save();
    console.log(`Updated: ${listing.title} → ${category}`);
  }

  mongoose.connection.close();
}

updateCategories();