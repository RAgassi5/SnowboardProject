'use strict';

const RESORTS = [
  // ── Europe ──────────────────────────────────────────────────────────────────
  { name: 'Zermatt',              country: 'Switzerland', elevation: 3883, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 46.0207000, longitude:   7.7491000 },
  { name: 'Verbier',              country: 'Switzerland', elevation: 3300, terrain_type: 'backcountry', difficulty_level: 5, snowboard_friendly: true,  latitude: 46.0963000, longitude:   7.2282000 },
  { name: 'Les Deux Alpes',       country: 'France',      elevation: 3600, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.0139000, longitude:   6.1203000 },
  { name: 'Mayrhofen',            country: 'Austria',     elevation: 2500, terrain_type: 'park',        difficulty_level: 3, snowboard_friendly: true,  latitude: 47.1667000, longitude:  11.8667000 },
  { name: 'Livigno',              country: 'Italy',       elevation: 2700, terrain_type: 'groomed',     difficulty_level: 2, snowboard_friendly: true,  latitude: 46.5382000, longitude:  10.1365000 },
  { name: 'Chamonix-Mont-Blanc',  country: 'France',      elevation: 3842, terrain_type: 'backcountry', difficulty_level: 5, snowboard_friendly: true,  latitude: 45.9237000, longitude:   6.8694000 },
  { name: 'Val Thorens',          country: 'France',      elevation: 3230, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.2983000, longitude:   6.5800000 },
  { name: 'Courchevel',           country: 'France',      elevation: 2738, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.4156000, longitude:   6.6334000 },
  { name: 'St. Anton am Arlberg', country: 'Austria',     elevation: 2811, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 47.1293000, longitude:  10.2687000 },
  { name: 'Ischgl',               country: 'Austria',     elevation: 2872, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 47.0137000, longitude:  10.2921000 },
  { name: 'Kitzbühel',            country: 'Austria',     elevation: 2000, terrain_type: 'mixed',       difficulty_level: 3, snowboard_friendly: true,  latitude: 47.4458000, longitude:  12.3894000 },
  { name: 'Cervinia',             country: 'Italy',       elevation: 3480, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.9269000, longitude:   7.6319000 },
  { name: "Cortina d'Ampezzo",    country: 'Italy',       elevation: 2930, terrain_type: 'mixed',       difficulty_level: 3, snowboard_friendly: true,  latitude: 46.5362000, longitude:  12.1356000 },
  // ── North America ───────────────────────────────────────────────────────────
  { name: 'Whistler Blackcomb',   country: 'Canada',      elevation: 2182, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 50.1163000, longitude: -122.9574000 },
  { name: 'Vail',                 country: 'USA',         elevation: 3528, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 39.6433000, longitude: -106.3781000 },
  { name: 'Park City Mountain',   country: 'USA',         elevation: 3048, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 40.6514000, longitude: -111.5080000 },
  { name: 'Jackson Hole',         country: 'USA',         elevation: 3185, terrain_type: 'backcountry', difficulty_level: 5, snowboard_friendly: true,  latitude: 43.5875000, longitude: -110.8278000 },
  { name: 'Breckenridge',         country: 'USA',         elevation: 3962, terrain_type: 'park',        difficulty_level: 3, snowboard_friendly: true,  latitude: 39.4817000, longitude: -106.0665000 },
  // ── Japan ───────────────────────────────────────────────────────────────────
  { name: 'Niseko United',        country: 'Japan',       elevation: 1308, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 42.8009000, longitude: 140.6853000 },
  { name: 'Hakuba Valley',        country: 'Japan',       elevation: 2696, terrain_type: 'mixed',       difficulty_level: 3, snowboard_friendly: true,  latitude: 36.6988000, longitude: 137.8628000 },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const existing = await queryInterface.sequelize.query(
      'SELECT name FROM resorts',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingNames = new Set(existing.map(r => r.name));

    const toInsert = RESORTS
      .filter(r => !existingNames.has(r.name))
      .map(r => ({ ...r, created_at: now, updated_at: now }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('resorts', toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('resorts', null, {});
  }
};
