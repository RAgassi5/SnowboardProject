'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('trip_members', 'is_invitation', {
      type:         Sequelize.BOOLEAN,
      allowNull:    false,
      defaultValue: false
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('trip_members', 'is_invitation');
  }
};
