const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../utils/cryptoUtil");

const messageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  encryptedMessage: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Pre-save hook to encrypt message
messageSchema.pre("save", function(next) {
  if (this.isModified("message")) {
    this.encryptedMessage = encrypt(this.message);
  }
  next();
});

// Virtual for decrypted message
messageSchema.virtual("decryptedMessage").get(function() {
  return decrypt(this.encryptedMessage);
});

// Virtual for plain text message (for input)
messageSchema.virtual("message")
  .set(function(value) {
    this._message = value;
  })
  .get(function() {
    return this._message;
  });

module.exports = mongoose.model("Chat", messageSchema);
