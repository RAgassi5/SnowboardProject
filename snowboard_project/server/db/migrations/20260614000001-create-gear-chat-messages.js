'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('gear_chat_messages', {
      id:      { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      trip_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'trips', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'users', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      role:       { type: Sequelize.STRING(20), allowNull: false },
      content:    { type: Sequelize.TEXT, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('gear_chat_messages');
  },
};
