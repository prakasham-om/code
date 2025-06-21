const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "https://code-fsue.vercel.app/" }));
const io = new Server(server, {
  cors: { origin: "https://code-fsue.vercel.app/", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}).catch(err => console.error("❌ MongoDB connection error:", err));

// Routes
const adminRoutes = require("./routes/adminRoute");
const userRoutes = require("./routes/userRoute");
const chatRoutes = require("./routes/chatRoutes");

app.use("/api", adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", chatRoutes);

// Socket.io
const Message = require("./model/Chat");
const connected = {}; // email -> socket.id

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join", ({ email }) => {
    connected[email] = socket.id;
    console.log(`📲 ${email} joined chat`);
  });

  socket.on("send_message", async ({ sender, receiver, message }) => {
    if (!sender || !receiver || !message) {
      console.log("❌ Missing chat data");
      return;
    }

    try {
      const newMsg = new Message({
        sender,
        receiver,
        message,
        timestamp: new Date()
      });
      await newMsg.save();
      console.log("💾 Message saved:", newMsg);

      const receiverSocketId = connected[receiver];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", {
          sender,
          message,
          timestamp: newMsg.timestamp
        });
      }
    } catch (err) {
      console.error("❌ Failed to save message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    const email = Object.keys(connected).find(e => connected[e] === socket.id);
    if (email) delete connected[email];
    console.log("🔴 Socket disconnected:", socket.id);
  });
});
