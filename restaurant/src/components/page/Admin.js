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

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ totalUsers: 0, revenue: 0, completedTasks: 0 });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        params: { date: selectedDate, search: searchTerm },
      });
      setUsers(res.data);
      console.log("Fetched Users:", res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Fetch Summary Error:", err);
    }
  };

  const handleCompleteTask = async (userId, fileIndex) => {
    try {
      await axios.put(`http://localhost:5000/api/admin/user/${userId}/file/${fileIndex}`, {
        status: "Completed",
      });
      fetchUsers();
      fetchSummary();
    } catch (err) {
      console.error("Complete Task Error:", err);
    }
  };

  const handleAdminFileUpload = async (e, userId, fileIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("adminFile", file);
    formData.append("adminMessage", "Uploaded by admin");

    try {
      const uploadRes = await axios.post("http://localhost:5000/api/upload", formData);
      const url = uploadRes.data.url || uploadRes.data.fileUrl;
      await axios.put(`http://localhost:5000/api/admin/user/${userId}/file/${fileIndex}`, {
        adminFileUrl: url,
      });
      fetchUsers();
    } catch (err) {
      console.error("Admin File Upload Error:", err);
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Joined", "Status"]];
    users.forEach((u) => {
      const joined = u.createdAt?.split("T")[0] || "N/A";
      const statuses = (u.files || []).map((f) => f.status).join("|") || "No files";
      rows.push([u.name, u.email, joined, statuses]);
    });
    const csv = "data:text/csv;charset=utf-8," + rows.map((r) => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `users-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-3 py-1.5 rounded shadow-sm text-sm"
          />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-1.5 rounded shadow-sm text-sm"
          />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
          >
            <FiDownload /> CSV
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h2 className="text-sm text-gray-500">Total Users</h2>
          <p className="text-2xl font-bold text-blue-600">{summary.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h2 className="text-sm text-gray-500">Completed Tasks</h2>
          <p className="text-2xl font-bold text-green-600">{summary.completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <h2 className="text-sm text-gray-500">Revenue</h2>
          <p className="text-2xl font-bold text-purple-600">₹ {summary.revenue}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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

      {/* Table */}
      <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
        {loading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500">No users found.</p>
        ) : (
          <table className="min-w-[900px] w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">User File</th>
                <th className="px-4 py-3">Upload Admin File</th>
                <th className="px-4 py-3 text-center">Complete</th>
                <th className="px-4 py-3 text-center">Chat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) =>
                (u.files || []).map((f, idx) => (
                  <tr key={`${u._id}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{u.name}</td>
                    <td className="px-4 py-2">{u.email}</td>
                    <td className="px-4 py-2">{u.createdAt?.split("T")[0] || "-"}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          f.status === "Completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {f.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <a
                        href={f.fileUrl}
                        download
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Download
                      </a>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleAdminFileUpload(e, u._id, idx)}
                        className="text-xs"
                      />
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        disabled={f.status === "Completed"}
                        onClick={() => handleCompleteTask(u._id, idx)}
                        className={`text-xs px-2 py-1 rounded ${
                          f.status === "Completed"
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-green-600 hover:text-green-800"
                        }`}
                      >
                        ✅
                      </button>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => setChatUser(u)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiMessageCircle />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Chat Modal */}
      {chatUser && (
        <ChatBox userEmail={chatUser.email} onClose={() => setChatUser(null)} isAdmin={true} />
      )}
    </div>
  );
};

export default AdminDashboard;
