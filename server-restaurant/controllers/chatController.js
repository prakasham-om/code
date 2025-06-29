const Message = require("../model/Chat");
const { encrypt, decrypt } = require("../util/cryptoUtil");

// GET all messages between two users
exports.getMessages = async (req, res) => {
  const { user1, user2 } = req.query;

  if (!user1 || !user2) {
    return res.status(400).json({ error: "Missing user parameters" });
  }

  try {
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 },
      ],
    }).sort("timestamp");

    const decrypted = messages.map(msg => {
      try {
        return {
          _id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          message: decrypt(msg.encryptedMessage),
          timestamp: msg.timestamp,
        };
      } catch (err) {
        console.error("❌ Failed to decrypt message:", err.message);
        return null;
      }
    }).filter(Boolean); // Remove failed decryptions

    res.json(decrypted);
  } catch (err) {
    console.error("❌ Failed to fetch messages:", err.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// POST create new message
exports.createMessage = async (req, res) => {
  const { sender, receiver, message } = req.body;

  if (!sender || !receiver || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const encryptedMessage = encrypt(message);

    const newMessage = new Message({
      sender,
      receiver,
      encryptedMessage,
    });

    await newMessage.save();

    res.status(201).json({
      _id: newMessage._id,
      sender,
      receiver,
      message, // plain text returned to frontend
      timestamp: newMessage.timestamp,
    });
  } catch (err) {
    console.error("❌ Failed to save message:", err.message);
    res.status(500).json({ error: "Failed to save message" });
  }
};

// DELETE message
exports.deleteMessage = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Failed to delete message:", err.message);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
