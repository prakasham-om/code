const User = require('../model/User');

// 📌 GET users filtered by date or search
exports.getUsers = async (req, res) => {
  const { date, search } = req.query;

  let filter = {};
  if (date) filter['createdAt'] = { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 86400000) };
  if (search) {
    filter['$or'] = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  try {
    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
};

// 📌 PUT: Admin update single file inside user's files[]
exports.updateUserFile = async (req, res) => {
  const { userId, fileIndex } = req.params;
  const { adminFileUrl, adminMessage, status } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user || !user.files[fileIndex]) return res.status(404).json({ message: "File not found" });

    if (adminFileUrl) user.files[fileIndex].adminFileUrl = adminFileUrl;
    if (adminMessage) user.files[fileIndex].adminMessage = adminMessage;
    if (status) user.files[fileIndex].status = status;

    await user.save();
    res.json({ message: "File updated", file: user.files[fileIndex] });
  } catch (err) {
    res.status(500).json({ message: "Error updating file", error: err });
  }
};

// 📌 GET: Revenue + task summary
exports.getSummary = async (req, res) => {
  try {
    const users = await User.find({});
    let totalUsers = users.length;
    let completed = 0;

    users.forEach(user => {
      user.files.forEach(file => {
        if (file.status === "Completed") completed++;
      });
    });

    res.json({
      totalUsers,
      completedTasks: completed,
      revenue: completed * 50,
    });
  } catch (err) {
    res.status(500).json({ message: "Error generating summary", error: err });
  }
};
exports.deleteUserFile = async (req, res) => {
  const { userId, fileIndex } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (fileIndex < 0 || fileIndex >= user.files.length) {
      return res.status(400).json({ error: "Invalid file index" });
    }

    // Remove the file from the array
    const deletedFile = user.files.splice(fileIndex, 1)[0];
    await user.save();

    res.json({ 
      message: "File deleted successfully",
      deletedFile
    });
  } catch (err) {
    console.error("File deletion error:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
};

// ADMIN: Delete a user and all their files
exports.deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      message: "User deleted successfully",
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error("User deletion error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
};

// ADMIN: Delete a specific file from all users (optional)
exports.deleteFileType = async (req, res) => {
  const { docType } = req.params;

  try {
    const result = await User.updateMany(
      { "files.docType": docType },
      { $pull: { files: { docType } } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "No files of this type found" });
    }

    res.json({
      message: `Deleted all ${docType} files`,
      deletedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("File type deletion error:", err);
    res.status(500).json({ error: "Failed to delete file type" });
  }
};
