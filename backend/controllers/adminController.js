const mongoose = require('mongoose');
const User = require('../models/User');
const Listing = require('../models/Listing');
const Message = require('../models/Message');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID użytkownika' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateRole = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID użytkownika' });
    }

    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Rola musi być 'user' lub 'admin'" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID użytkownika' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
    await Listing.deleteMany({ user_id: req.params.id });
    await Message.deleteMany({ $or: [{ from: req.params.id }, { to: req.params.id }] });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Użytkownik i jego ogłoszenia usunięte' });
  } catch (err) {
    next(err);
  }
};
