const Category = require("../models/Category");

exports.getAll = async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nazwa kategorii jest wymagana" });
    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: "Kategoria już istnieje" });
    const category = await Category.create({ name });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Nazwa kategorii jest wymagana" });
    const exists = await Category.findOne({ name, _id: { $ne: req.params.id } });
    if (exists) return res.status(400).json({ message: "Kategoria o tej nazwie już istnieje" });
    const category = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!category) return res.status(404).json({ message: "Kategoria nie znaleziona" });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Kategoria nie znaleziona" });
    res.json({ message: "Kategoria usunięta" });
  } catch (err) {
    next(err);
  }
};
