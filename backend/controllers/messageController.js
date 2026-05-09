const mongoose = require('mongoose');
const Message = require('../models/Message');

const toObjectId = (id) => new mongoose.Types.ObjectId(id);
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const AUTO_REPLIES = [
  'Dzień dobry! Dziękuję za wiadomość. Ogłoszenie jest nadal dostępne — kiedy możemy się spotkać?',
  'Witam! Tak, produkt jest dostępny 🙂 Proszę podać preferowany termin odbioru.',
  'Cześć! Dziękuję za zainteresowanie. Jestem dostępny w dni powszednie po 17:00 oraz w weekendy.',
  'Dzień dobry! Chętnie sprzedam. Czy może Pan/Pani przyjechać do odbioru osobistego?',
  'Witam! Produkt jest w 100% sprawny, dokładnie taki jak na zdjęciach. Kiedy Panu/Pani odpowiada spotkanie?',
];

exports.send = async (req, res, next) => {
  try {
    const { to, content, listing_id } = req.body;
    if (!to || !content || !content.trim()) {
      return res.status(400).json({ message: 'Odbiorca i treść są wymagane' });
    }
    if (!isValidObjectId(to)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID odbiorcy' });
    }
    if (listing_id && !isValidObjectId(listing_id)) {
      return res.status(400).json({ message: 'Nieprawidłowy ID ogłoszenia' });
    }
    if (to === req.user.id) {
      return res.status(400).json({ message: 'Nie możesz wysłać wiadomości do siebie' });
    }

    const existing = await Message.countDocuments({
      $or: [
        { from: req.user.id, to },
        { from: to, to: req.user.id },
      ],
    });

    const message = await Message.create({
      from: req.user.id,
      to,
      listing_id: listing_id || null,
      content: content.trim(),
    });
    const populated = await Message.findById(message._id)
      .populate('from', 'username email avatar')
      .populate('to', 'username email avatar')
      .populate('listing_id', 'title');
    res.status(201).json(populated);

    if (existing === 0) {
      const replyText = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      const senderId = req.user.id;
      setTimeout(async () => {
        try {
          const alreadyReplied = await Message.countDocuments({ from: to, to: senderId });
          if (alreadyReplied === 0) {
            await Message.create({ from: to, to: senderId, listing_id: listing_id || null, content: replyText });
          }
        } catch (err) {
          console.error('[AUTO-REPLY]', err.message);
        }
      }, 1500);
    }
  } catch (err) {
    next(err);
  }
};

exports.getConversation = async (req, res, next) => {
  try {
    const me = req.user.id;
    const other = req.params.userId;
    if (!isValidObjectId(other)) {
      return res.status(400).json({ message: 'Nieprawidłowe ID użytkownika' });
    }
    const messages = await Message.find({
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    })
      .populate('from', 'username email avatar')
      .populate('to', 'username email avatar')
      .populate('listing_id', 'title')
      .sort({ createdAt: 1 });
    await Message.updateMany({ from: other, to: me, read_at: null }, { $set: { read_at: new Date() } });
    res.json(messages);
  } catch (err) {
    next(err);
  }
};

exports.listConversations = async (req, res, next) => {
  try {
    const me = toObjectId(req.user.id);
    const conversations = await Message.aggregate([
      { $match: { $or: [{ from: me }, { to: me }] } },
      { $sort: { createdAt: -1 } },
      { $addFields: { partner: { $cond: [{ $eq: ['$from', me] }, '$to', '$from'] } } },
      {
        $group: {
          _id: '$partner',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$to', me] }, { $eq: ['$read_at', null] }] }, 1, 0],
            },
          },
        },
      },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'partner' } },
      { $unwind: '$partner' },
      {
        $project: {
          _id: 0,
          partner: {
            _id: '$partner._id',
            username: '$partner.username',
            email: '$partner.email',
            avatar: '$partner.avatar',
          },
          lastMessage: {
            _id: '$lastMessage._id',
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            from: '$lastMessage.from',
            to: '$lastMessage.to',
            listing_id: '$lastMessage.listing_id',
          },
          unreadCount: 1,
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);
    res.json(conversations);
  } catch (err) {
    next(err);
  }
};

exports.unreadCount = async (req, res, next) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, read_at: null });
    res.json({ count });
  } catch (err) {
    next(err);
  }
};
