"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("TemporaryLeads", {
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
      prefix: {
        type: Sequelize.ENUM("Mr", "Mrs", "Miss"),
        allowNull: true,
      },
      fullName: { type: Sequelize.STRING },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: { type: Sequelize.STRING },
      dealAmount: { type: Sequelize.DECIMAL },
      duplicateReason: { type: Sequelize.STRING },
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
    await queryInterface.dropTable("TemporaryLeads");
  },
};
