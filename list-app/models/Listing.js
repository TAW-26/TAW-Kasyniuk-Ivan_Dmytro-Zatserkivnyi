const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, default: 0 },
  location: { type: String, default: "" },
  category_id: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["active", "inactive", "sold"], default: "active" },
}, { timestamps: true });

module.exports = mongoose.model("Listing", listingSchema);
