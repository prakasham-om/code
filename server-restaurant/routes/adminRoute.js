const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");

router.get("/admin/users", adminController.getUsers); // ?date=2025-06-19&search=alice
router.put("/admin/user/:userId/file/:fileIndex", adminController.updateUserFile);
router.get("/admin/summary", adminController.getSummary); // For revenue/summary data

module.exports = router;
