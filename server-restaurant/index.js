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

// Allowed origins (with and without trailing slashes)
const allowedOrigins = [
  "https://code-seven-jet.vercel.app",
  "https://code-seven-jet.vercel.app/",
  "https://code-fsue.vercel.app",
  "https://code-fsue.vercel.app/"
];

// CORS configuration function
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Normalize origin by removing trailing slash
    const normalizedOrigin = origin.endsWith('/') 
      ? origin.slice(0, -1) 
      : origin;
    
    // Check if normalized origin is in allowed list
    const isAllowed = allowedOrigins.some(allowed => 
      allowed === normalizedOrigin || allowed === normalizedOrigin + '/'
    );
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin '${origin}' not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Socket.IO with proper CORS
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      
      const normalizedOrigin = origin.endsWith('/') 
        ? origin.slice(0, -1) 
        : origin;
      
      const isAllowed = allowedOrigins.some(allowed => 
        allowed === normalizedOrigin || allowed === normalizedOrigin + '/'
      );
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`Socket.IO origin '${origin}' not allowed`));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['polling', 'websocket']
});

app.use(express.json());

// Encryption setup
const secretKey = process.env.CRYPTO_SECRET || "default_secret_key_32_chars_long!";
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc", 
    Buffer.from(secretKey, 'hex'), 
    iv
  );
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

function decrypt(text) {
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc", 
      Buffer.from(secretKey, 'hex'), 
      iv
    );
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
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
  if (this._message) {
    this.encryptedMessage = encrypt(this._message);
  }
  next();
});

// Virtual for decrypted message
messageSchema.virtual("decryptedMessage").get(function() {
  return decrypt(this.encryptedMessage);
});

// Virtual for plain text message
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

// Health check
router.get("/", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

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

    const newMessage = new Message();
    newMessage.sender = sender;
    newMessage.receiver = receiver;
    newMessage.message = message; // Will be encrypted by pre-save hook

    await newMessage.save();
    
    // Return decrypted message for immediate display
    const responseMessage = {
      _id: newMessage._id,
      sender: newMessage.sender,
      receiver: newMessage.receiver,
      message: message,
      timestamp: newMessage.timestamp
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

// Socket.io Logic
const connected = {}; // Maps user email to socket ID

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  // Join chat room
  socket.on("join", ({ email }) => {
    if (email) {
      connected[email] = socket.id;
      console.log(`📲 ${email} joined chat (socket: ${socket.id})`);
    } else {
      console.log("❌ Join attempt without email");
    }
  });

  // Handle new messages
  socket.on("send_message", async (msg) => {
    try {
      if (!msg.sender || !msg.receiver || !msg.message) {
        console.log("❌ Invalid message format:", msg);
        return;
      }

      // Save message to database
      const newMsg = new Message();
      newMsg.sender = msg.sender;
      newMsg.receiver = msg.receiver;
      newMsg.message = msg.message; // Will be encrypted by pre-save hook

      await newMsg.save();
      
      // Create response object with decrypted message
      const responseMsg = {
        _id: newMsg._id,
        sender: newMsg.sender,
        receiver: newMsg.receiver,
        message: msg.message,
        timestamp: newMsg.timestamp
      };

      console.log(`💬 Message from ${msg.sender} to ${msg.receiver}`);

      // Broadcast to receiver
      const receiverSocketId = connected[msg.receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", responseMsg);
        console.log(`📤 Sent to ${msg.receiver} (socket: ${receiverSocketId})`);
      } else {
        console.log(`❌ ${msg.receiver} not connected`);
      }
      
      // Also send to sender for immediate update
      const senderSocketId = connected[msg.sender];
      if (senderSocketId && socket.id !== receiverSocketId) {
        io.to(senderSocketId).emit("receive_message", responseMsg);
        console.log(`📤 Sent to sender ${msg.sender} (socket: ${senderSocketId})`);
      }
    } catch (err) {
      console.error("❌ Error broadcasting message:", err);
    }
  });
  
  // Handle message deletion
  socket.on("delete_message", (messageId) => {
    console.log(`🗑️ Deleting message ${messageId}`);
    // Broadcast deletion to both users
    Object.values(connected).forEach(socketId => {
      io.to(socketId).emit("message_deleted", messageId);
    });
  });

  // Disconnect handler
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
    // Find email associated with this socket ID
    for (const [email, socketId] of Object.entries(connected)) {
      if (socketId === socket.id) {
        delete connected[email];
        console.log(`👋 ${email} left chat`);
        break;
      }
    }
  });
});

// Handle preflight requests
app.options("*", cors(corsOptions));
