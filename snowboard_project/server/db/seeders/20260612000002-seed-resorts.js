'use strict';

const RESORTS = [
  // ── Europe ──────────────────────────────────────────────────────────────────
  { name: 'Zermatt',              country: 'Switzerland', elevation: 3883, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 46.0207000, longitude:   7.7491000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/1_zermatt_evening_2022.jpg/1280px-1_zermatt_evening_2022.jpg' },
  { name: 'Verbier',              country: 'Switzerland', elevation: 3300, terrain_type: 'backcountry', difficulty_level: 5, snowboard_friendly: true,  latitude: 46.0963000, longitude:   7.2282000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Verbier_View.JPG/1280px-Verbier_View.JPG' },
  { name: 'Les Deux Alpes',       country: 'France',      elevation: 3600, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.0139000, longitude:   6.1203000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Les2Alpes.jpg/1280px-Les2Alpes.jpg' },
  { name: 'Mayrhofen',            country: 'Austria',     elevation: 2500, terrain_type: 'park',        difficulty_level: 3, snowboard_friendly: true,  latitude: 47.1667000, longitude:  11.8667000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Mayrhofen_Harakiri-Piste_2.jpg' },
  { name: 'Livigno',              country: 'Italy',       elevation: 2700, terrain_type: 'groomed',     difficulty_level: 2, snowboard_friendly: true,  latitude: 46.5382000, longitude:  10.1365000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Livigno_sera.jpg/1280px-Livigno_sera.jpg' },
  { name: 'Chamonix-Mont-Blanc',  country: 'France',      elevation: 3842, terrain_type: 'backcountry', difficulty_level: 5, snowboard_friendly: true,  latitude: 45.9237000, longitude:   6.8694000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Powder_skiing_in_Chamonix_Mont_Blanc.JPG' },
  { name: 'Val Thorens',          country: 'France',      elevation: 3230, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.2983000, longitude:   6.5800000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/View_of_Val_Thorens_in_the_morning_from_Boismint_1.jpg/1280px-View_of_Val_Thorens_in_the_morning_from_Boismint_1.jpg' },
  { name: 'Courchevel',           country: 'France',      elevation: 2738, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.4156000, longitude:   6.6334000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Courchevel_1850.JPG/1280px-Courchevel_1850.JPG' },
  { name: 'St. Anton am Arlberg', country: 'Austria',     elevation: 2811, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 47.1293000, longitude:  10.2687000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Arlberg_passstrasse.jpg' },
  { name: 'Ischgl',               country: 'Austria',     elevation: 2872, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 47.0137000, longitude:  10.2921000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Ischgl_01.jpg/1280px-Ischgl_01.jpg' },
  { name: 'Kitzbühel',            country: 'Austria',     elevation: 2000, terrain_type: 'mixed',       difficulty_level: 3, snowboard_friendly: true,  latitude: 47.4458000, longitude:  12.3894000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Ski_landscape_in_Kitzbuhel_Austria_%288138357829%29.jpg' },
  { name: 'Cervinia',             country: 'Italy',       elevation: 3480, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 45.9269000, longitude:   7.6319000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/CervinoAug252023_03.jpg/1280px-CervinoAug252023_03.jpg' },
  { name: "Cortina d'Ampezzo",    country: 'Italy',       elevation: 2930, terrain_type: 'mixed',       difficulty_level: 3, snowboard_friendly: true,  latitude: 46.5362000, longitude:  12.1356000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Faloria_Cortina_d%27Ampezzo_10.jpg/1280px-Faloria_Cortina_d%27Ampezzo_10.jpg' },
  // ── North America ───────────────────────────────────────────────────────────
  { name: 'Whistler Blackcomb',   country: 'Canada',      elevation: 2182, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 50.1163000, longitude: -122.9574000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Big_snowdrifts_at_the_top_of_Whistler_Mtn._%2816153313445%29.jpg' },
  { name: 'Vail',                 country: 'USA',         elevation: 3528, terrain_type: 'mixed',       difficulty_level: 4, snowboard_friendly: true,  latitude: 39.6433000, longitude: -106.3781000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Vail_front_side.jpg' },
  { name: 'Park City Mountain',   country: 'USA',         elevation: 3048, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 40.6514000, longitude: -111.5080000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Park_City_overview.jpg' },
  { name: 'Jackson Hole',         country: 'USA',         elevation: 3185, terrain_type: 'backcountry', difficulty_level: 5, snowboard_friendly: true,  latitude: 43.5875000, longitude: -110.8278000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Jackson_hole_new_tram.jpg/1280px-Jackson_hole_new_tram.jpg' },
  { name: 'Breckenridge',         country: 'USA',         elevation: 3962, terrain_type: 'park',        difficulty_level: 3, snowboard_friendly: true,  latitude: 39.4817000, longitude: -106.0665000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Breckenridge_peak_8.JPG' },
  // ── Japan ───────────────────────────────────────────────────────────────────
  { name: 'Niseko United',        country: 'Japan',       elevation: 1308, terrain_type: 'groomed',     difficulty_level: 3, snowboard_friendly: true,  latitude: 42.8009000, longitude: 140.6853000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/2010-02.mt_yotei.jpg' },
  { name: 'Hakuba Valley',        country: 'Japan',       elevation: 2696, terrain_type: 'mixed',       difficulty_level: 3, snowboard_friendly: true,  latitude: 36.6988000, longitude: 137.8628000, image_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Hakuba_Happo-one_Winter_Resort.JPG/1280px-Hakuba_Happo-one_Winter_Resort.JPG' },
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

    // Backfill image_url on rows that already existed before this seeder added images
    // (keeps `npm run db:seed` safe/idempotent to re-run without a destructive db:reset).
    for (const r of RESORTS) {
      await queryInterface.bulkUpdate('resorts', { image_url: r.image_url }, { name: r.name });
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('resorts', null, {});
  }
};
