'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('friend_requests', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      sender_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      receiver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status:      { type: Sequelize.ENUM('pending', 'accepted', 'rejected'), allowNull: false, defaultValue: 'pending' },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('friend_requests', ['sender_id', 'receiver_id'], { unique: true, name: 'unique_friend_request' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('friend_requests');
  }
};
