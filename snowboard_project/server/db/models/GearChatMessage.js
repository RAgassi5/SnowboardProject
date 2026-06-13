'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define('GearChatMessage', {
    id:      { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
    tripId:  { type: DataTypes.INTEGER, allowNull: false },
    userId:  { type: DataTypes.INTEGER, allowNull: false },
    role:    { type: DataTypes.STRING(20), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
  }, {
    tableName: 'gear_chat_messages',
    underscored: true,
  });
