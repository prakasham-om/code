const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../util/cryptoUtil");

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  encryptedMessage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Virtual to auto-decrypt
messageSchema.virtual("decryptedMessage").get(function () {
  try {
    return decrypt(this.encryptedMessage);
  } catch {
    return "Decryption failed";
  }
});

// Virtual for incoming plain text
messageSchema.virtual("message")
  .set(function (val) {
    this._message = val;
    this.encryptedMessage = encrypt(val);
  })
  .get(function () {
    return this._message;
  });

module.exports = mongoose.model("Chat", messageSchema); // Changed from "Message" to "Chat"
