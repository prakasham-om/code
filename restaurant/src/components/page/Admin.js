import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { FiDownload, FiMessageCircle } from "react-icons/fi";
import ChatBox from "../ChatBox";
import { UserListModal, UserDetailView } from "./UserList";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ totalUsers: 0, revenue: 0, completedTasks: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState(null);
  const [showUserList, setShowUserList] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("https://code-fsue.vercel.app/api/admin/users", {
        params: { date: selectedDate, search: searchTerm },
      });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get("https://code-fsue.vercel.app/api/admin/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Fetch Summary Error:", err);
    }
  };

  const chartData = Object.values(
    users.reduce((map, u) => {
      const date = u.createdAt?.split("T")[0] || "Unknown";
      if (!map[date]) map[date] = { date, users: 0, revenue: 0 };
      map[date].users++;
      (u.files || []).forEach((f) => {
        if (f.status === "Completed") map[date].revenue += 50;
      });
      return map;
    }, {})
  );

  useEffect(() => {
    fetchUsers();
    fetchSummary();
  }, [selectedDate, searchTerm]);

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-b from-gray-50 to-white min-h-screen text-gray-800">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-center">📊 Admin Dashboard</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-3">📈 User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="users" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-3">💰 Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white shadow rounded-xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Files</th>
              <th className="px-4 py-2 text-center">Chat</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-6 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.name || "N/A"}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    {user.files?.length > 0 ? (
                      <ul className="list-disc ml-4">
                        {user.files.map((f, i) => (
                          <li key={i}>{f.fileName || "Unnamed"} - <span className={`text-sm ${f.status === "Completed" ? "text-green-600" : "text-red-500"}`}>{f.status}</span></li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400">No files</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setChatUser(user)}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <FiMessageCircle /> Chat
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Chat Modal */}
      {chatUser && (
        <ChatBox userEmail={chatUser.email} onClose={() => setChatUser(null)} isAdmin={true} />
      )}

      {/* User List Modal */}
      {showUserList && (
        <UserListModal
          users={users}
          onSelectUser={(u) => {
            setSelectedUserDetail(u);
            setShowUserList(false);
          }}
          onClose={() => setShowUserList(false)}
        />
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <UserDetailView
          user={selectedUserDetail}
          onBack={() => {
            setSelectedUserDetail(null);
            setShowUserList(true);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
