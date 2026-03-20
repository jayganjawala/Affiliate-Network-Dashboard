const express = require("express");
const router = express.Router();

module.exports = (db) => {
  // GET /api/payments?phone=XXXXXXXXXX
  router.get("/payments", async (req, res) => {
    try {
      const { phone } = req.query;

      if (!phone || !/^\d{10}$/.test(phone)) {
        return res.status(400).json({
          success: false,
          error: "Valid 10-digit phone number is required",
        });
      }

      // 1️⃣ Find employee
      const employees = await db.query(
        `SELECT id, phone, rolePermissionId, totalBalance,
              commissionPercentage, commissionAmount, createdAt
       FROM employees
       WHERE phone = ?
       LIMIT 1`,
        [phone],
      );

      if (!employees || employees.length === 0) {
        return res.status(404).json({
          success: false,
          error: "No employee found with this phone number",
        });
      }

      const employee = employees[0];

      // 2️⃣ Begin transaction
      await db.query("START TRANSACTION");

      // 3️⃣ Calculate commission ONLY for unapplied payments
      const commissionRows = await db.query(
        `SELECT
          CASE
            WHEN e.commissionPercentage IS NOT NULL THEN
              COALESCE(SUM(p.paidAmount),0) * e.commissionPercentage / 100
            WHEN e.commissionAmount IS NOT NULL THEN
              SUM(
                CASE
                  WHEN p.status = 'Success'
                   AND p.remainingAmount = 0
                   AND p.isPartial = 0
                  THEN 1 ELSE 0
                END
              ) * e.commissionAmount
            ELSE 0
          END AS commissionTotalAmount
       FROM payments p
       JOIN employees e ON e.id = p.employeeId
       WHERE p.employeeId = ?
       AND p.commissionApplied = 0`,
        [employee.id],
      );

      const commissionTotal =
        commissionRows && commissionRows.length > 0
          ? Number(commissionRows[0].commissionTotalAmount || 0)
          : 0;

      // 4️⃣ Deduct commission and mark payments if > 0
      if (commissionTotal > 0) {
        await db.query(
          `UPDATE employees
         SET totalBalance = totalBalance + ?
         WHERE id = ?`,
          [commissionTotal, employee.id],
        );

        await db.query(
          `UPDATE payments
         SET commissionApplied = 1
         WHERE employeeId = ?
         AND commissionApplied = 0`,
          [employee.id],
        );
      }

      // 5️⃣ Commit transaction
      await db.query("COMMIT");

      // 6️⃣ Get payments list
      const payments = await db.query(
        `SELECT 
          p.id,
          p.userId,
          CONCAT(u.prefix, ' ', u.fullName) AS clientName,
          u.phone AS clientPhone,
          u.email AS clientEmail,
          p.paymentMethod,
          p.totalAmount,
          p.paidAmount,
          p.remainingAmount,
          p.isPartial,
          p.status AS paymentStatus,
          p.transactionId,
          p.paymentDate,
          p.createdAt,
          p.updatedAt
       FROM payments p
       LEFT JOIN users u ON p.userId = u.id
       WHERE p.employeeId = ?
       ORDER BY p.createdAt DESC
       LIMIT 100`,
        [employee.id],
      );

      // 7️⃣ Get total paid amount
      const totalsRows = await db.query(
        `SELECT COALESCE(SUM(p.paidAmount),0) AS totalPaidAmount
       FROM payments p
       WHERE p.employeeId = ?`,
        [employee.id],
      );

      const totalPaidAmount =
        totalsRows && totalsRows.length > 0
          ? Number(totalsRows[0].totalPaidAmount)
          : 0;

      // 8️⃣ Get updated totalBalance
      const updatedEmployeeRows = await db.query(
        `SELECT totalBalance FROM employees WHERE id = ?`,
        [employee.id],
      );

      const updatedEmployee =
        updatedEmployeeRows && updatedEmployeeRows.length > 0
          ? updatedEmployeeRows[0]
          : { totalBalance: employee.totalBalance };

      // 9️⃣ Respond
      res.status(200).json({
        success: true,
        employee: {
          id: employee.id,
          phone: employee.phone,
          rolePermissionId: employee.rolePermissionId,
          registeredAt: employee.createdAt,
          commission:
            employee.commissionPercentage !== null
              ? `${employee.commissionPercentage}%`
              : employee.commissionAmount !== null
                ? `${employee.commissionAmount} /Flat`
                : "Not Specified",
          totalBalance: updatedEmployee.totalBalance,
        },
        paymentsCount: payments.length,
        totalPaidAmount,
        commissionTotalAmount: commissionTotal,
        payments,
      });
    } catch (err) {
      // Rollback if something went wrong
      try {
        await db.query("ROLLBACK");
      } catch (_) {}

      console.error("Payments API error:", err);
      res.status(500).json({
        success: false,
        error: "Database error",
      });
    }
  });

  return router;
};
