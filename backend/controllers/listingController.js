const mongoose = require('mongoose');
const Listing = require('../models/Listing');

const POPULATE_USER_PUBLIC = 'username phone';
const POPULATE_USER_OWNER = 'username email phone';
const POPULATE_CATEGORY = 'name';

const MAX_IMAGES = 5;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const VALID_STATUSES = new Set(['active', 'inactive', 'sold']);

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function parseOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return { value: undefined };
  }

  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return { error: `${fieldName} musi być liczbą` };
  }

  return { value: numberValue };
}

function validateImages(images) {
  if (!Array.isArray(images)) return null;
  if (images.length > MAX_IMAGES) return `Maksymalnie ${MAX_IMAGES} zdjęć`;
  for (const img of images) {
    if (typeof img !== 'string') return 'Nieprawidłowy format zdjęcia';
    if (img.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 + 100) {
      return 'Każde zdjęcie może mieć maksymalnie 2 MB';
    }
  }
  return null;
}

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getAll = async (req, res, next) => {
  try {
    const { search, category, status, sort, page, limit, minPrice, maxPrice, location, ids } = req.query;
    const filter = {};

    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [{ title: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }];
    }

    if (category) {
      if (!isValidObjectId(category)) {
        return res.status(400).json({ message: 'Nieprawidłowy ID kategorii' });
      }
      filter.category_id = category;
    }

    if (status) {
      if (!VALID_STATUSES.has(status)) {
        return res.status(400).json({ message: 'Nieprawidłowy status ogłoszenia' });
      }
      filter.status = status;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const parsedMinPrice = parseOptionalNumber(minPrice, 'Cena minimalna');
      const parsedMaxPrice = parseOptionalNumber(maxPrice, 'Cena maksymalna');
      if (parsedMinPrice.error) return res.status(400).json({ message: parsedMinPrice.error });
      if (parsedMaxPrice.error) return res.status(400).json({ message: parsedMaxPrice.error });

      filter.price = {};
      if (parsedMinPrice.value !== undefined) filter.price.$gte = parsedMinPrice.value;
      if (parsedMaxPrice.value !== undefined) filter.price.$lte = parsedMaxPrice.value;
    }
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' };
    if (ids) {
      const idList = String(ids).split(',').filter(Boolean);
      if (idList.some((id) => !isValidObjectId(id))) {
        return res.status(400).json({ message: 'Lista ID ogłoszeń zawiera nieprawidłowe wartości' });
      }
      if (idList.length > 0) filter._id = { $in: idList };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    let query = Listing.find(filter)
      .populate('user_id', POPULATE_USER_PUBLIC)
      .populate('category_id', POPULATE_CATEGORY)
      .skip(skip)
      .limit(limitNum);

    if (sort === 'price_asc') query = query.sort({ price: 1 });
    else if (sort === 'price_desc') query = query.sort({ price: -1 });
    else query = query.sort({ createdAt: -1 });

    const [listings, total] = await Promise.all([query, Listing.countDocuments(filter)]);

    res.json({
      listings,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID ogłoszenia' });
    }

    const listing = await Listing.findById(req.params.id)
      .populate('user_id', POPULATE_USER_PUBLIC)
      .populate('category_id', POPULATE_CATEGORY);
    if (!listing) return res.status(404).json({ message: 'Ogłoszenie nie znalezione' });
    res.json(listing);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { title, description, price, location, category_id, images } = req.body;
    if (!title || !description || !category_id) {
      return res.status(400).json({ message: 'Tytuł, opis i kategoria są wymagane' });
    }
    if (!isValidObjectId(category_id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID kategorii' });
    }

    const parsedPrice = parseOptionalNumber(price, 'Cena');
    if (parsedPrice.error) return res.status(400).json({ message: parsedPrice.error });

    const imgList = Array.isArray(images) ? images : [];
    const imgError = validateImages(imgList);
    if (imgError) return res.status(400).json({ message: imgError });

    const listing = await Listing.create({
      title,
      description,
      price: parsedPrice.value ?? 0,
      location,
      category_id,
      user_id: req.user.id,
      images: imgList,
    });
    const populated = await Listing.findById(listing._id)
      .populate('user_id', POPULATE_USER_OWNER)
      .populate('category_id', POPULATE_CATEGORY);
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID ogłoszenia' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Ogłoszenie nie znalezione' });
    if (listing.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    const allowed = ['title', 'description', 'price', 'location', 'category_id', 'status', 'images'];
    const updates = {};
    for (const key of allowed) {
      if (key in req.body) updates[key] = req.body[key];
    }
    if (updates.category_id !== undefined && !isValidObjectId(updates.category_id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID kategorii' });
    }
    if (updates.status !== undefined && !VALID_STATUSES.has(updates.status)) {
      return res.status(400).json({ message: 'Nieprawidłowy status ogłoszenia' });
    }
    if (updates.price !== undefined) {
      const parsedPrice = parseOptionalNumber(updates.price, 'Cena');
      if (parsedPrice.error) return res.status(400).json({ message: parsedPrice.error });
      updates.price = parsedPrice.value ?? 0;
    }
    if (Object.prototype.hasOwnProperty.call(updates, 'images')) {
      const imgError = validateImages(updates.images);
      if (imgError) return res.status(400).json({ message: imgError });
    }
    const updated = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('user_id', POPULATE_USER_OWNER)
      .populate('category_id', POPULATE_CATEGORY);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID ogłoszenia' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Ogłoszenie nie znalezione' });
    if (listing.user_id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Brak uprawnień' });
    }
    await Listing.findByIdAndDelete(req.params.id);
    res.json({ message: 'Ogłoszenie usunięte', _id: req.params.id });
  } catch (err) {
    next(err);
  }
};

exports.getByUser = async (req, res, next) => {
  try {
    const listings = await Listing.find({ user_id: req.user.id })
      .populate('category_id', POPULATE_CATEGORY)
      .sort({ createdAt: -1 });
    res.json(listings);
  } catch (err) {
    next(err);
  }
};

exports.markAsSold = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID ogłoszenia' });
    }

    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Ogłoszenie nie znalezione' });
    if (listing.user_id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Tylko właściciel może oznaczyć ogłoszenie jako sprzedane' });
    }
    if (listing.status === 'sold') {
      return res.status(400).json({ message: 'Ogłoszenie jest już oznaczone jako sprzedane' });
    }
    listing.status = 'sold';
    await listing.save();
    const populated = await Listing.findById(listing._id)
      .populate('user_id', POPULATE_USER_OWNER)
      .populate('category_id', POPULATE_CATEGORY);
    res.json(populated);
  } catch (err) {
    next(err);
  }
};
