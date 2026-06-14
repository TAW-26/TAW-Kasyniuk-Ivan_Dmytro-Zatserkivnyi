const crypto = require('crypto');
const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Message = require('../models/Message');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const events = require('../utils/eventsBuffer');

const IS_DEV = process.env.NODE_ENV !== 'production';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

const REFRESH_COOKIE = {
  httpOnly: true,
  secure: !IS_DEV,
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

function signAccess(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function signRefresh(id) {
  return jwt.sign({ id }, REFRESH_SECRET, { expiresIn: '7d' });
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Wszystkie pola są wymagane' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Użytkownik już istnieje' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = IS_DEV ? undefined : crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      isVerified: IS_DEV,
      verificationToken,
    });

    if (!IS_DEV) {
      const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
      const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
      console.log(`[VERIFY EMAIL] ${email} → ${verifyUrl}`);
    }

    const { password: _p, verificationToken: _v, refreshToken: _r, ...userData } = user.toObject();
    logger.info(
      { event: 'auth.register', userId: user._id.toString(), email: user.email },
      'User registered',
    );
    events.push('auth.register', { userId: user._id.toString(), email: user.email }, `Nowy użytkownik: ${user.email}`);
    res.status(201).json({ ...userData, requiresVerification: !IS_DEV });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email i hasło są wymagane' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      logger.warn({ event: 'auth.login.failed', reason: 'user_not_found', email }, 'Login failed');
      return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      logger.warn(
        { event: 'auth.login.failed', reason: 'wrong_password', userId: user._id.toString() },
        'Login failed',
      );
      return res.status(400).json({ message: 'Nieprawidłowe hasło' });
    }

    if (!IS_DEV && !user.isVerified) {
      logger.warn(
        { event: 'auth.login.failed', reason: 'not_verified', userId: user._id.toString() },
        'Login blocked - email not verified',
      );
      return res.status(403).json({
        message: 'Konto nie zostało zweryfikowane. Sprawdź skrzynkę pocztową.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const accessToken = signAccess(user._id);
    const refreshToken = signRefresh(user._id);

    user.refreshToken = hashToken(refreshToken);
    await user.save();

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE);

    const { password: _p, verificationToken: _v, refreshToken: _r, ...userData } = user.toObject();
    logger.info(
      { event: 'auth.login', userId: user._id.toString(), role: user.role },
      'User logged in',
    );
    events.push(
      'auth.login',
      { userId: user._id.toString(), role: user.role, email: user.email },
      `Logowanie: ${user.email} (${user.role})`,
    );
    res.json({ user: userData, accessToken });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: 'Brak tokenu odświeżającego' });

    let payload;
    try {
      payload = jwt.verify(token, REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: 'Token odświeżający wygasł lub jest nieprawidłowy' });
    }
    if (!mongoose.Types.ObjectId.isValid(payload.id)) {
      return res.status(401).json({ message: 'Token odświeżający wygasł lub jest nieprawidłowy' });
    }

    const user = await User.findOne({ _id: payload.id, refreshToken: hashToken(token) }).select('+refreshToken');
    if (!user) return res.status(401).json({ message: 'Token odświeżający unieważniony' });

    const accessToken = signAccess(user._id);
    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      const updated = await User.findOneAndUpdate(
        { refreshToken: hashToken(token) },
        { $unset: { refreshToken: 1 } },
      );
      if (updated) {
        logger.info({ event: 'auth.logout', userId: updated._id.toString() }, 'User logged out');
      }
    }
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE, maxAge: 0 });
    res.json({ message: 'Wylogowano' });
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token, isVerified: false }).select('+verificationToken');
    if (!user) return res.status(400).json({ message: 'Nieprawidłowy lub wygasły link weryfikacyjny' });
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: 'Email zweryfikowany — możesz się teraz zalogować' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email jest wymagany' });

    const user = await User.findOne({ email });
    const genericResponse = {
      message: 'Jeśli konto istnieje, link do resetu hasła został wysłany.',
    };

    if (!user) return res.json(genericResponse);

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 godzina
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    console.log(`[RESET PASSWORD] ${email} → ${resetUrl}`);

    logger.info({ event: 'auth.password.reset_requested', userId: user._id.toString() }, 'Password reset requested');
    events.push(
      'auth.password.reset_requested',
      { userId: user._id.toString(), email: user.email },
      `Prośba o reset hasła: ${user.email}`,
    );
    res.json(genericResponse);
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token i nowe hasło są wymagane' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Nowe hasło musi mieć min. 6 znaków' });
    }

    const user = await User.findOne({
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    }).select('+resetPasswordToken +resetPasswordExpires');
    if (!user) {
      return res.status(400).json({ message: 'Link do resetu hasła jest nieprawidłowy lub wygasł' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.refreshToken = undefined; // unieważnij wszystkie sesje
    await user.save();

    logger.info({ event: 'auth.password.reset', userId: user._id.toString() }, 'Password reset completed');
    events.push(
      'auth.password.reset',
      { userId: user._id.toString(), email: user.email },
      `Hasło zresetowane: ${user.email}`,
    );
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE, maxAge: 0 });
    res.json({ message: 'Hasło zostało zmienione. Możesz się teraz zalogować.' });
  } catch (err) {
    next(err);
  }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateMe = async (req, res, next) => {
  try {
    const allowed = ['username', 'phone', 'avatar'];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body && typeof req.body[key] === 'string') {
        updates[key] = req.body[key].trim();
      }
    }
    if (updates.username !== undefined && updates.username.length < 2) {
      return res.status(400).json({ message: 'Imię i nazwisko musi mieć min. 2 znaki' });
    }
    if (updates.avatar !== undefined) {
      const isEmpty = updates.avatar === '';
      const isImageDataUrl = /^data:image\/(png|jpe?g|webp);base64,/i.test(updates.avatar);
      if (!isEmpty && (!isImageDataUrl || updates.avatar.length > 5_000_000)) {
        return res.status(400).json({ message: 'Avatar musi być obrazem PNG, JPG lub WebP do 5 MB' });
      }
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Aktualne i nowe hasło są wymagane' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Nowe hasło musi mieć min. 6 znaków' });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ message: 'Nieprawidłowe aktualne hasło' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.refreshToken = undefined;
    await user.save();

    res.clearCookie('refreshToken', { ...REFRESH_COOKIE, maxAge: 0 });
    res.json({ message: 'Hasło zostało zmienione. Zaloguj się ponownie.' });
  } catch (err) {
    next(err);
  }
};

