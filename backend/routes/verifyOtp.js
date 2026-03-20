const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

module.exports = (db) => {
  router.post("/verifyOtp", async (req, res) => {
    try {
      const { phone, otpCode } = req.body;

      // Validate inputs
      if (
        !phone ||
        !/^\d{10}$/.test(phone) ||
        !otpCode ||
        !/^\d{6}$/.test(otpCode)
      ) {
        return res.status(400).json({ error: "Invalid phone number or OTP" });
      }

      console.log("Verifying OTP for phoneNumber:", phone, "OTP:", otpCode);

      // Step 1: Verify OTP
      const rows = await db.query(
        "SELECT id FROM employees WHERE phone = ? AND otpCode = ?",
        [phone, otpCode],
      );

      if (rows.length === 0) {
        console.log(
          "No matching employees found for phoneNumber:",
          phone,
          "OTP:",
          otpCode,
        );
        return res.status(401).json({ error: "Invalid OTP" });
      }

      // Step 2: Generate JWT
      const token = jwt.sign({ phone }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Step 3: Update employee record
      await db.query(
        `
        UPDATE employees 
        SET token = ?, otpCode = NULL, updatedAt = NOW() 
        WHERE phone = ?
        `,
        [token, phone],
      );

      console.log("Login successful for phoneNumber:", phone);

      res.status(200).json({
        message: "Login successful",
        token,
      });
    } catch (err) {
      console.error("Verify OTP error:", err);
      res.status(500).json({
        error: "Server error",
        details: err.message,
      });
    }
  });

  return router;
};
