import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiChevronLeft } from "react-icons/fi";

const UserListModal = ({ onClose, onSelectUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await axios.get("https://code-3oqu.onrender.com/api/admin/users");
        setUsers(res.data);
      } catch (err) {
        console.error("Fetch Users Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">👥 User List</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            &times;
          </button>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading users...</p>
        ) : users.length === 0 ? (
          <p className="text-center text-gray-400 italic">No users found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {users.map((u) => (
              <div
                key={u._id}
                onClick={() => onSelectUser(u)}
                className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.photoURL || "/avatar.png"}
                    alt={u.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-800">{u.name || "No Name"}</p>
                    <p className="text-sm text-gray-500">{u.email}</p>
                  </div>
                </div>
                <p className="text-sm mt-2 text-gray-600">
                  Files Uploaded: <strong>{u.files?.length || 0}</strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const UserDetailView = ({ user, onBack }) => {
  return (
    <div className="p-4">
      <button onClick={onBack} className="flex items-center text-blue-600 mb-4">
        <FiChevronLeft className="mr-1" /> Back
      </button>
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center gap-4 mb-4">
          <img
            src={user.photoURL || "/avatar.png"}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover"
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{user.name}</h2>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>

        <h3 className="font-medium text-gray-700 mb-2">Uploaded Files</h3>
        <div className="space-y-3">
          {(user.files || []).map((f, idx) => (
            <div key={idx} className="border p-3 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {f.docType}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Status:</span>{" "}
                <span
                  className={`font-medium px-2 py-1 rounded-full text-xs ${
                    f.status === "Completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {f.status}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Uploaded:</span> {new Date(f.uploadedAt).toLocaleDateString()}
              </p>
              {f.fileUrl && (
                <a
                  href={f.fileUrl}
                  className="text-blue-600 hover:underline text-xs mt-2 inline-block"
                  download
                >
                  📎 Download File
                </a>
              )}
              {f.adminFileUrl && (
                <a
                  href={f.adminFileUrl}
                  className="text-purple-600 hover:underline text-xs ml-3 inline-block"
                  download
                >
                  🔐 Admin File
                </a>
              )}
              {f.adminMessage && (
                <p className="text-xs text-gray-500 mt-1">
                  💬 <em>{f.adminMessage}</em>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export { UserListModal, UserDetailView };
