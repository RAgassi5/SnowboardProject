'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'TripReadStatus',
    {
      id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      userId:     { type: DataTypes.INTEGER, allowNull: false },
      tripId:     { type: DataTypes.INTEGER, allowNull: false },
      lastReadAt: { type: DataTypes.DATE,    allowNull: false },
    },
    {
      tableName:  'trip_read_status',
      underscored: true,
      indexes:    [{ unique: true, fields: ['user_id', 'trip_id'] }],
    }
  );
