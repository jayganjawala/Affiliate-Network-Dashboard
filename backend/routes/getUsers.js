const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/clients?phone=XXXXXXXXXX
  router.get("/users", async (req, res) => {
    try {
      const { phone } = req.query;

      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Valid 10-digit phone number is required",
        });
      }

      // 1. Find employee by phone
      const [employee] = await db.query(
        `SELECT id, phone, name
         FROM employees
         WHERE phone = ?
         LIMIT 1`,
        [phone],
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: "No employee found with this phone number",
        });
      }

      // 2. Fetch clients for this employee
      const users = await db.query(
        `SELECT
          id,
          employeeId,
          prefix,
          fullName,
          phone,
          email,
          dealAmount,
          status,
          source,
          isConverted,
          reviewedByEmployeeId,
          reviewedAt,
          removedByEmployeeId,
          createdAt,
          updatedAt
        FROM users
        WHERE employeeId = ?
        ORDER BY createdAt DESC
        LIMIT 100`,
        [employee.id],
      );

      // 3. Optional: count total clients or calculate other stats if needed
      const usersCount = users.length;

      res.status(200).json({
        success: true,
        employee: {
          id: employee.id,
          phone: employee.phone,
          name: employee.name,
        },
        usersCount,
        users,
      });
    } catch (err) {
      console.error("Clients API error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  router.post("/users/upload", async (req, res) => {
    try {
      const { phone } = req.query;
      const { leads } = req.body;

      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Valid 10-digit employee phone number is required",
        });
      }

      if (!Array.isArray(leads)) {
        return res.status(400).json({
          success: false,
          error: "Leads array is required",
        });
      }

      // 1. Find employee by phone
      const [employee] = await db.query(
        `SELECT id FROM employees WHERE phone = ? LIMIT 1`,
        [phone],
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: "No employee found with this phone number",
        });
      }

      const employeeId = employee.id;

      let inserted = 0;
      let duplicates = 0;
      const approvedLeads = [];
      const duplicateLeads = [];

      for (const lead of leads) {
        const {
          prefix = null,
          fullName,
          phone: leadPhone,
          email = null,
        } = lead;

        if (!leadPhone || !fullName) continue;

        // 2. Check duplicate in USERS
        const [existing] = await db.query(
          `SELECT id FROM users WHERE phone = ? OR email = ? LIMIT 1`,
          [leadPhone, email],
        );

        if (existing) {
          const reason = email ? "Duplicate Email" : "Duplicate Phone";

          // Insert into temporary leads
          const tempResult = await db.query(
            `INSERT INTO temporaryleads
     (employeeId, prefix, fullName, phone, email, duplicateReason)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [employeeId, prefix, fullName, leadPhone, email, reason],
          );

          duplicates++;

          // Fetch the actual inserted row including createdAt
          const [duplicateRow] = await db.query(
            `SELECT prefix, fullName, phone, email, 'Lead' as status, duplicateReason as reason, createdAt
            FROM temporaryleads
            WHERE id = ?`,
            [tempResult.insertId],
          );

          duplicateLeads.push(duplicateRow);
        } else {
          // Insert into main users table
          const result = await db.query(
            `INSERT INTO users
            (employeeId, prefix, fullName, phone, email, status, isConverted)
            VALUES (?, ?, ?, ?, ?, 'Lead', 0)`,
            [employeeId, prefix, fullName, leadPhone, email],
          );

          inserted++;

          // Fetch the actual inserted row including createdAt
          const [approvedRow] = await db.query(
            `SELECT prefix, fullName, phone, email, status, createdAt
            FROM users
            WHERE id = ?`,
            [result.insertId],
          );

          approvedLeads.push(approvedRow);
        }
      }

      res.status(201).json({
        success: true,
        employeeId,
        inserted,
        duplicates,
        total: leads.length,
        approvedLeads,
        duplicateLeads,
      });
    } catch (err) {
      console.error("Lead upload error:", err);
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  });

  return router;
};
