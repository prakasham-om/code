import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IoSend, IoClose } from "react-icons/io5";
import io from "socket.io-client";

const ADMIN_EMAIL = "rohitsahoo866@gmail.com";

const ChatBox = ({ userEmail: propUserEmail, onClose, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userEmail = isAdmin ? propUserEmail : storedUser?.email;

  useEffect(() => {
    if (!userEmail) return;

    socketRef.current = io("https://code-3oqu.onrender.com/", {
      withCredentials: true,
      transports: ["polling"],
      upgrade: false
    });

    const socket = socketRef.current;

    socket.emit("join", { email: userEmail });

    const fetchMessages = async () => {
      try {
        const sender = isAdmin ? ADMIN_EMAIL : userEmail;
        const receiver = isAdmin ? userEmail : ADMIN_EMAIL;

        const res = await fetch(
          `https://code-3oqu.onrender.com/api/messages?user1=${sender}&user2=${receiver}`
        );
        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error("Chat load failed:", err);
      }
    };

    fetchMessages();

    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off("receive_message");
      socket.disconnect();
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

    socketRef.current?.emit("send_message", messageData);

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
    <div className="fixed inset-0 z-50 flex justify-center items-center sm:items-end sm:justify-end p-2 sm:p-6">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full sm:w-[360px] max-w-[95vw] h-[90vh] sm:h-[520px] bg-white shadow-xl rounded-2xl flex flex-col overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 flex justify-between items-center">
          <span className="font-semibold text-sm tracking-wide">
            💬 {isAdmin ? `Chat with ${userEmail}` : "Chat with Admin"}
          </span>
          <button onClick={onClose} className="hover:scale-110">
            <IoClose size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 bg-gray-50 space-y-3 text-sm scroll-smooth">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 italic">No messages yet.</p>
          ) : (
            messages.map((msg, idx) => {
              const isSender = msg.sender === (isAdmin ? ADMIN_EMAIL : userEmail);
              return (
                <div key={idx} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow text-sm ${
                      isSender
                        ? "bg-blue-500 text-white rounded-br-none"
                        : "bg-white border text-gray-800 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-[10px] text-right mt-1 opacity-70">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
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
            className="flex-1 px-4 py-2 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
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
  );
};

export default ChatBox;
