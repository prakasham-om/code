import React, { useState, useEffect, useRef } from "react";
import { getAuth } from "firebase/auth";
import { app } from "../../firebase.config";
import { motion } from "framer-motion";
import ChatBox from "../ChatBox";
import axios from "axios";

const cardOptions = [
  "Aadhar Card",
  "PAN Card",
  "Voter ID",
  "Driving License",
  "Color Print",
  "Online Job Apply",
  "Vehicle RC",
];

const UserDashboard = () => {
  const auth = getAuth(app);
  const user = auth.currentUser;

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [docType, setDocType] = useState("");
  const [pdfPassword, setPdfPassword] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [udCardNo, setUdCardNo] = useState("");
  const [uploads, setUploads] = useState([]);
  const [adminUploads, setAdminUploads] = useState([]);
  const [showChat, setShowChat] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    console.log("Files selected:", files);
  };

  const handleUpload = async () => {
    if (!docType) return alert("Please select a card type");
    if (docType !== "Vehicle RC" && selectedFiles.length === 0)
      return alert("Please upload at least one file");
    if (docType === "Vehicle RC" && (!vehicleNo || !udCardNo))
      return alert("Enter vehicle and UD card numbers");

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));
    formData.append("docType", docType);
    formData.append("email", user.email);
    formData.append("displayName", user.displayName);
    formData.append("password", pdfPassword);
    formData.append("vehicleNo", vehicleNo);
    formData.append("udCardNo", udCardNo);
    console.log(user.email, user.displayName);

    try {
      // ✅ Get Firebase ID token
      const token = await user.getIdToken();

      const res = await axios.post("http://localhost:5000/api/users/upload", formData);

      setUploads((prev) => [...prev, ...res.data.uploads]);
      alert("Uploaded successfully");
    } catch (error) {
      alert("Upload failed");
      console.error("Upload error:", error);
    }

    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = null;
    setDocType("");
    setPdfPassword("");
    setVehicleNo("");
    setUdCardNo("");
  };

  useEffect(() => {
    setAdminUploads([
      {
        fileName: "rc_confirmation.pdf",
        type: "Vehicle RC",
        date: "2025-06-19",
        message: "RC Print Completed ✅",
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 bg-gradient-to-b from-white to-blue-50 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-lg sm:text-xl font-semibold text-blue-800">
            Hello, {user?.displayName || "User"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 break-words max-w-full truncate sm:max-w-[250px]">
            {user?.email}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          className="hidden sm:inline-flex bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm shadow"
          onClick={() => setShowChat(true)}
        >
          Chat with Admin
        </motion.button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6 space-y-3">
        <h2 className="text-base sm:text-lg font-semibold text-blue-700">Upload a New Document</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            className="border p-2 rounded text-sm"
          >
            <option value="">-- Select Document Type --</option>
            {cardOptions.map((card) => (
              <option key={card} value={card}>
                {card}
              </option>
            ))}
          </select>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            disabled={docType === "Vehicle RC"}
            onChange={handleFileChange}
            className={`border p-2 rounded text-sm ${
              docType === "Vehicle RC" ? "bg-gray-100 cursor-not-allowed" : ""
            }`}
          />
        </div>

        {docType !== "Vehicle RC" && (
          <input
            type="text"
            placeholder="PDF Password (optional)"
            value={pdfPassword}
            onChange={(e) => setPdfPassword(e.target.value)}
            className="border p-2 w-full rounded text-sm"
          />
        )}

        {docType === "Vehicle RC" && (
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Vehicle Number"
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value)}
              className="border p-2 rounded text-sm"
            />
            <input
              type="text"
              placeholder="UD Card Number"
              value={udCardNo}
              onChange={(e) => setUdCardNo(e.target.value)}
              className="border p-2 rounded text-sm"
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Upload
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="text-base sm:text-lg font-semibold text-blue-700 mb-2">Your Uploads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-left">
            <thead className="text-gray-600 border-b">
              <tr>
                <th className="py-2 px-2">Type</th>
                <th className="py-2 px-2">File</th>
                <th className="py-2 px-2">Date</th>
                <th className="py-2 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {uploads.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-gray-400 py-4 italic">
                    No uploads yet.
                  </td>
                </tr>
              ) : (
                uploads.map((u, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2 px-2">{u.docType}</td>
                    <td className="py-2 px-2">{u.fileName}</td>
                    <td className="py-2 px-2">{u.date}</td>
                    <td className="py-2 px-2 text-green-700">{u.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="text-base sm:text-lg font-semibold text-blue-700 mb-3">Files Shared by Admin</h2>
        {adminUploads.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No admin uploads yet.</p>
        ) : (
          <ul className="space-y-4">
            {adminUploads.map((file, idx) => (
              <li
                key={idx}
                className="p-3 border rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="text-sm">
                  <h4 className="font-medium text-gray-800">{file.fileName}</h4>
                  <p className="text-xs text-gray-500">
                    Type: {file.type} • Date: {file.date}
                  </p>
                  <p className="text-xs text-gray-600 mt-1 italic">
                    {file.message || "No message"}
                  </p>
                </div>
                <a
                  href={file.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 w-full sm:w-auto text-center"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="fixed bottom-4 right-4 sm:hidden">
        <motion.button
          whileHover={{ scale: 1.1 }}
          className="bg-green-600 text-white px-4 py-2 rounded-full shadow-md text-xs"
          onClick={() => setShowChat(true)}
        >
          Chat with Admin
        </motion.button>
      </div>

      {showChat && <ChatBox onClose={() => setShowChat(false)} />}
    </div>
  );
};

export default UserDashboard;
