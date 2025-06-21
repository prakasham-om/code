const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatControler");

// GET /api/messages?user1=email1&user2=email2
router.get("/", chatController.getMessages);

// POST /api/messages
router.post("/", chatController.createMessage);

// DELETE /api/messages/:id
router.delete("/:id", chatController.deleteMessage);

module.exports = router;
