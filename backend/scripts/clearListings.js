require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const Message = require('../models/Message');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const listings = await Listing.deleteMany({});
    const messages = await Message.deleteMany({});
    console.log(`Usunięto ogłoszenia: ${listings.deletedCount}`);
    console.log(`Usunięto wiadomości: ${messages.deletedCount}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    process.exit(1);
  }
})();
