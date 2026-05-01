const jwt = require("jsonwebtoken");

const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    console.log("[auth] token received:", token);

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[auth] decoded token payload:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("[auth] token validation failed:", error.message);
    res.status(401).json({ error: "Token is not valid" });
  }
};

module.exports = auth;
