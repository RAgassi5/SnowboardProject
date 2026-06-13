'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trip_read_status', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'trips', key: 'id' },
        onDelete: 'CASCADE',
      },
      last_read_at: {
        type: Sequelize.DATE(3),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
    await queryInterface.addIndex('trip_read_status', ['user_id', 'trip_id'], { unique: true });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('trip_read_status');
  },
};
