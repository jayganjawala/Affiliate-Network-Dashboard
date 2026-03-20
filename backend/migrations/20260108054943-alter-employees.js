'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Employees', 'notes', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });

    await queryInterface.changeColumn('Employees', 'address', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('Employees', 'address', {
      type: Sequelize.STRING,
      allowNull: false
    });

    await queryInterface.removeColumn('Employees', 'notes');
  }
};