'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trip_members', {
      id:      { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      trip_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'trips', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status:     { type: Sequelize.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('trip_members', ['trip_id', 'user_id'], { unique: true, name: 'unique_trip_member' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('trip_members');
  }
};
