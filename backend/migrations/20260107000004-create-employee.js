"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Employees", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      rolePermissionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "RolePermissions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      prefix: {
        type: Sequelize.ENUM("Mr", "Mrs", "Miss"),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false,
      },
      dateOfBirth: { type: Sequelize.DATEONLY },
      address: { type: Sequelize.STRING },
      status: {
        type: Sequelize.ENUM("Active", "Inactive", "Suspended"),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      totalBalance: { type: Sequelize.DECIMAL },
      otpCode: { type: Sequelize.STRING },
      token: { type: Sequelize.STRING },
      commissionPercentage: {
        type: Sequelize.DECIMAL,
        allowNull: false,
      },
      commissionAmount: {
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
      approvedAt: { type: Sequelize.DATE },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Employees");
  },
};
