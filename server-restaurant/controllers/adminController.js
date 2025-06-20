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
