'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Users', 'users_ibfk_1');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Users', {
      fields: ['employeeId'],
      type: 'foreign key',
      name: 'users_ibfk_1',
      references: { table: 'employees', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    });
  }
};