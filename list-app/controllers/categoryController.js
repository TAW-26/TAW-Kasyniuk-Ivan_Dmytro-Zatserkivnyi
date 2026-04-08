const Category = require("../models/Category");

// Pobierz wszystkie kategorie
exports.getAll = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

// Utwórz kategorię (tylko admin)
exports.create = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) return res.status(400).json({ message: "Nazwa kategorii jest wymagana" });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: "Kategoria już istnieje" });

    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

// Usuń kategorię (tylko admin)
exports.remove = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Kategoria nie znaleziona" });

    res.json({ message: "Kategoria usunięta" });
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};
