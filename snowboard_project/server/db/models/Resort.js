'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Resort', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    elevation: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    terrainType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    difficultyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    snowboardFriendly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    }
  }, {
    tableName: 'resorts',
    underscored: true
  });
};
