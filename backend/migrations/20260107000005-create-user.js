"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Users", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      employeeId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      prefix: {
        type: Sequelize.ENUM("Mr", "Mrs", "Miss"),
        allowNull: true,
      },
      fullName: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      phone: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      email: {
        type: Sequelize.STRING,
      },
      dealAmount: {
        type: Sequelize.DECIMAL,
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM("Prospect", "ActiveClient", "Rejected"),
      },
      source: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      isConverted: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      reviewedByEmployeeId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      reviewedAt: {
        allowNull: true,
        type: Sequelize.DATE,
      },
      removedByEmployeeId: {
        allowNull: true,
        type: Sequelize.INTEGER,
        references: { model: "Employees", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
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
    await queryInterface.dropTable("Users");
  },
};
