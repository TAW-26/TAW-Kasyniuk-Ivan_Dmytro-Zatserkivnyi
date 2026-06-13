const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Nie blokuje żądania. Jeśli jest prawidłowy token Bearer, ustawia req.user;
// w przeciwnym razie po prostu przepuszcza dalej (req.user pozostaje undefined).
module.exports = (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (mongoose.Types.ObjectId.isValid(decoded.id)) {
      req.user = decoded;
    }
  } catch {
    // Nieprawidłowy/wygasły token przy publicznym endpoincie ignorujemy.
  }
  next();
};
