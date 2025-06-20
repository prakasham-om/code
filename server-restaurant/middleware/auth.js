const { getAuth } = require("firebase-admin/auth");
const admin = require("firebase-admin");
admin.initializeApp();

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: "Token missing" });
  try {
    const decoded = await getAuth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "Invalid token" });
  }
};