exports.toggleFavorite = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID ogłoszenia' });
    }
    const user = await User.findById(req.user.id).select('favorites');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    const isFavorite = (user.favorites ?? []).some((favoriteId) => favoriteId.toString() === id);
    if (!isFavorite) {
      const listingExists = await Listing.exists({ _id: id });
      if (!listingExists) return res.status(404).json({ message: 'Ogłoszenie nie znalezione' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      isFavorite ? { $pull: { favorites: id } } : { $addToSet: { favorites: id } },
      { new: true },
    ).select('favorites');
    res.json({ favorites: (updated?.favorites ?? []).map(String) });
  } catch (err) {
    next(err);
  }
};

exports.clearFavorites = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { favorites: [] } });
    res.json({ favorites: [] });
  } catch (err) {
    next(err);
  }
};

exports.mergeFavorites = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
      return res.status(400).json({ message: 'Lista ulubionych jest wymagana' });
    }

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    let user;
    if (validIds.length > 0) {
      const existing = await Listing.find({ _id: { $in: validIds } }).select('_id');
      const existingIds = existing.map((listing) => listing._id);
      user = await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { favorites: { $each: existingIds } } },
        { new: true },
      ).select('favorites');
    } else {
      user = await User.findById(req.user.id).select('favorites');
    }

    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json({ favorites: (user.favorites ?? []).map(String) });
  } catch (err) {
    next(err);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await Listing.deleteMany({ user_id: userId });
    await Message.deleteMany({ $or: [{ from: userId }, { to: userId }] });
    const deleted = await User.findByIdAndDelete(userId);
    if (!deleted) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.clearCookie('refreshToken', { ...REFRESH_COOKIE, maxAge: 0 });
    res.json({ message: 'Konto zostało usunięte' });
  } catch (err) {
    next(err);
  }
};
