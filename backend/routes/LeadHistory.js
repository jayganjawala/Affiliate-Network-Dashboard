const express = require("express");
const router = express.Router();

module.exports = (db) => {
  router.get("/leadhistory", async (req, res) => {
    try {
      const { phone } = req.query;

      // Validate phone number
      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Valid 10-digit phone number is required",
        });
      }

      // Fetch employee
      const result = await db.query(
        `SELECT id, phone, createdAt FROM employees WHERE phone = ? LIMIT 1`,
        [phone],
      );

      const employees = Array.isArray(result[0]) ? result[0] : result;

      if (!employees.length) {
        return res.status(404).json({
          success: false,
          error: "No employee found with this phone number",
        });
      }

      const employeeId = employees[0].id;

      // DAILY STATS
      const statsResult = await db.query(
        `
        SELECT
          date,
          SUM(tempLeads) AS tempLeads,
          SUM(approvedLeads) AS approvedLeads,
          SUM(totalClients) AS totalClients,
          (SUM(tempLeads) + SUM(approvedLeads)) AS totalLeads
        FROM (
          SELECT
            DATE_FORMAT(createdAt, '%Y-%m-%d') AS date,
            COUNT(id) AS tempLeads,
            0 AS approvedLeads,
            0 AS totalClients
          FROM temporaryleads
          WHERE employeeId = ?
          GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')

          UNION ALL

          SELECT
            DATE_FORMAT(createdAt, '%Y-%m-%d') AS date,
            0 AS tempLeads,
            COUNT(id) AS approvedLeads,
            COUNT(CASE WHEN status = 'Client' THEN 1 END) AS totalClients
          FROM users
          WHERE employeeId = ?
          GROUP BY DATE_FORMAT(createdAt, '%Y-%m-%d')
        ) AS combined
        GROUP BY date
        ORDER BY date DESC
        `,
        [employeeId, employeeId],
      );

      const dailyRows = Array.isArray(statsResult[0])
        ? statsResult[0]
        : statsResult;

      // SUMMARY
      const summary = dailyRows.reduce(
        (acc, row) => {
          acc.totalLeads += Number(row.totalLeads);
          acc.approvedLeads += Number(row.approvedLeads);
          acc.duplicateLeads += Number(row.tempLeads);
          acc.totalClients += Number(row.totalClients);
          return acc;
        },
        { totalLeads: 0, approvedLeads: 0, duplicateLeads: 0, totalClients: 0 },
      );

      // APPROVED LEADS
      const approvedResult = await db.query(
        `
        SELECT prefix, fullName, phone, email, status,
               DATE_FORMAT(createdAt, '%Y-%m-%d') AS date
        FROM users
        WHERE employeeId = ?
        `,
        [employeeId],
      );

      const approvedLeads = Array.isArray(approvedResult[0])
        ? approvedResult[0]
        : approvedResult;

      // DUPLICATE LEADS
      const duplicateResult = await db.query(
        `
        SELECT prefix, fullName, phone, email, status,
               DATE_FORMAT(createdAt, '%Y-%m-%d') AS date
        FROM temporaryleads
        WHERE employeeId = ?
        `,
        [employeeId],
      );

      const duplicateLeads = Array.isArray(duplicateResult[0])
        ? duplicateResult[0]
        : duplicateResult;

      // Response
      res.status(200).json({
        success: true,
        employeePhone: phone,
        summary,
        dailyStats: dailyRows.map((row) => ({
          date: row.date,
          totalLeads: Number(row.totalLeads),
          duplicateLeads: Number(row.tempLeads),
          approvedLeads: Number(row.approvedLeads),
          totalClients: Number(row.totalClients),

          approvedLeadsData: approvedLeads.filter(
            (lead) => lead.date === row.date,
          ),

          duplicateLeadsData: duplicateLeads.filter(
            (lead) => lead.date === row.date,
          ),
        })),
      });
    } catch (err) {
      console.error("Lead history error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  return router;
};
