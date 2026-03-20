"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Services", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      description: { type: Sequelize.TEXT },
      userId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: "Users",
          key: "id",
        },
      },
      assignedByEmployeeId: {
        type: Sequelize.INTEGER,
        references: {
          model: "Employees",
          key: "id",
        },
      },
      basePrice: {
        allowNull: false,
        type: Sequelize.DECIMAL,
      },
      agreedPrice: { type: Sequelize.DECIMAL },
      startDate: { type: Sequelize.DATE },
      endDate: { type: Sequelize.DATE },
      status: {
        type: Sequelize.ENUM("Active", "Inactive", "Completed"),
        allowNull: false,
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
    await queryInterface.dropTable("Services");
  },
};
