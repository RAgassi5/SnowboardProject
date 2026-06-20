'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('resort_locations', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      resort_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'resorts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name:        { type: Sequelize.STRING(150), allowNull: false },
      type:        { type: Sequelize.ENUM('lift', 'slope', 'restaurant', 'park', 'rental'), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('resort_locations');
  }
};
