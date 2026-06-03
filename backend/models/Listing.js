const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, default: 0 },
    location: { type: String, default: '' },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['active', 'inactive', 'sold'], default: 'active' },
    images: { type: [String], default: [] },
  },
  { timestamps: true },
);

listingSchema.index({ status: 1, createdAt: -1 });
listingSchema.index({ category_id: 1, status: 1, createdAt: -1 });
listingSchema.index({ user_id: 1, createdAt: -1 });
listingSchema.index({ price: 1 });
listingSchema.index({ location: 1 });
listingSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Listing', listingSchema);
