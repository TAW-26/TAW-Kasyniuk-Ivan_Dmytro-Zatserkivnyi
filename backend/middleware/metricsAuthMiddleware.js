const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

module.exports = async function metricsAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ message: 'Brak tokenu autoryzacji' });
  }

  const metricsToken = process.env.METRICS_TOKEN;
  if (metricsToken && timingSafeEqual(token, metricsToken)) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(403).json({ message: 'Nieprawidłowy token' });
    }

    const user = await User.findById(decoded.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Dostęp do /metrics tylko dla administratora' });
    }

    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token wygasł', code: 'TOKEN_EXPIRED' });
    }
    return res.status(403).json({ message: 'Nieprawidłowy token' });
  }
};
