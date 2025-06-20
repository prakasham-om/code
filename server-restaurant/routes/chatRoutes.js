const express = require("express");
const router = express.Router();
const Message = require("../model/Chat");

const ADMIN_EMAIL = "rohitsahoo866@gmail.com";

router.get("/:userEmail", async (req, res) => {
  const userEmail = req.params.userEmail;

  try {
    const messages = await Message.find({
      $or: [
        { sender: userEmail, receiver: ADMIN_EMAIL },
        { sender: ADMIN_EMAIL, receiver: userEmail },
      ],
    }).sort("timestamp");

    res.json(messages.map((msg) => ({
      sender: msg.sender,
      message: msg.decryptedMessage,
      timestamp: msg.timestamp,
    })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
