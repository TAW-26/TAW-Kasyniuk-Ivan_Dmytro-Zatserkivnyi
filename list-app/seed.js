const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const Category = require("./models/Category");
const Listing = require("./models/Listing");

const CATEGORIES = [
  "Elektronika",
  "Motoryzacja",
  "Nieruchomości",
  "Praca",
  "Usługi",
  "Moda",
  "Dom i Ogród",
  "Sport",
  "Muzyka",
  "Inne",
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    const adminEmail = "admin@listapp.pl";
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      admin = await User.create({
        username: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });
      console.log("Admin created:", admin.email);
    } else {
      console.log("Admin already exists:", admin.email);
    }

    let createdCount = 0;
    const categoryDocs = [];

    for (const name of CATEGORIES) {
      let category = await Category.findOne({ name });
      if (!category) {
        category = await Category.create({ name });
        createdCount++;
      }
      categoryDocs.push(category);
    }
    console.log(`Categories: ${createdCount} created, ${CATEGORIES.length - createdCount} already existed`);
    const listingCount = await Listing.countDocuments();

    if (listingCount === 0) {
      const sampleListings = [
        {
          title: "Laptop Dell XPS 15",
          description: "Laptop w bardzo dobrym stanie, 16GB RAM, 512GB SSD",
          price: 3500,
          location: "Warszawa",
          category_id: categoryDocs[0]._id, 
          user_id: admin._id,
        },
        {
          title: "Mieszkanie 2-pokojowe",
          description: "Jasne mieszkanie w centrum, 48m2, balkon",
          price: 350000,
          location: "Kraków",
          category_id: categoryDocs[2]._id, 
          user_id: admin._id,
        },
        {
          title: "Rower górski Trek",
          description: "Rower górski, rama aluminiowa, koła 29 cali",
          price: 1200,
          location: "Gdańsk",
          category_id: categoryDocs[7]._id, 
          user_id: admin._id,
        },
      ];

      await Listing.insertMany(sampleListings);
      console.log(`Sample listings created: ${sampleListings.length}`);
    } else {
      console.log(`Listings already exist (${listingCount}), skipping samples`);
    }

    console.log("Seed completed");
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err.message);
    process.exit(1);
  }
}

seed();
