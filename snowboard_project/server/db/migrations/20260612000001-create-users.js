'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:           { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      first_name:   { type: Sequelize.STRING(100), allowNull: false },
      last_name:    { type: Sequelize.STRING(100), allowNull: false },
      email:        { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password:     { type: Sequelize.STRING(255), allowNull: false },
      sport_type:   { type: Sequelize.ENUM('ski', 'snowboard'), allowNull: false },
      skill_level:  { type: Sequelize.INTEGER, allowNull: false },
      user_role:    { type: Sequelize.ENUM('admin', 'manager', 'user'), allowNull: false, defaultValue: 'user' },
      created_at:   { type: Sequelize.DATE, allowNull: false },
      updated_at:   { type: Sequelize.DATE, allowNull: false }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
