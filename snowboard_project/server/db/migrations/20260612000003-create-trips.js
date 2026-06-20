'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('trips', {
      id:          { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      resort_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'resorts', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title:       { type: Sequelize.STRING(200), allowNull: true },
      start_date:  { type: Sequelize.DATEONLY, allowNull: false },
      end_date:    { type: Sequelize.DATEONLY, allowNull: false },
      skill_level: { type: Sequelize.INTEGER, allowNull: true },
      sport_type:  { type: Sequelize.ENUM('ski', 'snowboard'), allowNull: true },
      privacy:     { type: Sequelize.ENUM('private', 'friends-only', 'public'), allowNull: false, defaultValue: 'public' },
      max_members: { type: Sequelize.INTEGER, allowNull: true },
      created_at:  { type: Sequelize.DATE, allowNull: false },
      updated_at:  { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('trips');
  }
};
