const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  docType: { type: String, required: true },              // Aadhar, PAN, RC, etc.
  fileName: { type: String },                             // original file name
  fileUrl: { type: String },                              // uploaded Cloudinary/URL
  password: { type: String },                             // optional PDF password
  vehicleNo: { type: String },                            // for Vehicle RC
  udCardNo: { type: String },                             // for Vehicle RC
  status: { type: String, default: "Pending" },           // Pending / Completed
  uploadedAt: { type: Date, default: Date.now },          // file upload date
  adminMessage: { type: String },                         // admin comment
  adminFileUrl: { type: String },                         // file uploaded by admin
});

const userSchema = new mongoose.Schema({
 // googleId: { type: String, required: true, unique: true },  // from Firebase auth
  name: { type: String },
  email: { type: String, required: true, unique: true },
  photoURL: { type: String },

  files: [fileSchema],     // All uploaded files
}, {
  timestamps: true,
});

module.exports = mongoose.model("User", userSchema);
