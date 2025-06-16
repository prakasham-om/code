// src/pages/Upload.js
import React, { useState } from "react";
import { storage, firestore } from "../firebase.config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { UploadCloud, FileText, Eye, Download } from "lucide-react";

const Upload = () => {
  const user = useSelector((state) => state.user);
  const [pdf, setPdf] = useState(null);
  const [password, setPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState("");
  const [error, setError] = useState("");

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be under 5MB.");
      return;
    }

    setPdf(file);
    setError("");
  };

  const handleUpload = async () => {
    if (!pdf || !user?.email) {
      setError("Please login and select a valid PDF file.");
      return;
    }

    const timestamp = Date.now();
    const filePath = `pdfs/${timestamp}_${pdf.name}`;
    const fileRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(fileRef, pdf);

    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(prog);
      },
      (err) => {
        setUploading(false);
        setError("Upload failed: " + err.message);
      },
      async () => {
        const url = await getDownloadURL(fileRef);
        await setDoc(doc(firestore, "pdfs", `${timestamp}_${user.uid}`), {
          name: pdf.name,
          url,
          email: user.email,
          uid: user.uid,
          uploadedAt: serverTimestamp(),
          ...(password && { password }),
        });
        setDownloadURL(url);
        setUploading(false);
        setPdf(null);
        setPassword("");
        setProgress(0);
        setError("");
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300 p-4">
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-center mb-4 text-blue-800">Upload Your PDF</h2>

        <label className="block mb-3">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="cursor-pointer bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium py-2 px-4 rounded flex items-center gap-2 justify-center"
          >
            <FileText size={18} />
            {pdf ? pdf.name : "Choose PDF"}
          </label>
        </label>

        <input
          type="text"
          placeholder="PDF password (optional)"
          className="w-full p-2 mb-3 rounded border border-blue-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-blue-600 h-3 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full py-2 px-4 rounded text-white font-semibold ${
            uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          } flex items-center justify-center gap-2`}
        >
          <UploadCloud size={18} />
          {uploading ? `Uploading... ${Math.round(progress)}%` : "Upload PDF"}
        </button>

        {downloadURL && (
          <div className="mt-4 space-y-2 text-center">
            <a
              href={downloadURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center items-center gap-2 text-blue-700 hover:underline"
            >
              <Eye size={18} /> Preview
            </a>
            <a
              href={downloadURL}
              download
              className="flex justify-center items-center gap-2 text-green-700 hover:underline"
            >
              <Download size={18} /> Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
