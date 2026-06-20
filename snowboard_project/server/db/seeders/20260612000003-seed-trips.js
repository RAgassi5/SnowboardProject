'use strict';

const TRIPS = [
  { user_id: 1, resort_id: 1, start_date: '2025-02-10', end_date: '2025-02-15', privacy: 'public', max_members: null },
  { user_id: 2, resort_id: 3, start_date: '2025-03-01', end_date: '2025-03-07', privacy: 'public', max_members: null },
  { user_id: 3, resort_id: 5, start_date: '2025-01-20', end_date: '2025-01-25', privacy: 'public', max_members: null },
  { user_id: 1, resort_id: 4, start_date: '2025-04-05', end_date: '2025-04-10', privacy: 'public', max_members: null },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const existing = await queryInterface.sequelize.query(
      'SELECT user_id, resort_id, start_date FROM trips',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingKeys = new Set(
      existing.map(t => `${t.user_id}:${t.resort_id}:${String(t.start_date).slice(0, 10)}`)
    );

    const toInsert = TRIPS
      .filter(t => !existingKeys.has(`${t.user_id}:${t.resort_id}:${t.start_date}`))
      .map(t => ({ ...t, created_at: now, updated_at: now }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('trips', toInsert);
    }
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('trips', null, {});
  }
};
