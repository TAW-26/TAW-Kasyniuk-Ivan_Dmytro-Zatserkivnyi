const mongoose = require("mongoose");
const Message = require("../models/Message");

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

exports.send = async (req, res) => {
  try {
    const { to, content, listing_id } = req.body;

    if (!to || !content || !content.trim()) {
      return res.status(400).json({ message: "Odbiorca i treść są wymagane" });
    }

    if (to === req.user.id) {
      return res.status(400).json({ message: "Nie możesz wysłać wiadomości do siebie" });
    }

    const message = await Message.create({
      from: req.user.id,
      to,
      listing_id: listing_id || null,
      content: content.trim(),
    });

    const populated = await Message.findById(message._id)
      .populate("from", "username email")
      .populate("to", "username email")
      .populate("listing_id", "title");

    res.status(201).json(populated);
  } catch (err) {
    console.error("[messages.send] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.getConversation = async (req, res) => {
  try {
    const me = req.user.id;
    const other = req.params.userId;

    const messages = await Message.find({
      $or: [
        { from: me, to: other },
        { from: other, to: me },
      ],
    })
      .populate("from", "username email")
      .populate("to", "username email")
      .populate("listing_id", "title")
      .sort({ createdAt: 1 });

    await Message.updateMany(
      { from: other, to: me, read_at: null },
      { $set: { read_at: new Date() } }
    );

    res.json(messages);
  } catch (err) {
    console.error("[messages.getConversation] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.listConversations = async (req, res) => {
  try {
    const me = toObjectId(req.user.id);

    const conversations = await Message.aggregate([
      { $match: { $or: [{ from: me }, { to: me }] } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          partner: { $cond: [{ $eq: ["$from", me] }, "$to", "$from"] },
        },
      },
      {
        $group: {
          _id: "$partner",
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$to", me] }, { $eq: ["$read_at", null] }] },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partner",
        },
      },
      { $unwind: "$partner" },
      {
        $project: {
          _id: 0,
          partner: { _id: "$partner._id", username: "$partner.username", email: "$partner.email" },
          lastMessage: {
            _id: "$lastMessage._id",
            content: "$lastMessage.content",
            createdAt: "$lastMessage.createdAt",
            from: "$lastMessage.from",
            to: "$lastMessage.to",
            listing_id: "$lastMessage.listing_id",
          },
          unreadCount: 1,
        },
      },
      { $sort: { "lastMessage.createdAt": -1 } },
    ]);

    res.json(conversations);
  } catch (err) {
    console.error("[messages.listConversations] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user.id, read_at: null });
    res.json({ count });
  } catch (err) {
    console.error("[messages.unreadCount] error:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
};
