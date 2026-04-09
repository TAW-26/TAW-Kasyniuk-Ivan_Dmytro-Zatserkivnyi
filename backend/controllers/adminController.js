const User = require("../models/User");
const Listing = require("../models/Listing");

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Rola musi być 'user' lub 'admin'" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    await Listing.deleteMany({ user_id: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "Użytkownik i jego ogłoszenia usunięte" });
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};
