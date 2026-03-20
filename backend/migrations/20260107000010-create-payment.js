"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payments", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      employeeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Services", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      paymentMethod: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      totalAmount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      paidAmount: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      remainingAmount: { type: Sequelize.DECIMAL },
      isPartial: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      parentPaymentId: {
        type: Sequelize.INTEGER,
        references: { model: "Payments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      status: {
        type: Sequelize.ENUM("Pending", "Approved", "Rejected"),
        allowNull: false,
      },
      transactionId: {
        type: Sequelize.STRING,
        unique: true,
      },
      paymentDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      relatedCommissionId: {
        type: Sequelize.INTEGER,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      relatedWithdrawalRequestId: {
        type: Sequelize.INTEGER,
        references: { model: "WithdrawalRequests", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      paymentProcessedByEmployeeId: {
        type: Sequelize.INTEGER,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      processedAt: { type: Sequelize.DATE },
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
    await queryInterface.dropTable("Payments");
  },
};
