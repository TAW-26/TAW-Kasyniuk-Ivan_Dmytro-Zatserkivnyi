const Listing = require("../models/Listing");

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
      .populate("user_id", "username email phone")
      .populate("category_id", "name");

    if (sort === "price_asc") query = query.sort({ price: 1 });
    else if (sort === "price_desc") query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const listings = await query;
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.getOne = async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("user_id", "username email phone")
      .populate("category_id", "name");

    if (!listing) return res.status(404).json({ message: "Ogłoszenie nie znalezione" });

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, price, location, category_id } = req.body;

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
    });

    res.status(201).json(listing);
  } catch (err) {
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

    const updated = await Listing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
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
    res.json({ message: "Ogłoszenie usunięte" });
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.getByUser = async (req, res) => {
  try {
    const listings = await Listing.find({ user_id: req.user.id })
      .populate("category_id", "name")
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};
