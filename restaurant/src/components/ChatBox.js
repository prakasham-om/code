import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IoSend, IoClose } from "react-icons/io5";
import io from "socket.io-client";

const socket = const socket = io("https://code-fsue.vercel.app", {
  withCredentials: true,
  transports: ["polling"]
});
// Adjust if backend URL changes

const ADMIN_EMAIL = "rohitsahoo866@gmail.com";

const ChatBox = ({ userEmail: propUserEmail, onClose, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);

  // Get user email from localStorage if not provided
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userEmail = isAdmin ? propUserEmail : storedUser?.email;

  useEffect(() => {
    if (!userEmail) return;

    // Join socket room
    socket.emit("join", { email: userEmail });

    // Fetch historical chat
    const fetchMessages = async () => {
      try {
        const sender = isAdmin ? ADMIN_EMAIL : userEmail;
        const receiver = isAdmin ? userEmail : ADMIN_EMAIL;

        const res = await fetch(
          `https://code-fsue.vercel.app/api/messages?user1=${sender}&user2=${receiver}`
        );
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Chat load failed:", err);
      }
    };

    fetchMessages();

    // Listen for incoming socket messages
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [userEmail, isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!newMessage.trim()) return;

    const sender = isAdmin ? ADMIN_EMAIL : userEmail;
    const receiver = isAdmin ? userEmail : ADMIN_EMAIL;

    const messageData = {
      sender,
      receiver,
      message: newMessage.trim(),
    };

    // Emit to socket
    socket.emit("send_message", messageData);

    // Optimistic UI
    setMessages((prev) => [
      ...prev,
      {
        ...messageData,
        timestamp: new Date().toISOString(),
      },
    ]);
    setNewMessage("");
  };

  if (!userEmail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow text-red-500 text-sm">
          ❌ Unable to identify user. Please login again.
          <button
            onClick={onClose}
            className="mt-4 block text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="absolute sm:bottom-6 sm:right-6 bottom-1/2 left-1/2 sm:left-auto sm:translate-x-0 translate-x-[-50%] translate-y-1/2 sm:translate-y-0 z-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[90vw] sm:w-[360px] h-[80vh] sm:h-[500px] bg-white shadow-2xl rounded-xl flex flex-col overflow-hidden"
        >
          <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
            <span className="font-medium text-sm">
              💬 Chat {isAdmin ? `with ${userEmail}` : "with Admin"}
            </span>
            <button onClick={onClose}>
              <IoClose size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-blue-50 space-y-2 text-sm">
            {messages.length === 0 ? (
              <p className="text-center text-gray-500 italic">No messages yet.</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.sender === (isAdmin ? ADMIN_EMAIL : userEmail)
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm ${
                      msg.sender === (isAdmin ? ADMIN_EMAIL : userEmail)
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-800 border"
                    }`}
                  >
                    <p>{msg.message}</p>
                    <p className="text-[10px] text-right mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t bg-white p-3 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-sm border rounded-md"
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            >
              <IoSend size={18} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ChatBox;
