import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IoSend, IoClose, IoTrash } from "react-icons/io5";
import { FiMessageCircle } from "react-icons/fi";
import io from "socket.io-client";

const ADMIN_EMAIL = "rohitsahoo866@gmail.com";

const ChatBox = ({ userEmail: propUserEmail, onClose, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userEmail = isAdmin ? propUserEmail : storedUser?.email;

  useEffect(() => {
    if (!userEmail) return;

    socketRef.current = io("https://code-3oqu.onrender.com/", {
      withCredentials: true,
      transports: ["polling"],
      upgrade: false,
    });

    const socket = socketRef.current;

    socket.emit("join", { email: userEmail });

    const fetchMessages = async () => {
      try {
        const res = await fetch(`https://code-3oqu.onrender.com/api/messages/${userEmail}`);
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

    socket.on("message_deleted", (deletedId) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== deletedId));
    });

    return () => {
      socket.off("receive_message");
      socket.off("message_deleted");
      socket.disconnect();
    };
  }, [userEmail, isAdmin]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const sender = isAdmin ? ADMIN_EMAIL : userEmail;
    const receiver = isAdmin ? userEmail : ADMIN_EMAIL;

    const messageData = {
      sender,
      receiver,
      message: newMessage.trim(),
    };

    try {
      const response = await fetch("https://code-3oqu.onrender.com/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      const savedMessage = await response.json();
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      setIsDeleting(true);
      await fetch(`https://code-3oqu.onrender.com/api/messages/${messageId}`, {
        method: "DELETE",
      });

      socketRef.current?.emit("delete_message", messageId);
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!userEmail) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-lg text-red-500 text-sm max-w-md">
          <p className="mb-4">❌ Unable to identify user. Please login again.</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Close Chat
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
        className="relative w-full sm:w-[400px] max-w-[95vw] h-[90vh] sm:h-[520px] bg-white shadow-xl rounded-2xl flex flex-col overflow-hidden"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 flex justify-between items-center">
          <div>
            <span className="font-semibold text-sm tracking-wide block">
              💬 {isAdmin ? `Chat with ${userEmail}` : "Chat with Admin"}
            </span>
            <span className="text-xs opacity-80 block mt-1">
              {isAdmin ? "Admin Mode" : "User Mode"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <IoClose size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 bg-gradient-to-b from-gray-50 to-gray-100 space-y-3 text-sm scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <div className="bg-gray-200 border-2 border-dashed rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FiMessageCircle size={32} className="text-gray-400" />
              </div>
              <p className="text-gray-500">No messages yet</p>
              <p className="text-gray-400 text-sm mt-2">
                Start a conversation by sending your first message
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isSender = msg.sender === (isAdmin ? ADMIN_EMAIL : userEmail);
              return (
                <div key={msg._id} className={`flex ${isSender ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`px-4 py-2 rounded-2xl shadow text-sm relative group ${
                        isSender
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-white border text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className={`text-[10px] opacity-70 ${isSender ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                        {(isAdmin || isSender) && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            disabled={isDeleting}
                            className={`ml-2 opacity-0 group-hover:opacity-70 transition-opacity ${
                              isDeleting ? 'cursor-not-allowed' : 'hover:opacity-100'
                            }`}
                          >
                            <IoTrash size={12} />
                          </button>
                        )}
                      </div>
                    </div>
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
            className="flex-1 px-4 py-3 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={`p-3 rounded-full ${
              newMessage.trim()
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400"
            } transition-colors`}
          >
            <IoSend size={18} />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatBox;
