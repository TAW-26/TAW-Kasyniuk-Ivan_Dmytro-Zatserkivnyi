const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Wszystkie pola są wymagane" });
    }

    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ message: "Użytkownik już istnieje" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("[register] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email i hasło są wymagane" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Nieprawidłowe hasło" });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...userWithoutPassword } = user.toObject();
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error("[login] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony" });
    res.json(user);
  } catch (err) {
    console.error("[me] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const allowed = ["username", "phone"];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body && typeof req.body[key] === "string") {
        updates[key] = req.body[key].trim();
      }
    }

    if (updates.username !== undefined && updates.username.length < 2) {
      return res.status(400).json({ message: "Imię i nazwisko musi mieć min. 2 znaki" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "Użytkownik nie znaleziony" });

    res.json(user);
  } catch (err) {
    console.error("[updateMe] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};