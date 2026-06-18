'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('resorts', 'image_url', {
      type:      Sequelize.STRING(500),
      allowNull: true
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('resorts', 'image_url');
  }
};
