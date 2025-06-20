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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#dde6f2] to-[#e5f1fd] px-4">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/30 shadow-2xl rounded-3xl p-8 relative">
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gradient-to-tr from-blue-500 to-blue-800 text-white p-4 rounded-full shadow-lg">
          <UploadCloud size={28} />
        </div>

        <h2 className="text-2xl font-bold text-center text-blue-900 mt-6 mb-6 tracking-tight">
          Upload Your PDF
        </h2>

        {/* File Upload */}
        <div className="mb-4">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="block w-full text-center py-3 rounded-xl bg-white shadow-inner cursor-pointer hover:bg-blue-100 border border-blue-300 text-blue-900 font-medium"
          >
            {pdf ? (
              <span className="flex items-center justify-center gap-2">
                <FileText size={18} /> {pdf.name}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <FileText size={18} /> Choose PDF File
              </span>
            )}
          </label>
        </div>

        {/* Password Field */}
        <div className="relative mb-4">
          <input
            type="text"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/70 rounded-lg border border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder=" "
          />
          <label
            htmlFor="password"
            className="absolute top-1 left-3 text-blue-700 text-sm bg-white/70 px-1 transition-all duration-200 pointer-events-none"
          >
            PDF Password (optional)
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 font-medium mb-3 text-center">{error}</div>
        )}

        {/* Progress Bar */}
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full py-3 rounded-xl font-bold shadow-md text-white flex items-center justify-center gap-2 transition-all duration-300 ${
            uploading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-tr from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900"
          }`}
        >
          <UploadCloud size={20} />
          {uploading ? `Uploading... ${Math.round(progress)}%` : "Upload PDF"}
        </button>

        {/* Success View */}
        {downloadURL && (
          <div className="mt-6 text-center space-y-2 animate-fade-in">
            <a
              href={downloadURL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex justify-center items-center gap-2 text-blue-800 hover:underline"
            >
              <Eye size={18} /> Preview PDF
            </a>
            <a
              href={downloadURL}
              download
              className="flex justify-center items-center gap-2 text-green-800 hover:underline"
            >
              <Download size={18} /> Download PDF
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;
