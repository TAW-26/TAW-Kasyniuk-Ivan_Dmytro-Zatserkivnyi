const User = require('../models/User');

async function isAdmin(userId) {
  if (!userId) return false;
  const user = await User.findById(userId).select('role');
  return user?.role === 'admin';
}

async function canModifyListing(listing, userId) {
  if (!listing) return false;
  if (!userId) return false;
  if (listing.user_id.toString() === userId.toString()) {
    return { allowed: true, reason: 'owner' };
  }
  if (await isAdmin(userId)) {
    return { allowed: true, reason: 'admin' };
  }
  return { allowed: false };
}

module.exports = { isAdmin, canModifyListing };
