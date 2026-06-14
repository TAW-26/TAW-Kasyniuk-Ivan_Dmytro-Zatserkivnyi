const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

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
    // ignorujemy nieprawidłowy token
  }
  next();
};
