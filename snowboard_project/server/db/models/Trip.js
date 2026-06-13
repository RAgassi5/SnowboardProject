'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define('Trip', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    resortId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    skillLevel: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    sportType: {
      type: DataTypes.ENUM('ski', 'snowboard'),
      allowNull: true
    },
    privacy: {
      type: DataTypes.ENUM('private', 'friends-only', 'public'),
      allowNull: false,
      defaultValue: 'public'
    },
    maxMembers: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'trips',
    underscored: true
  });
};
