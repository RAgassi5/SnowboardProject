const resorts = [
  {
    resortId: 1,
    name: "Zermatt",
    country: "Switzerland",
    elevation: 3883,
    terrainType: "mixed",
    difficultyLevel: 4,           // Expert (Advanced/Black Diamonds)
    snowboardFriendly: true,      // Glacier terrain, minimal flat sections
    latitude: 46.0207,
    longitude: 7.7491
  },
  {
    resortId: 2,
    name: "Verbier",
    country: "Switzerland",
    elevation: 3300,
    terrainType: "backcountry",
    difficultyLevel: 5,           // Pro/Freeride (Off-piste/Extreme terrain)
    snowboardFriendly: true,      // Famous powder bowls, backcountry access
    latitude: 46.0963,
    longitude: 7.2282
  },
  {
    resortId: 3,
    name: "Les Deux Alpes",
    country: "France",
    elevation: 3600,
    terrainType: "groomed",
    difficultyLevel: 3,           // Intermediate (Confident on Red/Blue)
    snowboardFriendly: true,      // Good mix of pistes, well-maintained snowpark
    latitude: 45.0139,
    longitude: 6.1203
  },
  {
    resortId: 4,
    name: "Mayrhofen",
    country: "Austria",
    elevation: 2500,
    terrainType: "park",
    difficultyLevel: 3,           // Intermediate (Confident on Red/Blue)
    snowboardFriendly: true,      // Dedicated snowpark, good freestyle terrain
    latitude: 47.1667,
    longitude: 11.8667
  },
  {
    resortId: 5,
    name: "Livigno",
    country: "Italy",
    elevation: 2700,
    terrainType: "groomed",
    difficultyLevel: 2,           // Novice (Green/Easy Blue)
    snowboardFriendly: false,     // Long flat cat-tracks between sectors
    latitude: 46.5382,
    longitude: 10.1365
  }
];

module.exports = resorts;
