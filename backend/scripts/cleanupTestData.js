require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Message = require('../models/Message');

const TEST_USER_FILTER = {
  $or: [{ email: /^(?:test|e2e|directprod)/i }, { username: /^(?:testuser|e2e)/i }],
};

const SEED_LISTING_TITLES = ['Laptop Dell XPS 15', 'Mieszkanie 2-pokojowe', 'Rower górski Trek'];

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);

  const testUsers = await User.find(TEST_USER_FILTER).select('_id');
  const testUserIds = testUsers.map((user) => user._id);
  const seedListings = await Listing.find({ title: { $in: SEED_LISTING_TITLES } }).select('_id');
  const seedListingIds = seedListings.map((listing) => listing._id);

  const messages = await Message.deleteMany({
    $or: [{ from: { $in: testUserIds } }, { to: { $in: testUserIds } }, { listing_id: { $in: seedListingIds } }],
  });
  const listings = await Listing.deleteMany({
    $or: [{ user_id: { $in: testUserIds } }, { _id: { $in: seedListingIds } }],
  });
  await User.updateMany({}, { $pull: { favorites: { $in: seedListingIds } } });
  const users = await User.deleteMany({ _id: { $in: testUserIds } });

  console.log(
    JSON.stringify({
      removedTestUsers: users.deletedCount,
      removedTestOrSeedListings: listings.deletedCount,
      removedRelatedMessages: messages.deletedCount,
    }),
  );
}

cleanup()
  .catch((error) => {
    console.error(`Cleanup failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
