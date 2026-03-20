const jwt = require("jsonwebtoken");

module.exports = (db) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers["authorization"];
      const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({ error: "Token required" });
      }

      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
          if (err) return reject(err);
          resolve(decoded);
        });
      });

      const phone = decoded.phone;

      // Check token in database
      const rows = await db.query(
        "SELECT * FROM employees WHERE phone = ? AND token = ?",
        [phone, token]
      );

      if (rows.length === 0) {
        return res
          .status(403)
          .json({ error: "Token not found in database" });
      }

      // Attach decoded info to request
      req.decoded = decoded;
      next();
    } catch (err) {
      if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(403).json({ error: "Invalid or expired token" });
      }
      console.error("Auth middleware error:", err);
      res.status(500).json({ error: "Server error" });
    }
  };
};
