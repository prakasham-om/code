const express = require("express");
const router = express.Router();
const multer = require("multer");
const { multerStorage } = require("../util/cloudnary");
const { uploadFiles, getUserUploads } = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");

const upload = multer({ storage: multer.memoryStorage() });
router.post("/upload", upload.array("files"), uploadFiles);
router.get("/uploads",  getUserUploads);

module.exports = router;