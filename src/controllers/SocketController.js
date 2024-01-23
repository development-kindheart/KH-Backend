const User = require("../models/UserModel");
const Room = require("../models/Room");
const Message = require("../models/Message");
const FoundationModel = require("../models/FoundationModel");
const StoreModel = require("../models/StoreModel");
const asyncHandler = require("express-async-handler");

const getUnreadCount = asyncHandler(async (type, from, to) => {
  const filter = type === "room" ? [to] : [from, to];
  const messageReaders = await Message.find({ sender: { $ne: from } })
    .all("users", filter)
    .select(["readers"])
    .sort({ createdAt: -1 })
    .lean();

  return (
    messageReaders.filter(({ readers }) => readers.indexOf(from) === -1)
      .length || 0
  );
});

const getMessageInfo = asyncHandler(async (type, from, to) => {
  const filter = type === "room" ? [to] : [from, to];
  const message = await Message.findOne()
    .all("users", filter)
    .select(["message", "sender", "updatedAt", "readers"])
    .sort({ createdAt: -1 })
    .lean();

  const unreadCount = await getUnreadCount(type, from, to);

  return {
    latestMessage: message?.message || null,
    latestMessageSender: message?.sender || null,
    latestMessageUpdatedAt: message?.updatedAt || null,
    unreadCount,
  };
});

// READ
const getUserContacts = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId)
      return res.status(400).json({ message: "Missing required information." });

    // Fetch only 'chatType' and '_id' from User model
    const users = await User.find({ _id: { $ne: userId } })
      .select(["chatType"])
      .lean();

    // Initialize arrays to store results from FoundationModel and StoreModel
    const foundationUsers = [];
    const storeUsers = [];

    // Iterate through users and search in FoundationModel and StoreModel
    await Promise.all(
      users.map(async (user) => {
        const { _id, chatType } = user;

        // Check in FoundationModel
        const foundInFoundation = await FoundationModel.findOne({
          user: _id,
        }).lean();
        if (foundInFoundation) {
          foundationUsers.push({
            _id,
            chatType,
            avatarImage: foundInFoundation.logo,
            name: foundInFoundation.username,
          });
        }

        // Check in StoreModel
        const foundInStore = await StoreModel.findOne({ user: _id }).lean();
        if (foundInStore) {
          storeUsers.push({
            _id,
            chatType,
            avatarImage: foundInStore.logo,
            name: foundInStore.username,
          });
        }
      })
    );

    // Combine results from FoundationModel and StoreModel
    const contacts = foundationUsers.concat(storeUsers);

    // Manipulate the contacts array further if needed
    // ...

    return res.status(200).json({ data: contacts });
  } catch (err) {
    console.log("--------------error a gya getUserContact", err);
    return res.status(404).json({ message: err.message });
  }
});

const getUserMessages = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;
    const { type, chatId } = req.query;

    if (!userId || !type || !chatId) {
      return res.status(400).json({ message: "Missing required information." });
    }

    const filter = type === "room" ? [chatId] : [userId, chatId];
    const messages = await Message.find()
      .all("users", filter)
      .sort({ createdAt: 1 })
      .lean();

    const messagesWithAvatar = await Promise.all(
      messages.map(async (msg) => {
        const senderId = msg.sender;
        const user = await User.findById(senderId).lean();
        return {
          ...msg,
          avatarImage: user.avatarImage,
        };
      })
    );

    return res.status(200).json({ data: messagesWithAvatar });
  } catch (err) {
    console.log("--------------error a gya getUserMessage", err);
    return res.status(404).json({ message: err.message });
  }
});

// CREATE
const postUserMessage = async (req, res) => {
  console.log("---------------challa", req.body);
  try {
    const { userId } = req.params;
    const { chatId } = req.query;
    const { message } = req.body;

    if (!userId || !chatId || !message) {
      return res.status(400).json({ message: "Missing required information." });
    }

    const newMessage = await Message.create({
      message,
      users: [userId, chatId],
      sender: userId,
      readers: [],
    });
    console.log("-------------newMessage", newMessage);

    return res.status(200).json({ data: newMessage });
  } catch (err) {
    console.log("--------------error a gya postUserMessage", err);
    return res.status(500).json({ message: err.message });
  }
};

const postRoom = asyncHandler(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, users, avatarImage } = req.body;

    if (!userId || !name || !users || !avatarImage) {
      return res.status(400).json({ message: "Missing required information." });
    }

    const data = await Room.create({
      name,
      users: [...users, userId],
      avatarImage,
      chatType: "room",
    });

    return res.json({ data, messages: "Successfully created a room." });
  } catch (err) {
    console.log("--------------error a gya postroom", err);
    return res.status(500).json({ message: e.message });
  }
});

// UPDATE
const updateMessageReadStatus = asyncHandler(async (req, res) => {
  try {
    // chatId 的訊息被 userId 已讀
    const { userId } = req.params;
    const { type, chatId } = req.query;

    if (!userId || !type || !chatId) {
      return res.status(400).json({ message: "Missing required information." });
    }

    const filter = type === "room" ? [chatId] : [userId, chatId];

    const messages = await Message.find({ sender: { $ne: userId } })
      .all("users", filter)
      .sort({ createdAt: 1 });

    const messageReaderMap = messages.reduce((prev, curr) => {
      return { ...prev, [curr._id.toHexString()]: curr.readers };
    }, {});

    Object.entries(messageReaderMap).forEach(([key, value]) => {
      const userHasRead = value.indexOf(userId) > -1;
      if (!userHasRead) messageReaderMap[key].push(userId); // 還沒已讀就加入
    });

    await Promise.all(
      Object.keys(messageReaderMap).map(async (msgId) => {
        return await Message.findByIdAndUpdate(
          { _id: msgId },
          { readers: messageReaderMap[msgId] },
          { new: true }
        ).lean();
      })
    );

    return res
      .status(200)
      .json({ data: null, message: "Successfully updated." });
  } catch (err) {
    console.log("--------------error a gya updateMessageReadStatus", err);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = {
  getUserContacts,
  getUserMessages,
  postUserMessage,
  postRoom,
  updateMessageReadStatus,
};
