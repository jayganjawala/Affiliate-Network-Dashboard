"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("WithdrawalRequests", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      requestedAmount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      approvalStatus: {
        type: Sequelize.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
      },
      approvedByEmployeeId: {
        type: Sequelize.INTEGER,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      withdrawalMethod: { type: Sequelize.STRING },
      transactionId: {
        type: Sequelize.STRING,
        unique: true,
      },
      approvedAt: { type: Sequelize.DATE },
      reason: { type: Sequelize.STRING },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("WithdrawalRequests");
  },
};
