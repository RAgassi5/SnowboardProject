'use strict';

const USERS = [
  { first_name: 'Roii',    last_name: 'Agassi', email: 'roii@example.com',    password: 'password123', sport_type: 'snowboard', skill_level: 5, user_role: 'admin'   },
  { first_name: 'Yuval',   last_name: 'Malka',  email: 'yuval@example.com',   password: 'password123', sport_type: 'ski',       skill_level: 3, user_role: 'manager' },
  { first_name: 'Lebron',  last_name: 'James',  email: 'lebron@example.com',  password: 'password123', sport_type: 'snowboard', skill_level: 1, user_role: 'user'    },
  { first_name: 'Michael', last_name: 'Jordan', email: 'michael@example.com', password: 'password123', sport_type: 'ski',       skill_level: 4, user_role: 'user'    },
  { first_name: 'Lior',    last_name: 'Siag',   email: 'lior@example.com',    password: 'password123', sport_type: 'snowboard', skill_level: 3, user_role: 'manager' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const existing = await queryInterface.sequelize.query(
      'SELECT email FROM users',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingEmails = new Set(existing.map(u => u.email));

    const toInsert = USERS
      .filter(u => !existingEmails.has(u.email))
      .map(u => ({ ...u, created_at: now, updated_at: now }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('users', toInsert);
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
