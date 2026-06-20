'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Friendship', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    user1Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id1'
    },
    user2Id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id2'
    }
  }, {
    tableName: 'friendships',
    underscored: true,
    indexes: [{ unique: true, fields: ['user_id1', 'user_id2'] }]
  });
};
