/**
 * Location Suggestion Data
 *
 * Keyed by locationType → sportType.
 * Returns a sport-specific general tip for each in-resort point-of-interest type.
 *
 * locationType values: "slope", "lift", "restaurant", "park", "rental"
 * sportType values:    "ski", "snowboard"
 */

const LOCATION_SUGGESTIONS = {
  slope: {
    snowboard: "Seek out wide groomed blue runs where you can link turns comfortably. Avoid long flat cat-tracks if you're still building speed management.",
    ski:       "Head to red or groomed blue pistes for consistent edge engagement. A slalom or giant-slalom run is perfect for carving practice."
  },
  lift: {
    snowboard: "Use the gondola or quad chair to reach the upper mountain — avoid T-bars and drag lifts until you're confident, as flat sections can be tricky on a board.",
    ski:       "Chairlifts and gondolas give the best access to varied terrain. Use the lift map to identify peak-hour queues and plan your runs accordingly."
  },
  restaurant: {
    snowboard: "Fuel up at a mid-mountain hut — look for venues with a wide sunny terrace where you can rack your board and enjoy après vibes.",
    ski:       "Ski-in / ski-out restaurants are ideal. Look for a sun-facing terrace on a south-facing slope and classic local mountain food."
  },
  park: {
    snowboard: "The snowpark is your playground — start on the beginner line (small kickers, butter boxes) and work your way up to rails, hips, and the halfpipe.",
    ski:       "Freestyle skiing in the park is great progression. Start with small kickers to nail your technique before moving to bigger features or the superpipe."
  },
  rental: {
    snowboard: "Visit the rental shop before 8:30am to beat queues. Ask staff for soft-flex boots and a board length matched to your weight and skill level.",
    ski:       "Arrive early at the rental shop and ask for DIN binding settings appropriate to your ability. Well-fitted stiff boots make a huge difference for skiers."
  }
};

module.exports = { LOCATION_SUGGESTIONS };
