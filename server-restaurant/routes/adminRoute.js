const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
// const isAdmin = require("../middleware/isAdmin"); // Import admin middleware

// Get filtered users
router.get("/admin/users",  adminController.getUsers); // ?date=2025-06-19&search=alice

router.put("/admin/user/:userId/file/:fileIndex/complete", adminController.markTaskCompleted);
// Update user file
router.put("/admin/user/:userId/file/:fileIndex",adminController.updateUserFile);

// Get revenue/summary data
router.get("/admin/summary",  adminController.getSummary);

// Delete a specific file from a user
router.delete("/admin/user/:userId/file/:fileIndex", adminController.deleteUserFile);

// Delete a user completely
router.delete("/admin/user/:userId", adminController.deleteUser);

module.exports = router;
