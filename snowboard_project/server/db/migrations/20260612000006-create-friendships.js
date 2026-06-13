'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('friendships', {
      id:         { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id1: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id2: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('friendships', ['user_id1', 'user_id2'], { unique: true, name: 'unique_friendship' });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('friendships');
  }
};
