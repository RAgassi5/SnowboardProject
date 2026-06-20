'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resorts', {
      id:                 { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name:               { type: Sequelize.STRING(150), allowNull: false },
      country:            { type: Sequelize.STRING(100), allowNull: false },
      elevation:          { type: Sequelize.INTEGER, allowNull: true },
      terrain_type:       { type: Sequelize.STRING(50), allowNull: true },
      difficulty_level:   { type: Sequelize.INTEGER, allowNull: false },
      snowboard_friendly: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      latitude:           { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      longitude:          { type: Sequelize.DECIMAL(10, 7), allowNull: true },
      created_at:         { type: Sequelize.DATE, allowNull: false },
      updated_at:         { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('resorts');
  }
};
