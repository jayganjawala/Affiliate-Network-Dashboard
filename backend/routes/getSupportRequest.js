const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // Get Main and Followup Request
  router.get("/support", async (req, res) => {
    try {
      const { phone } = req.query;

      // 1. Validate phone
      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Valid 10-digit phone number is required",
        });
      }

      // 2. Find employee
      const [employee] = await db.query(
        `
        SELECT id, phone, name, rolePermissionId
        FROM employees
        WHERE phone = ?
        LIMIT 1
        `,
        [phone],
      );

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: "No employee found with this phone number",
        });
      }

      // 3. Fetch Main requests with Followups nested
      const rows = await db.query(
        `
        SELECT 
            s.id,
            s.raisedByEmployeeId,
            e.name AS employeeName,
            s.relatedUserId,
            CONCAT(u.prefix, ' ', u.fullName) AS clientName,
            u.phone AS clientPhone,
            s.reqType,
            s.reqId,
            s.description,
            s.status,
            s.createdAt,
            s.updatedAt
        FROM supportsystems s
        LEFT JOIN users u ON u.id = s.relatedUserId
        LEFT JOIN employees e ON e.id = s.raisedByEmployeeId
        WHERE s.raisedByEmployeeId = ?
        ORDER BY s.createdAt ASC;
        `,
        [employee.id],
      );

      const mainRequests = {};
      rows.forEach((row) => {
        if (row.reqType === "Main") {
          mainRequests[row.id] = {
            id: row.id,
            reqType: row.reqType,
            description: row.description,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            relatedUserId: row.relatedUserId,
            clientName: row.clientName,
            clientPhone: row.clientPhone,
            followups: [],
          };
        } else if (row.reqType === "Followup" && mainRequests[row.reqId]) {
          mainRequests[row.reqId].followups.push({
            id: row.id,
            reqType: row.reqType,
            description: row.description,
            status: row.status,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
          });
        }
      });

      // 5. Calculate Pending & Resolved counts
      let pendingCount = 0;
      let resolvedCount = 0;

      Object.values(mainRequests).forEach((req) => {
        if (req.followups.length === 0) {
          pendingCount++;
        } else {
          const lastFollowup = req.followups[req.followups.length - 1];

          if (lastFollowup.status === "Closed") {
            resolvedCount++;
          } else {
            pendingCount++;
          }
        }
      });

      // 6. Send response
      res.status(200).json({
        success: true,
        employee: {
          id: employee.id,
          phone: employee.phone,
          name: employee.name,
          rolePermissionId: employee.rolePermissionId,
        },
        requestsCount: Object.keys(mainRequests).length,
        pendingCount,
        resolvedCount,
        requests: Object.values(mainRequests),
      });
    } catch (err) {
      console.error("Support API error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  // Insert Followup request
  router.post("/support/followup", async (req, res) => {
    try {
      const { raisedByEmployeeId, relatedUserId, reqId, description, status } =
        req.body;

      // Validate required fields
      if (
        !raisedByEmployeeId ||
        !relatedUserId ||
        !reqId ||
        !description ||
        !status
      ) {
        return res.status(400).json({
          success: false,
          error:
            "raisedByEmployeeId, relatedUserId, reqId (Main request ID), and description, status are required",
        });
      }

      // Insert Followup request
      const result = await db.query(
        `INSERT INTO supportsystems 
        (raisedByEmployeeId, relatedUserId, reqType, reqId, description, status, createdAt, updatedAt)
       VALUES (?, ?, 'Followup', ?, ?, ?, NOW(), NOW())`,
        [raisedByEmployeeId, relatedUserId, reqId, description, status],
      );

      res.status(201).json({
        success: true,
        message: "Followup created",
        followupId: result.insertId,
      });
    } catch (err) {
      console.error("Insert Followup API error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // Updating Followups
  router.put("/support/followup/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { description, status } = req.body;

      if (!description && !status) {
        return res.status(400).json({
          success: false,
          error: "At least one field (description or status) must be provided",
        });
      }

      // Updating Followups
      const [followup] = await db.query(
        "SELECT * FROM supportsystems WHERE id = ? AND reqType = 'Followup'",
        [id],
      );
      if (!followup) {
        return res
          .status(404)
          .json({ success: false, error: "Followup not found" });
      }

      const fields = [];
      const values = [];

      if (description) {
        fields.push("description = ?");
        values.push(description);
      }
      if (status) {
        fields.push("status = ?");
        values.push(status);
      }
      values.push(id);

      await db.query(
        `UPDATE supportsystems SET ${fields.join(", ")}, updatedAt = NOW() WHERE id = ?`,
        values,
      );

      res.json({ success: true, message: "Followup updated" });
    } catch (err) {
      console.error("Update Followup API error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  // Delete Main and Followup Request
  router.delete("/support/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const result = await db.query("DELETE FROM supportsystems WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, error: "Support request not found" });
      }

      res.json({ success: true, message: "Support request deleted" });
    } catch (err) {
      console.error("Delete Support API error:", err);
      res.status(500).json({ success: false, error: "Database error" });
    }
  });

  return router;
};
