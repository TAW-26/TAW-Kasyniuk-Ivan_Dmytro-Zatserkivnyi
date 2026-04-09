const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Dostęp tylko dla administratora" });
    }

    req.user.role = user.role;
    next();
  } catch (err) {
    res.status(500).json({ message: "Błąd serwera" });
  }
};
