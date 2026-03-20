"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("RolePermissions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      roleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Roles", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      permissionId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Permissions", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      role: {
        type: Sequelize.STRING,
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
    await queryInterface.dropTable("RolePermissions");
  },
};
