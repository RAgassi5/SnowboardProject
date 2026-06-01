/**
 * Gear Recommendation Data
 *
 * Keyed by sportType → skillLevel (integer 1–5).
 * Returns a list of recommended gear items for that combination.
 */

const GEAR_MAP = {
  snowboard: {
    1: [
      "Rental soft-flex all-mountain snowboard (short length)",
      "Step-in or beginner strap bindings",
      "UV400 polarized goggles",
      "Wrist guards (essential for first-timers)",
      "Padded impact shorts",
      "Helmet (mandatory)"
    ],
    2: [
      "Beginner all-mountain snowboard (soft-medium flex)",
      "Strap bindings with easy highback adjustment",
      "Polarized goggles with anti-fog lens",
      "Moisture-wicking base layer",
      "Insulated waterproof jacket & pants",
      "Helmet"
    ],
    3: [
      "All-mountain snowboard (medium flex)",
      "Responsive strap bindings",
      "Polarized goggles with interchangeable lens",
      "Merino wool base layer",
      "Insulated waterproof outerwear",
      "Helmet",
      "Carving / freestyle boots (stiff enough for edge control)"
    ],
    4: [
      "Directional all-mountain / freeride board",
      "Stiff performance bindings",
      "Photochromic polarized goggles",
      "Technical layered outerwear (Gore-Tex)",
      "Avalanche awareness kit (beacon, probe, shovel) for off-piste excursions",
      "High-performance helmet with MIPS"
    ],
    5: [
      "Directional freeride / splitboard (powder-specific rocker)",
      "Stiff touring-compatible bindings",
      "Photochromic polarized goggles",
      "Avalanche beacon, probe & shovel (mandatory for off-piste)",
      "Airbag backpack",
      "Technical Gore-Tex layered outerwear",
      "High-performance MIPS helmet",
      "Skins for splitboard touring"
    ]
  },
  ski: {
    1: [
      "Rental beginner carving skis (short, wide waist)",
      "Beginner ski boots (soft flex)",
      "Adjustable poles (grip height)",
      "UV400 polarized goggles",
      "Padded ski pants with knee reinforcement",
      "Helmet (mandatory)"
    ],
    2: [
      "Beginner-to-intermediate carving skis",
      "Soft-medium flex ski boots",
      "Poles (length = height minus 25cm)",
      "Polarized anti-fog goggles",
      "Insulated waterproof jacket & salopettes",
      "Helmet"
    ],
    3: [
      "All-mountain carving skis (mid-width)",
      "Medium-stiff flex ski boots",
      "Lightweight adjustable poles",
      "Polarized goggles with interchangeable lens",
      "Layered waterproof outerwear",
      "Helmet with ventilation"
    ],
    4: [
      "Performance carving / freeride skis",
      "Stiff race-oriented ski boots",
      "Carbon composite poles",
      "Photochromic polarized goggles",
      "Technical Gore-Tex outerwear",
      "High-performance MIPS helmet",
      "Avalanche awareness kit for off-piste use"
    ],
    5: [
      "Expert freeride / touring skis (fat powder skis or race carvers)",
      "Alpine touring (AT) boots with walk mode",
      "Dynafit-compatible bindings for touring",
      "Avalanche beacon, probe & shovel (mandatory)",
      "Airbag backpack",
      "Photochromic polarized goggles",
      "Technical Gore-Tex layered outerwear",
      "High-performance MIPS helmet"
    ]
  }
};

module.exports = { GEAR_MAP };
