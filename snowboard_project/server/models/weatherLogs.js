// Mock weather forecast logs — one entry per day, per resort
const weatherLogs = [
  // Resort 1 — Zermatt
  { logId: 1,  resortId: 1, date: "2025-02-10", snowfall: 12, temperatureCelsius: -8,  windSpeedKph: 25 },
  { logId: 2,  resortId: 1, date: "2025-02-11", snowfall: 5,  temperatureCelsius: -6,  windSpeedKph: 18 },
  { logId: 3,  resortId: 1, date: "2025-02-12", snowfall: 0,  temperatureCelsius: -4,  windSpeedKph: 10 },

  // Resort 2 — Verbier
  { logId: 4,  resortId: 2, date: "2025-02-10", snowfall: 8,  temperatureCelsius: -10, windSpeedKph: 30 },
  { logId: 5,  resortId: 2, date: "2025-02-11", snowfall: 15, temperatureCelsius: -12, windSpeedKph: 35 },
  { logId: 6,  resortId: 2, date: "2025-02-12", snowfall: 3,  temperatureCelsius: -9,  windSpeedKph: 20 },

  // Resort 3 — Les Deux Alpes
  { logId: 7,  resortId: 3, date: "2025-02-10", snowfall: 20, temperatureCelsius: -5,  windSpeedKph: 15 },
  { logId: 8,  resortId: 3, date: "2025-02-11", snowfall: 10, temperatureCelsius: -3,  windSpeedKph: 12 },
  { logId: 9,  resortId: 3, date: "2025-02-12", snowfall: 0,  temperatureCelsius: -1,  windSpeedKph: 8  },

  // Resort 4 — Mayrhofen
  { logId: 10, resortId: 4, date: "2025-02-10", snowfall: 6,  temperatureCelsius: -7,  windSpeedKph: 22 },
  { logId: 11, resortId: 4, date: "2025-02-11", snowfall: 0,  temperatureCelsius: -5,  windSpeedKph: 14 },
  { logId: 12, resortId: 4, date: "2025-02-12", snowfall: 2,  temperatureCelsius: -3,  windSpeedKph: 10 },

  // Resort 5 — Livigno
  { logId: 13, resortId: 5, date: "2025-02-10", snowfall: 4,  temperatureCelsius: -6,  windSpeedKph: 12 },
  { logId: 14, resortId: 5, date: "2025-02-11", snowfall: 0,  temperatureCelsius: -4,  windSpeedKph: 9  },
  { logId: 15, resortId: 5, date: "2025-02-12", snowfall: 7,  temperatureCelsius: -8,  windSpeedKph: 20 }
];

module.exports = weatherLogs;
