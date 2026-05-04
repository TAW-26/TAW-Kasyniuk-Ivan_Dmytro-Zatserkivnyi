const Listing = require("../models/Listing");

const POPULATE_USER = "username email phone";
const POPULATE_CATEGORY = "name";

exports.getAll = async (req, res) => {
  try {
    const { search, category, status, sort } = req.query;
    const filter = {};

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (category) filter.category_id = category;
    if (status) filter.status = status;

    let query = Listing.find(filter)
      .populate("user_id", POPULATE_USER)
      .populate("category_id", POPULATE_CATEGORY);

    if (sort === "price_asc") query = query.sort({ price: 1 });
    else if (sort === "price_desc") query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const listings = await query;
    res.json(listings);
  } catch (err) {
    console.error("[listings.getAll] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("user_id", POPULATE_USER)
      .populate("category_id", POPULATE_CATEGORY);

    if (!listing) return res.status(404).json({ message: "Ogłoszenie nie znalezione" });

    res.json(listing);
  } catch (err) {
    console.error("[listings.getOne] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, price, location, category_id, images } = req.body;

    if (!title || !description || !category_id) {
      return res.status(400).json({ message: "Tytuł, opis i kategoria są wymagane" });
    }

    const listing = await Listing.create({
      title,
      description,
      price,
      location,
      category_id,
      user_id: req.user.id,
      images: Array.isArray(images) ? images : [],
    });

    const populated = await Listing.findById(listing._id)
      .populate("user_id", POPULATE_USER)
      .populate("category_id", POPULATE_CATEGORY);

    res.status(201).json(populated);
  } catch (err) {
    console.error("[listings.create] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.update = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Ogłoszenie nie znalezione" });

    if (listing.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: "Brak uprawnień" });
    }

    const allowed = ["title", "description", "price", "location", "category_id", "status", "images"];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }

    const updated = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate("user_id", POPULATE_USER)
      .populate("category_id", POPULATE_CATEGORY);
    res.json(updated);
  } catch (err) {
    console.error("[listings.update] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.remove = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Ogłoszenie nie znalezione" });

    if (listing.user_id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Brak uprawnień" });
    }

    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: "Ogłoszenie usunięte", _id: req.params.id });
  } catch (err) {
    console.error("[listings.remove] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const listings = await Listing.find({ user_id: req.user.id })
      .populate("category_id", POPULATE_CATEGORY)
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    console.error("[listings.getByUser] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.purchase = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) return res.status(404).json({ message: "Ogłoszenie nie znalezione" });

    if (listing.user_id.toString() === req.user.id) {
      return res.status(400).json({ message: "Nie możesz kupić własnego ogłoszenia" });
    }

    if (listing.status === "sold") {
      return res.status(400).json({ message: "Ogłoszenie zostało już sprzedane" });
    }

    listing.status = "sold";
    listing.buyer_id = req.user.id;
    await listing.save();

    const populated = await Listing.findById(listing._id)
      .populate("user_id", POPULATE_USER)
      .populate("category_id", POPULATE_CATEGORY);

    res.json(populated);
  } catch (err) {
    console.error("[listings.purchase] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};
