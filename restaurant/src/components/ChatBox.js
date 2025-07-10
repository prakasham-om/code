import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IoSend, IoClose, IoTrash, IoRefresh, IoWarning } from "react-icons/io5";
import { FiMessageCircle } from "react-icons/fi";
import io from "socket.io-client";

const ADMIN_EMAIL = "rohitsahoo866@gmail.com";
const API_BASE_URL = "https://code-3oqu.onrender.com";
const SOCKET_URL = "https://code-3oqu.onrender.com";

const ChatBox = ({ userEmail: propUserEmail, onClose, isAdmin = false }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [socketStatus, setSocketStatus] = useState("disconnected"); // 'connected', 'connecting', 'disconnected', 'error'
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);
  const retryCountRef = useRef(0);
  const pollIntervalRef = useRef(null);

  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userEmail = isAdmin ? propUserEmail : storedUser?.email;

  // Initialize socket connection with retry logic
  const initSocket = () => {
    if (!userEmail || socketRef.current?.connected) return;

    console.log("Initializing socket connection...");
    setSocketStatus("connecting");

    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket connected!");
      setSocketStatus("connected");
      retryCountRef.current = 0;
      socket.emit("join", { email: userEmail });
      startMessagePolling(false); // Disable polling when socket is connected
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setSocketStatus("disconnected");
      if (reason === "io server disconnect") {
        // Server forced disconnect - try to reconnect
        setTimeout(() => socket.connect(), 1000);
      }
      startMessagePolling(true); // Enable polling when socket disconnects
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setSocketStatus("error");
      retryCountRef.current += 1;
      if (retryCountRef.current <= 3) {
        setTimeout(() => socket.connect(), 2000 * retryCountRef.current);
      } else {
        startMessagePolling(true); // Fallback to polling after 3 retries
      }
    });

    socket.on("receive_message", (msg) => {
      console.log("Received real-time message:", msg);
      addNewMessage(msg);
    });

    socket.on("message_deleted", (deletedId) => {
      console.log("Message deleted in real-time:", deletedId);
      setMessages(prev => prev.filter(msg => msg._id !== deletedId));
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      setSocketStatus("error");
    });

    return socket;
  };

  // Message polling fallback
  const startMessagePolling = (enable) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (enable) {
      console.log("Starting polling fallback...");
      pollIntervalRef.current = setInterval(fetchMessages, 5000);
    }
  };

  const addNewMessage = (msg) => {
    setMessages(prev => {
      // Check if message already exists to prevent duplicates
      if (!prev.some(m => m._id === msg._id)) {
        return [...prev, msg];
      }
      return prev;
    });
    setLastUpdate(Date.now());
  };

  const fetchMessages = async () => {
    try {
      console.log("Fetching messages...");
      const res = await fetch(`${API_BASE_URL}/api/messages/${userEmail}?lastUpdate=${lastUpdate}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      
      const data = await res.json();
      if (data.length > 0) {
        setMessages(prev => {
          const newMessages = data.filter(newMsg => 
            !prev.some(existingMsg => existingMsg._id === newMsg._id)
          );
          if (newMessages.length > 0) {
            console.log("Adding new messages from polling:", newMessages.length);
            return [...prev, ...newMessages];
          }
          return prev;
        });
        setLastUpdate(Date.now());
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setIsLoading(false);
    }
  };

  const reconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current.connect();
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const sender = isAdmin ? ADMIN_EMAIL : userEmail;
    const receiver = isAdmin ? userEmail : ADMIN_EMAIL;
    const messageData = { sender, receiver, message: newMessage.trim() };

    try {
      // Optimistically add message to UI
      const tempId = Date.now().toString();
      addNewMessage({
        _id: tempId,
        ...messageData,
        timestamp: new Date().toISOString()
      });
      setNewMessage("");

      // Send to server
      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const savedMessage = await response.json();
      
      // Replace temp message with saved message
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? savedMessage : msg
      ));
    } catch (err) {
      console.error("Failed to send message:", err);
      // Remove optimistic message if send failed
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  useEffect(() => {
    if (!userEmail) return;

    const socket = initSocket();
    fetchMessages();

    return () => {
      if (socket) {
        socket.disconnect();
        socket.off();
      }
      startMessagePolling(false);
    };
  }, [userEmail]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... (keep the rest of your component code, including render method)

  // Add this connection status display in your JSX:
  const renderConnectionStatus = () => {
    const statusMap = {
      connected: { text: "Connected", color: "bg-green-500" },
      connecting: { text: "Connecting...", color: "bg-yellow-500" },
      disconnected: { text: "Disconnected", color: "bg-red-500" },
      error: { text: "Connection Error", color: "bg-red-500" }
    };

    const status = statusMap[socketStatus] || statusMap.error;

    return (
      <div className="flex items-center justify-between px-3 py-1 bg-gray-100 text-xs">
        <div className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${status.color}`}></span>
          <span>{status.text}</span>
          {socketStatus !== "connected" && (
            <button 
              onClick={reconnectSocket}
              className="ml-2 text-blue-600 hover:text-blue-800 flex items-center"
            >
              <IoRefresh size={14} className="mr-1" />
              Reconnect
            </button>
          )}
        </div>
        {socketStatus === "error" && (
          <span className="text-red-600 flex items-center">
            <IoWarning className="mr-1" />
            Using fallback updates
          </span>
        )}
      </div>
    );
  };

  // Add this status component to your chat box JSX
  // Just below the header div in your current render code
};

export default ChatBox;
