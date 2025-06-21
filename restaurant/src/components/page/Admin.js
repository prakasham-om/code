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
import { FiDownload, FiMessageCircle, FiChevronDown, FiChevronUp, FiUser, FiTrash2 } from "react-icons/fi";
import ChatBox from "../ChatBox";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({ 
    totalUsers: 0, 
    revenue: 0, 
    completedTasks: 0 
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatUser, setChatUser] = useState(null);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedDate) params.date = selectedDate;
      if (searchTerm) params.search = searchTerm;

      const res = await axios.get("https://code-3oqu.onrender.com/api/admin/users", { params });
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch Users Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await axios.get("https://code-3oqu.onrender.com/api/admin/summary");
      setSummary(res.data);
    } catch (err) {
      console.error("Fetch Summary Error:", err);
    }
  };

  const handleCompleteTask = async (userId, fileIndex) => {
    try {
      await axios.put(`https://code-3oqu.onrender.com/api/admin/user/${userId}/file/${fileIndex}`, {
        status: "Completed",
      });
      fetchUsers();
      fetchSummary();
    } catch (err) {
      console.error("Complete Task Error:", err);
      alert("Failed to complete task. Please try again.");
    }
  };

  const handleAdminFileUpload = async (e, userId, fileIndex) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("adminFile", file);
    formData.append("adminMessage", "Uploaded by admin");

    try {
      const uploadRes = await axios.post("https://code-3oqu.onrender.com/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      const url = uploadRes.data.url || uploadRes.data.fileUrl;
      await axios.put(`https://code-3oqu.onrender.com/api/admin/user/${userId}/file/${fileIndex}`, {
        adminFileUrl: url,
      });
      fetchUsers();
    } catch (err) {
      console.error("Admin File Upload Error:", err);
      alert("File upload failed. Please try again.");
    }
  };

  const handleDeleteFile = async (userId, fileIndex) => {
    if (window.confirm("Are you sure you want to delete this file? This action cannot be undone.")) {
      try {
        await axios.delete(`https://code-3oqu.onrender.com/api/admin/user/${userId}/file/${fileIndex}`);
        
        // Update UI without refetching all data
        if (activePage === "userDetail" && selectedUser?._id === userId) {
          const updatedFiles = [...selectedUser.files];
          updatedFiles.splice(fileIndex, 1);
          setSelectedUser({ ...selectedUser, files: updatedFiles });
        }
        
        fetchUsers(); // Refetch to update summary and user list
        fetchSummary(); // Update revenue summary
      } catch (err) {
        console.error("Delete File Error:", err);
        alert("Failed to delete file. Please try again.");
      }
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user and all their files? This action cannot be undone.")) {
      try {
        await axios.delete(`https://code-3oqu.onrender.com/api/admin/user/${userId}`);
        
        if (activePage === "userDetail" && selectedUser?._id === userId) {
          setActivePage("dashboard");
        }
        
        fetchUsers();
        fetchSummary();
      } catch (err) {
        console.error("Delete User Error:", err);
        alert("Failed to delete user. Please try again.");
      }
    }
  };

  const exportCSV = () => {
    const rows = [["Name", "Email", "Joined", "Files Completed", "Total Files"]];
    users.forEach((u) => {
      const joined = u.createdAt?.split("T")[0] || "N/A";
      const completedFiles = (u.files || []).filter(f => f.status === "Completed").length;
      const totalFiles = u.files?.length || 0;
      rows.push([u.name, u.email, joined, completedFiles, totalFiles]);
    });
    const csv = "data:text/csv;charset=utf-8," + rows.map(r => r.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `users-${selectedDate || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleUserExpand = (userId) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setActivePage("userDetail");
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
  ).sort((a, b) => new Date(a.date) - new Date(b.date));

  useEffect(() => {
    fetchUsers();
    fetchSummary();
  }, [selectedDate, searchTerm]);

  if (activePage === "userDetail" && selectedUser) {
    return (
      <div className="p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button 
              onClick={() => setActivePage("dashboard")}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mr-4"
            >
              <FiChevronDown className="rotate-90 transform" /> Back to Dashboard
            </button>
            <h1 className="text-2xl font-bold">👤 User Details</h1>
          </div>
          <button
            onClick={() => handleDeleteUser(selectedUser._id)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FiTrash2 /> Delete User
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mr-4">
              <FiUser size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedUser.name}</h2>
              <p className="text-gray-600">{selectedUser.email}</p>
              <p className="text-sm text-gray-500">
                Joined: {selectedUser.createdAt?.split("T")[0] || "N/A"}
              </p>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-4">Files</h3>
          
          {selectedUser.files?.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No files uploaded yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedUser.files?.map((file, idx) => (
                <div key={idx} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium">{file.originalName || `File ${idx + 1}`}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        file.status === "Completed" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {file.status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setChatUser(selectedUser)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Chat with user"
                      >
                        <FiMessageCircle />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">User File:</p>
                      <a 
                        href={file.fileUrl} 
                        download
                        className="text-blue-600 hover:underline truncate block"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download
                      </a>
                    </div>
                    
                    <div>
                      <p className="text-gray-500 text-xs">Admin File:</p>
                      {file.adminFileUrl ? (
                        <a 
                          href={file.adminFileUrl} 
                          download
                          className="text-blue-600 hover:underline truncate block"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      ) : (
                        <div className="mt-1">
                          <label className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
                            <span>Upload admin file</span>
                            <input 
                              type="file"
                              accept="application/pdf,image/*"
                              onChange={(e) => handleAdminFileUpload(e, selectedUser._id, idx)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={file.status === "Completed"}
                        onClick={() => handleCompleteTask(selectedUser._id, idx)}
                        className={`flex-1 text-sm px-3 py-1.5 rounded ${
                          file.status === "Completed"
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-green-500 text-white hover:bg-green-600"
                        }`}
                      >
                        {file.status === "Completed" ? "Completed" : "Mark Complete"}
                      </button>
                      <button
                        onClick={() => handleDeleteFile(selectedUser._id, idx)}
                        className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600"
                        title="Delete file"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {chatUser && (
          <ChatBox 
            userEmail={chatUser.email} 
            onClose={() => setChatUser(null)} 
            isAdmin={true} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">📊 Admin Dashboard</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-3 py-1.5 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-1.5 rounded-lg shadow-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition-colors"
          >
            <FiDownload /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow text-center transition-transform hover:scale-[1.02]">
          <h2 className="text-sm text-gray-500 mb-1">Total Users</h2>
          <p className="text-2xl font-bold text-blue-600">{summary.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center transition-transform hover:scale-[1.02]">
          <h2 className="text-sm text-gray-500 mb-1">Completed Tasks</h2>
          <p className="text-2xl font-bold text-green-600">{summary.completedTasks}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow text-center transition-transform hover:scale-[1.02]">
          <h2 className="text-sm text-gray-500 mb-1">Revenue</h2>
          <p className="text-2xl font-bold text-purple-600">₹ {summary.revenue}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-4 rounded-xl shadow transition-transform hover:scale-[1.01]">
          <h3 className="text-lg font-semibold mb-3">📈 User Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                dataKey="users" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6, fill: '#2563eb' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-4 rounded-xl shadow transition-transform hover:scale-[1.01]">
          <h3 className="text-lg font-semibold mb-3">💰 Revenue Growth</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line 
                dataKey="revenue" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6, fill: '#059669' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow overflow-x-auto">
        <h3 className="text-lg font-semibold mb-4">👥 User Management</h3>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-500 py-6">No users found. Try adjusting your search filters.</p>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Files</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3 rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <React.Fragment key={user._id}>
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center mr-3">
                          <FiUser />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block max-w-[160px] truncate">{user.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {user.createdAt?.split("T")[0] || "-"}
                    </td>
                    <td className="px-4 py-3">
                      {user.files?.length || 0}
                    </td>
                    <td className="px-4 py-3">
                      {user.files?.filter(f => f.status === "Completed").length || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <button
                          onClick={() => toggleUserExpand(user._id)}
                          className="text-blue-600 hover:text-blue-800"
                          title={expandedUsers[user._id] ? "Collapse" : "Expand"}
                        >
                          {expandedUsers[user._id] ? <FiChevronUp /> : <FiChevronDown />}
                        </button>
                        <button
                          onClick={() => setChatUser(user)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Chat with user"
                        >
                          <FiMessageCircle />
                        </button>
                        <button
                          onClick={() => handleUserSelect(user)}
                          className="text-sm bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                          title="View details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete user"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedUsers[user._id] && user.files && user.files.length > 0 && (
                    <tr className="border-b bg-gray-50">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="ml-12 mb-3">
                          <h4 className="font-medium mb-2 text-gray-700">Files:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {user.files.map((file, idx) => (
                              <div key={idx} className="border rounded-lg p-3 bg-white">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium text-sm">
                                    {file.originalName || `File ${idx + 1}`}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    file.status === "Completed" 
                                      ? "bg-green-100 text-green-700" 
                                      : "bg-yellow-100 text-yellow-700"
                                  }`}>
                                    {file.status}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 gap-2 text-xs">
                                  <div>
                                    <a 
                                      href={file.fileUrl} 
                                      download
                                      className="text-blue-600 hover:underline"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Download User File
                                    </a>
                                  </div>
                                  
                                  <div>
                                    {file.adminFileUrl ? (
                                      <a 
                                        href={file.adminFileUrl} 
                                        download
                                        className="text-blue-600 hover:underline"
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Download Admin File
                                      </a>
                                    ) : (
                                      <label className="text-blue-600 hover:text-blue-800 cursor-pointer">
                                        <span>Upload Admin File</span>
                                        <input 
                                          type="file"
                                          accept="application/pdf,image/*"
                                          onChange={(e) => handleAdminFileUpload(e, user._id, idx)}
                                          className="hidden"
                                        />
                                      </label>
                                    )}
                                  </div>
                                  
                                  <div className="flex gap-2 mt-2">
                                    <button
                                      disabled={file.status === "Completed"}
                                      onClick={() => handleCompleteTask(user._id, idx)}
                                      className={`flex-1 text-xs px-2 py-1 rounded ${
                                        file.status === "Completed"
                                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                          : "bg-green-500 text-white hover:bg-green-600"
                                      }`}
                                    >
                                      {file.status === "Completed" ? "Completed" : "Mark Complete"}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFile(user._id, idx)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete file"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {chatUser && (
        <ChatBox 
          userEmail={chatUser.email} 
          onClose={() => setChatUser(null)} 
          isAdmin={true} 
        />
      )}
    </div>
  );
};

export default AdminDashboard;
