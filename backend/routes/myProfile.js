const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/myprofile?phone=9876543210
  router.get("/myprofile", async (req, res) => {
    try {
      const { phone } = req.query;

      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error:
            "Valid 10-digit phone number is required (example: 9876543210)",
        });
      }

      const query = `
      SELECT 
        e.id,
        e.prefix,
        e.name,
        e.email,
        e.phone,
        e.role,
        e.status,
        e.totalBalance,
        e.commissionPercentage,
        e.commissionAmount,
        e.orgName,
        e.orgPhone,
        e.orgEmail,
        e.orgAddress,
        e.updatedAt,
        -- RM fields
        rm.prefix AS rmPrefix,
        rm.name AS rmName,
        rm.phone AS rmPhone,
        rm.commissionPercentage AS rmCommissionPercentage,
        rm.commissionAmount AS rmCommissionAmount
      FROM employees e
      LEFT JOIN employees rm ON e.rmId = rm.id
      WHERE e.phone = ?
      LIMIT 1
    `;

      const rows = await db.query(query, [phone]);

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No employee found with this phone number",
        });
      }

      const data = rows[0];

      const profile = {
        personalInformation: {
          //   prefix: data.prefix || null,
          //   name: data.name,
          fullName: data.prefix ? `${data.prefix} ${data.name}` : data.name,
          email: data.email || null,
          phone: data.phone,
          id: data.id,
          commission:
            data.commissionPercentage !== null
              ? `${data.commissionPercentage}%`
              : data.commissionAmount !== null
                ? `${data.commissionAmount} /Flat`
                : "Not Specified",
          totalBalance: data.totalBalance,
          updatedAt: data.updatedAt,
        },
        relationshipManager: {
          fullName: data.rmName
            ? data.rmPrefix
              ? `${data.rmPrefix} ${data.rmName}`
              : data.rmName
            : "Not Assigned",
          phone: data.rmPhone || null,
          commission:
            data.rmCommissionPercentage !== null
              ? `${data.rmCommissionPercentage}%`
              : data.rmCommissionAmount !== null
                ? `${data.rmCommissionAmount} /Flat`
                : "Not Specified",
        },
        organization: {
          name: data.orgName || null,
          phone: data.orgPhone || null,
          email: data.orgEmail || null,
          address: data.orgAddress || null,
        },
      };

      res.status(200).json({
        success: true,
        profile,
        // meta: {
        //   role: data.role,
        //   status: data.status,
        //   commissionPercentage: data.commissionPercentage,
        //   commissionAmount: data.commissionAmount
        // }
      });
    } catch (err) {
      console.error("My profile query error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });
  return router;
};
