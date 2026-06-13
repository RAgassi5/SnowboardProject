'use strict';
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    parseInt(process.env.DB_PORT || '3306'),
    dialect: 'mysql',
    logging: false
  }
);

const User           = require('./models/User')(sequelize);
const Resort         = require('./models/Resort')(sequelize);
const Trip           = require('./models/Trip')(sequelize);
const ResortLocation = require('./models/ResortLocation')(sequelize);
const FriendRequest  = require('./models/FriendRequest')(sequelize);
const Friendship     = require('./models/Friendship')(sequelize);
const TripMember     = require('./models/TripMember')(sequelize);
const TripMessage    = require('./models/TripMessage')(sequelize);
const TripReadStatus = require('./models/TripReadStatus')(sequelize);

// ── Associations ──────────────────────────────────────────────────────────────

User.hasMany(Trip, { foreignKey: 'userId', as: 'createdTrips' });
Trip.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

Resort.hasMany(Trip, { foreignKey: 'resortId' });
Trip.belongsTo(Resort, { foreignKey: 'resortId' });

Resort.hasMany(ResortLocation, { foreignKey: 'resortId' });
ResortLocation.belongsTo(Resort, { foreignKey: 'resortId' });

// Many-to-many: users <-> trips through trip_members
User.belongsToMany(Trip, { through: TripMember, foreignKey: 'userId', as: 'joinedTrips' });
Trip.belongsToMany(User, { through: TripMember, foreignKey: 'tripId', as: 'members' });
Trip.hasMany(TripMember, { foreignKey: 'tripId' });
TripMember.belongsTo(Trip, { foreignKey: 'tripId' });
User.hasMany(TripMember, { foreignKey: 'userId' });
TripMember.belongsTo(User, { foreignKey: 'userId' });

Trip.hasMany(TripMessage, { foreignKey: 'tripId' });
TripMessage.belongsTo(Trip, { foreignKey: 'tripId' });
User.hasMany(TripMessage, { foreignKey: 'userId' });
TripMessage.belongsTo(User, { foreignKey: 'userId' });

TripReadStatus.belongsTo(User, { foreignKey: 'userId' });
TripReadStatus.belongsTo(Trip, { foreignKey: 'tripId' });
User.hasMany(TripReadStatus, { foreignKey: 'userId' });
Trip.hasMany(TripReadStatus, { foreignKey: 'tripId' });

User.hasMany(FriendRequest, { foreignKey: 'senderId', as: 'sentRequests' });
User.hasMany(FriendRequest, { foreignKey: 'receiverId', as: 'receivedRequests' });
FriendRequest.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
FriendRequest.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

User.hasMany(Friendship, { foreignKey: 'user1Id', as: 'friendships1' });
User.hasMany(Friendship, { foreignKey: 'user2Id', as: 'friendships2' });
Friendship.belongsTo(User, { foreignKey: 'user1Id', as: 'user1' });
Friendship.belongsTo(User, { foreignKey: 'user2Id', as: 'user2' });

module.exports = {
  sequelize,
  User,
  Resort,
  Trip,
  ResortLocation,
  FriendRequest,
  Friendship,
  TripMember,
  TripMessage,
  TripReadStatus
};
