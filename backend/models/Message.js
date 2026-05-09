const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', default: null },
    content: { type: String, required: true, trim: true },
    read_at: { type: Date, default: null },
  },
  { timestamps: true },
);

messageSchema.index({ from: 1, to: 1, createdAt: -1 });
messageSchema.index({ to: 1, from: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
