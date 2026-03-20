const express = require("express");
const router = express.Router();

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = (db) => {
  router.post("/sendOtp", async (req, res) => {
    try {
      const { phone } = req.body;

      if (!phone || !/^\d{10}$/.test(phone)) {
        return res
          .status(400)
          .json({ error: "Invalid phone number. Must be 10 digits." });
      }

      const otp = 121212;
      // const otp = generateOtp(); // use this when ready

      const existingEmployees = await db.query(
        "SELECT id FROM employees WHERE phone = ?",
        [phone],
      );

      if (existingEmployees.length > 0) {
        // Update OTP
        await db.query(
          "UPDATE employees SET otpCode = ?, updatedAt = NOW() WHERE phone = ?",
          [otp, phone],
        );
      } else {
        // Insert new employee
        await db.query(
          `
          INSERT INTO employees 
            (rolePermissionId, phone, otpCode, createdAt, updatedAt)
          VALUES 
            (2, ?, ?, NOW(), NOW())
          `,
          [phone, otp],
        );
      }

      console.log(`OTP for ${phone}: ${otp}`);

      res.status(200).json({ message: "OTP sent successfully" });
    } catch (err) {
      console.error("Send OTP error:", err);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
};
