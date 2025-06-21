
const Message = require("../model/Chat");
const { encrypt, decrypt } = require("../util/cryptoUtil");

// Get messages between two users
exports.getMessages = async (req, res) => {
  try {
    const { user1, user2 } = req.query;
    
    if (!user1 || !user2) {
      return res.status(400).json({ error: "Missing user parameters" });
    }

    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort("timestamp");

    // Decrypt messages
    const decryptedMessages = messages.map(msg => ({
      _id: msg._id,
      sender: msg.sender,
      receiver: msg.receiver,
      message: decrypt(msg.encryptedMessage),
      timestamp: msg.timestamp
    }));

    res.json(decryptedMessages);
  } catch (err) {
    console.error("Failed to fetch messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    
    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const encryptedMessage = encrypt(message);
    
    const newMessage = new Message({
      sender,
      receiver,
      encryptedMessage,
    });

    await newMessage.save();
    
    // Return decrypted message for immediate display
    res.status(201).json({
      ...newMessage.toObject(),
      message, // Return decrypted message
      encryptedMessage: undefined // Don't send encrypted version
    });
  } catch (err) {
    console.error("Failed to create message:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    
    const message = await Message.findByIdAndDelete(id);
    
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    
    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    console.error("Failed to delete message:", err);
    res.status(500).json({ error: "Failed to delete message" });
  }
};
