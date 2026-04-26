const mongoose = require("mongoose");
const axios = require("axios");
const Listing = require("./models/listing"); // adjust path if needed

const MONGO_URL = "mongodb://127.0.0.1:27017/StaySphere";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("DB connected");

  const listings = await Listing.find({
    $or: [
      { geometry: { $exists: false } },
      { "geometry.coordinates": { $exists: false } },
      { "geometry.coordinates.0": { $exists: false } }
    ]
  });

  console.log(`Found ${listings.length} listings to update`);

  for (let i = 0; i < listings.length; i++) {
    const listing = listings[i];

    try {
      const searchText = `${listing.location}, ${listing.country}`;

      const res = await axios.get(
        "https://nominatim.openstreetmap.org/search",
        {
          params: {
            q: searchText,
            format: "json",
            limit: 1
          },
          headers: {
            
            "User-Agent": "staysphere-app (your@email.com)"
          }
        }
      );

      if (res.data.length === 0) {
        console.log(`❌ No result: ${listing.title}`);
        continue;
      }

      const lat = parseFloat(res.data[0].lat);
      const lng = parseFloat(res.data[0].lon);

      listing.geometry = {
        type: "Point",
        coordinates: [lng, lat]
      };

      await listing.save();

      console.log(`✅ Updated: ${listing.title} → [${lng}, ${lat}]`);

      // ⏱️ avoid rate limit (very important)
      await new Promise(r => setTimeout(r, 1000));

    } catch (err) {
      console.log(`⚠️ Error for ${listing.title}`);
    }
  }

  console.log("🎉 All done!");
  mongoose.connection.close();
}

main();