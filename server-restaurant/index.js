const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const crypto = require("crypto");

dotenv.config();

const app = express();
const server = http.createServer(app);

// Frontend URL
const FRONTEND_URL = "https://code-seven-jet.vercel.app/";

// CORS setup
app.use(cors({ 
  origin: FRONTEND_URL,
  credentials: true
}));

const io = new Server(server, {
  cors: { 
    origin: FRONTEND_URL, 
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(express.json());

// Encryption setup
const secretKey = process.env.CRYPTO_SECRET || "default_secret_key_32_chars_long!";
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc", 
    Buffer.from(secretKey), 
    iv
  );
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
}

function decrypt(text) {
  try {
    const [ivHex, encryptedHex] = text.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc", 
      Buffer.from(secretKey), 
      iv
    );
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (err) {
    console.error("Decryption error:", err);
    return "Unable to decrypt message";
  }
}

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}).catch(err => console.error("❌ MongoDB connection error:", err));

// Chat Message Schema
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

const Message = mongoose.model("Chat", messageSchema);

// Routes
const router = express.Router();

// Get messages between two users
router.get("/messages", async (req, res) => {
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
});

// Create a new message
router.post("/messages", async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    
    if (!sender || !receiver || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newMessage = new Message({
      sender,
      receiver,
      message // This will be encrypted by pre-save hook
    });

    await newMessage.save();
    
    // Return decrypted message for immediate display
    const responseMessage = {
      ...newMessage.toObject(),
      message, // Return original message
      encryptedMessage: undefined // Don't send encrypted version
    };
    
    res.status(201).json(responseMessage);
  } catch (err) {
    console.error("Failed to create message:", err);
    res.status(500).json({ error: "Failed to create message" });
  }
});

// Delete a message
router.delete("/messages/:id", async (req, res) => {
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
});

app.use("/api", router);

// Admin routes
const adminRoutes = require("./routes/adminRoute");
const userRoutes = require("./routes/userRoute");
app.use("/api", adminRoutes);
app.use("/api/user", userRoutes);

// Socket.io Logic
const connected = {}; // Maps user email to socket ID

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Join chat room
  socket.on("join", ({ email }) => {
    connected[email] = socket.id;
    console.log(`📲 ${email} joined chat`);
  });

  // Handle new messages
  socket.on("send_message", async (msg) => {
    try {
      // Save message to database
      const newMsg = new Message({
        sender: msg.sender,
        receiver: msg.receiver,
        message: msg.message
      });
      
      await newMsg.save();
      
      // Create response object with decrypted message
      const responseMsg = {
        ...newMsg.toObject(),
        message: msg.message,
        encryptedMessage: undefined
      };

      // Broadcast to receiver
      const receiverSocketId = connected[msg.receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", responseMsg);
      }
      
      // Also send to sender for immediate update
      if (socket.id !== receiverSocketId) {
        socket.emit("receive_message", responseMsg);
      }
    } catch (err) {
      console.error("Error broadcasting message:", err);
    }
  });
  
  // Handle message deletion
  socket.on("delete_message", (messageId) => {
    // Broadcast deletion to both users
    Object.values(connected).forEach(socketId => {
      io.to(socketId).emit("message_deleted", messageId);
    });
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    const email = Object.keys(connected).find(e => connected[e] === socket.id);
    if (email) delete connected[email];
    console.log("🔴 Socket disconnected:", socket.id);
  });
});
