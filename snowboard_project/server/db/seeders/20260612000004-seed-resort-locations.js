'use strict';

// location type ENUM: 'lift' | 'slope' | 'restaurant' | 'park' | 'rental'
// Bars/après-ski venues and mountain lodges → 'restaurant'.
// Ski schools, boot-fitting services → 'rental'.

const LOCATIONS = [
  // ── Zermatt (13) ─────────────────────────────────────────────────────────────
  { resort: 'Zermatt', name: 'Matterhorn Glacier Gondola',   type: 'lift',       description: 'Main gondola from Zermatt village up to the Matterhorn Glacier Paradise at 3883m' },
  { resort: 'Zermatt', name: 'Sunnegga Express',              type: 'lift',       description: 'Underground funicular railway climbing to the Sunnegga paradise area at 2288m' },
  { resort: 'Zermatt', name: 'Klein Matterhorn Cable Car',    type: 'lift',       description: 'Highest cable car in the Alps, accessing the Matterhorn Glacier Paradise summit station' },
  { resort: 'Zermatt', name: 'Rothorn Cable Car',             type: 'lift',       description: 'Two-stage cable car from Zermatt to the Rothorn summit at 3103m with stunning 360° views' },
  { resort: 'Zermatt', name: 'Riffelberg Express',            type: 'lift',       description: 'High-speed chairlift connecting Riffelberg at 2582m to the Rothorn area' },
  { resort: 'Zermatt', name: 'Riffelberg Slope',              type: 'slope',      description: 'Long groomed red run from Riffelberg down to the Riffelalp at 2222m — superb Matterhorn views' },
  { resort: 'Zermatt', name: 'National Park Run',             type: 'slope',      description: 'Scenic long blue run under the Matterhorn, ideal for cruising and soaking in the surroundings' },
  { resort: 'Zermatt', name: 'Findlerhof Restaurant',         type: 'restaurant', description: 'Traditional Swiss mountain restaurant in Findeln with panoramic Matterhorn views and local fondue' },
  { resort: 'Zermatt', name: 'Chez Vrony',                    type: 'restaurant', description: 'Iconic slope-side restaurant in Findeln village known for its raclette and the best Matterhorn terrace views' },
  { resort: 'Zermatt', name: 'Whymper Stube',                 type: 'restaurant', description: 'Historic après-ski bar and restaurant in the village named after Matterhorn first-ascent pioneer' },
  { resort: 'Zermatt', name: 'Stoked Snowpark',               type: 'park',       description: 'Freestyle terrain park near Rothorn with rails, kickers and a boardercross course' },
  { resort: 'Zermatt', name: 'Wolli\'s Park',                 type: 'park',       description: 'Dedicated beginner freestyle area with small features, ideal for children and first-timers' },
  { resort: 'Zermatt', name: 'Zermatt Rental Center',         type: 'rental',     description: 'Full-service ski and snowboard rental and custom boot-fitting shop at the gondola base' },

  // ── Verbier (13) ─────────────────────────────────────────────────────────────
  { resort: 'Verbier', name: 'Medran Gondola',                type: 'lift',       description: 'Main access gondola from Verbier village to Les Ruinettes at 2200m' },
  { resort: 'Verbier', name: 'Attelas Cable Car',             type: 'lift',       description: 'Cable car from Les Ruinettes to Attelas at 2727m, gateway to the Mont Gelé sector' },
  { resort: 'Verbier', name: 'Mont Fort Cable Car',           type: 'lift',       description: 'High-altitude cable car to the Mont Fort summit at 3330m — access to off-piste paradise' },
  { resort: 'Verbier', name: 'Mont Gelé Cable Car',           type: 'lift',       description: 'Access to extreme backcountry and off-piste terrain above 3000m on the steep north face' },
  { resort: 'Verbier', name: 'Tzizoule Chairlift',            type: 'lift',       description: 'Chairlift serving the gentler Savoleyres sector — perfect for beginners and intermediates' },
  { resort: 'Verbier', name: 'Piste de l\'Ours',              type: 'slope',      description: 'Famous steep and challenging red-to-black descent — a rite of passage for strong riders' },
  { resort: 'Verbier', name: 'La Chaux Blue Run',             type: 'slope',      description: 'Long and enjoyable blue run from the La Chaux area back into Verbier village' },
  { resort: 'Verbier', name: 'Les Ruinettes Restaurant',      type: 'restaurant', description: 'Classic mountain restaurant at 2200m with panoramic views of the Mont Blanc massif' },
  { resort: 'Verbier', name: 'Fer à Cheval',                  type: 'restaurant', description: 'Legendary Verbier après-ski bar and restaurant packed every afternoon with the international crowd' },
  { resort: 'Verbier', name: 'Pub Mont Fort',                 type: 'restaurant', description: 'Popular village pub and restaurant serving burgers, local beers and live music' },
  { resort: 'Verbier', name: 'Swatch Nines Snowpark',         type: 'park',       description: 'Iconic freestyle park that has hosted major international snowboard film events' },
  { resort: 'Verbier', name: 'Savoleyres Snowpark',           type: 'park',       description: 'Beginner-friendly terrain park on the quieter Savoleyres side with small kickers and boxes' },
  { resort: 'Verbier', name: 'Verbier Rent',                  type: 'rental',     description: 'Central equipment rental and ski school booking near the Medran cable car station' },

  // ── Les Deux Alpes (12) ───────────────────────────────────────────────────────
  { resort: 'Les Deux Alpes', name: 'Jandri Express Gondola',         type: 'lift',       description: 'High-speed six-seat gondola providing access to the Jandri glacier at 3568m' },
  { resort: 'Les Deux Alpes', name: 'Les Crêtes Chairlift',           type: 'lift',       description: 'Chairlift to the Les Crêtes ridge, connecting the two valleys and the upper glacier zone' },
  { resort: 'Les Deux Alpes', name: 'Diable Express Gondola',         type: 'lift',       description: 'High-speed gondola on the north side of the resort accessing the Diable and Toura sectors' },
  { resort: 'Les Deux Alpes', name: 'Tête Molle Chairlift',           type: 'lift',       description: 'Upper-mountain chairlift linking the groomed runs above 2600m with the glacier approach' },
  { resort: 'Les Deux Alpes', name: 'Freestyle Park Les Deux Alpes',  type: 'park',       description: 'World-class freestyle park with kickers, rails and a halfpipe near the glacier' },
  { resort: 'Les Deux Alpes', name: 'Beginner Snowpark',              type: 'park',       description: 'Small, friendly terrain park at mid-mountain designed for first-time park riders' },
  { resort: 'Les Deux Alpes', name: 'Glacier Slope 3600m',            type: 'slope',      description: 'Wide-open glacier descent from the top station at 3568m — summer skiing also available' },
  { resort: 'Les Deux Alpes', name: 'Blue Slope Vallée Blanche',      type: 'slope',      description: 'Long gentle blue run perfect for beginners and intermediates below the Jandri glacier' },
  { resort: 'Les Deux Alpes', name: 'Black Run Bellecombe',           type: 'slope',      description: 'Steep and challenging black run off the Bellecombe area, with moguls and tight turns' },
  { resort: 'Les Deux Alpes', name: 'La Muzelle Restaurant',          type: 'restaurant', description: 'Panoramic mountain restaurant with views over the Écrins National Park at mid-mountain' },
  { resort: 'Les Deux Alpes', name: 'L\'Opéra Restaurant',            type: 'restaurant', description: 'Popular slope-side restaurant at mid-mountain serving French mountain cuisine and wood-fired pizzas' },
  { resort: 'Les Deux Alpes', name: 'Snowboard School Les 2 Alpes',   type: 'rental',     description: 'Full-service snowboard school offering group and private lessons with beginner rental packages' },

  // ── Mayrhofen (12) ────────────────────────────────────────────────────────────
  { resort: 'Mayrhofen', name: 'Ahornbahn Cable Car',       type: 'lift',       description: 'Large-capacity cable car to the Ahorn plateau — popular for sunny gentle family terrain' },
  { resort: 'Mayrhofen', name: 'Penken Gondola',            type: 'lift',       description: 'Main gondola access to the Penken ski area and the legendary steep Harakiri slope' },
  { resort: 'Mayrhofen', name: 'Horbergbahn Gondola',       type: 'lift',       description: 'Gondola connecting Mayrhofen to the Horberg sector with wide blues and family runs' },
  { resort: 'Mayrhofen', name: 'Eggalm Chairlift',          type: 'lift',       description: 'High-speed detachable chair to the Eggalm plateau at 2095m, serving multiple red and blue runs' },
  { resort: 'Mayrhofen', name: 'Harakiri Slope',            type: 'slope',      description: "Austria's steepest groomed piste at 78% gradient — a bucket-list challenge for expert riders" },
  { resort: 'Mayrhofen', name: 'Ahorn Sun Slope',           type: 'slope',      description: 'Gentle wide blue run on the sunny Ahorn plateau, perfect for beginners and families' },
  { resort: 'Mayrhofen', name: 'Penken Red Run',            type: 'slope',      description: 'Long enjoyable red descent from the Penken summit back to the gondola base — great for cruising' },
  { resort: 'Mayrhofen', name: 'K2 Mountain Restaurant',   type: 'restaurant', description: 'Traditional Tyrolean mountain hut with live music and hearty Austrian cuisine at Penken' },
  { resort: 'Mayrhofen', name: 'Wedi Bar',                  type: 'restaurant', description: 'Classic Mayrhofen après-ski bar serving Jägertee, beer and live Tyrolean music until evening' },
  { resort: 'Mayrhofen', name: 'Vans Penken Park',          type: 'park',       description: 'Internationally recognised freestyle park on Penken with progressive lines for all skill levels' },
  { resort: 'Mayrhofen', name: 'Mayrhofen Rental Shop',    type: 'rental',     description: 'Full-service ski and snowboard rental shop at the base of the mountain' },
  { resort: 'Mayrhofen', name: 'Sport Alpin Rental',       type: 'rental',     description: 'Well-stocked rental shop in the town centre with competitive rates and quick service' },

  // ── Livigno (12) ─────────────────────────────────────────────────────────────
  { resort: 'Livigno', name: 'Carosello Gondola',              type: 'lift',       description: 'High-capacity gondola connecting the town centre to the Carosello 3000 ski area' },
  { resort: 'Livigno', name: 'Mottolino Fun Mountain Gondola', type: 'lift',       description: 'Modern gondola linking Livigno town to the Mottolino ski area and its progressive snowpark' },
  { resort: 'Livigno', name: 'Amerikan Gondola',               type: 'lift',       description: 'Gondola providing alternative village access to the Carosello sector from the south end of town' },
  { resort: 'Livigno', name: 'Tagliede Chairlift',             type: 'lift',       description: 'High-speed detachable chair to the upper Mottolino area and expert freeride terrain' },
  { resort: 'Livigno', name: 'Red Slope Federia',              type: 'slope',      description: 'One of Livigno\'s classic red runs descending through the Federia valley with wide open snowfields' },
  { resort: 'Livigno', name: 'Blue Slope Plan delle Mine',     type: 'slope',      description: 'Long gentle blue run ideal for building confidence, winding through the lower Carosello area' },
  { resort: 'Livigno', name: 'Tea Da Borch Restaurant',        type: 'restaurant', description: 'Cozy traditional restaurant at mid-mountain serving local Valtellina cuisine and Bitto cheese fondue' },
  { resort: 'Livigno', name: 'Bait dal Ghet Restaurant',       type: 'restaurant', description: 'Rustic mountain hut restaurant above the Mottolino gondola top station with panoramic valley views' },
  { resort: 'Livigno', name: 'Livigno Snowpark',               type: 'park',       description: 'Beginner-friendly snowpark with small features and a dedicated learning area near Mottolino' },
  { resort: 'Livigno', name: 'Mottolino Pro Snowpark',         type: 'park',       description: 'Advanced freestyle park on the Mottolino side with large kickers, rails and a superpipe' },
  { resort: 'Livigno', name: 'Skimania School & Rental',       type: 'rental',     description: 'Well-equipped ski and snowboard rental shop with private instruction available at the village' },
  { resort: 'Livigno', name: 'Sportler Rental Livigno',        type: 'rental',     description: 'Large alpine sports rental chain with a broad selection of skis, boards and clothing in Livigno' },

  // ── Chamonix-Mont-Blanc (13) ──────────────────────────────────────────────────
  { resort: 'Chamonix-Mont-Blanc', name: 'Aiguille du Midi Cable Car',        type: 'lift',       description: 'Iconic two-stage cable car ascending to the 3842m Aiguille du Midi with direct views of Mont Blanc' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Brévent Gondola',                   type: 'lift',       description: 'Main access gondola to the Brévent-Flégère ski area on the south-facing slopes above the valley' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Grands Montets Cable Car',          type: 'lift',       description: 'Cable car to 3300m in the Argentière sector — the heart of Chamonix\'s serious freeride terrain' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Flégère Gondola',                   type: 'lift',       description: 'Gondola linking the Flégère area to the Brévent sector, creating a connected ski domain' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Les Houches Prarion Gondola',       type: 'lift',       description: 'Access gondola to the quieter Les Houches sector — great for families and intermediate riders' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Vallée Blanche Glacier Route',      type: 'slope',      description: 'Legendary 20km off-piste glacier descent from Aiguille du Midi — guide strongly recommended' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Kandahar World Cup Slope',          type: 'slope',      description: 'Classic World Cup downhill course at Les Houches — famously gnarly and technical in race conditions' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Bochard Off-Piste Sector',         type: 'slope',      description: 'Wide open off-piste descent from the Bochard gondola — superb powder after a fresh snowfall' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Le Monchu Restaurant',              type: 'restaurant', description: 'Popular Chamonix village brasserie serving Savoyard raclette, fondue and regional wines after skiing' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Chalet de la Floria',               type: 'restaurant', description: 'Historic mountain hut above the valley serving traditional Savoyard cuisine with glacier views' },
  { resort: 'Chamonix-Mont-Blanc', name: 'La Chambre Neuf',                   type: 'restaurant', description: 'Legendary après-ski bar in Chamonix village with live music, cold beers and a rowdy atmosphere' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Chamonix Experience Rental',        type: 'rental',     description: 'Full-service equipment rental and ski school in central Chamonix, near the Aiguille du Midi telecabine' },
  { resort: 'Chamonix-Mont-Blanc', name: 'Mont Blanc Unlimited Ski School',   type: 'rental',     description: 'Established ski and snowboard school offering private guides for the Vallée Blanche and freeride terrain' },

  // ── Val Thorens (12) ─────────────────────────────────────────────────────────
  { resort: 'Val Thorens', name: 'Funitel de Péclet',              type: 'lift',       description: 'Wind-resistant double-decker gondola to 3200m — one of the highest ski lifts in the 3 Valleys' },
  { resort: 'Val Thorens', name: 'Cime Caron Cable Car',           type: 'lift',       description: 'Panoramic 150-person cable car to the 3195m Cime Caron summit with views of five countries' },
  { resort: 'Val Thorens', name: 'Cascades Express Chairlift',     type: 'lift',       description: 'High-speed six-person chair serving the Cascades sector and its variety of groomed red runs' },
  { resort: 'Val Thorens', name: 'Boismint Express',               type: 'lift',       description: 'Fast chairlift connecting the upper snowpark area to the Moraine and beginner zones' },
  { resort: 'Val Thorens', name: 'Orelle Gondola',                 type: 'lift',       description: 'Gondola from the lower Orelle valley linking Val Thorens to a less-crowded fourth ski area' },
  { resort: 'Val Thorens', name: 'Caron Summit Slope',             type: 'slope',      description: 'Long groomed descent from the Cime Caron summit — one of the highest pistes in the 3 Valleys' },
  { resort: 'Val Thorens', name: 'Moraine Blue Slope',             type: 'slope',      description: 'Gentle beginner-friendly long blue run winding from mid-mountain back into the resort village' },
  { resort: 'Val Thorens', name: 'La Fondue du Soleil Restaurant', type: 'restaurant', description: 'Traditional Savoyard mountain restaurant at 2300m altitude with south-facing sunny terrace' },
  { resort: 'Val Thorens', name: 'La Folie Douce Val Thorens',     type: 'restaurant', description: 'Famous Alpine party venue and restaurant combining gourmet mountain food with live DJs and après-ski shows' },
  { resort: 'Val Thorens', name: 'Val Thorens Snowpark',           type: 'park',       description: 'Well-maintained freestyle terrain park with beginner to advanced features on Piste Boismint' },
  { resort: 'Val Thorens', name: 'Oxygene Ski School Rental',      type: 'rental',     description: 'Established ski and snowboard school offering group lessons and high-quality rental equipment in the village' },
  { resort: 'Val Thorens', name: 'Val Thorens Sports Rental',      type: 'rental',     description: 'Centrally located rental shop in Val Thorens village with the latest ski and snowboard equipment' },

  // ── Courchevel (13) ──────────────────────────────────────────────────────────
  { resort: 'Courchevel', name: 'Saulire Express',              type: 'lift',       description: 'High-speed gondola to the Col de la Saulire, gateway to the entire 3 Valleys ski area' },
  { resort: 'Courchevel', name: 'La Croisette Gondola',         type: 'lift',       description: 'Central access gondola from Courchevel 1850 to the upper mountain and altiport' },
  { resort: 'Courchevel', name: 'Jardin Alpin Chairlift',       type: 'lift',       description: 'Chairlift serving the Jardin Alpin sector with wide easy runs, popular with families and beginners' },
  { resort: 'Courchevel', name: 'Biollay Express Chairlift',    type: 'lift',       description: 'Fast six-pack connecting Courchevel 1650 to the upper 1850 ski area and the Saulire gondola' },
  { resort: 'Courchevel', name: 'Olympic Downhill Slope',       type: 'slope',      description: 'Former venue for women\'s downhill events — a classic long steep red with spectacular views' },
  { resort: 'Courchevel', name: 'Marmottes Blue Slope',         type: 'slope',      description: 'Long and wide blue run from Col de la Saulire back to 1850, ideal for confident beginners' },
  { resort: 'Courchevel', name: 'Combe de la Saulire Slope',    type: 'slope',      description: 'Scenic off-piste bowl off the back of Saulire with deep powder pockets on north-facing aspects' },
  { resort: 'Courchevel', name: "La Table de l'Araignée",       type: 'restaurant', description: 'Award-winning alpine-modern mountain restaurant at 2100m above Courchevel 1850' },
  { resort: 'Courchevel', name: 'La Saulire Restaurant',        type: 'restaurant', description: 'Panoramic restaurant at the top of the Saulire gondola with 3 Valleys views and a sunny terrace' },
  { resort: 'Courchevel', name: 'Les Chenus Refuge',            type: 'restaurant', description: 'Cosy mid-mountain lunch spot serving traditional Savoyard dishes and warm drinks on the piste' },
  { resort: 'Courchevel', name: 'Courchevel Terrain Park',      type: 'park',       description: 'FIS-certified competition-standard freestyle park with big-air jump and multiple rail lines' },
  { resort: 'Courchevel', name: 'Kids Discovery Park',          type: 'park',       description: 'Gentle enclosed terrain park at village level designed for children and complete beginners' },
  { resort: 'Courchevel', name: 'Crystal Ski Rental',           type: 'rental',     description: 'Premium ski equipment rental and custom boot-fitting service in Courchevel 1850 village' },

  // ── St. Anton am Arlberg (13) ─────────────────────────────────────────────────
  { resort: 'St. Anton am Arlberg', name: 'Galzigbahn Cable Car',        type: 'lift',       description: 'Iconic cable car rising directly from St. Anton village centre to 2185m on the Galzig' },
  { resort: 'St. Anton am Arlberg', name: 'Vallugabahn Stage 2',         type: 'lift',       description: 'Summit cable car from Vallugagrat to the 2811m Valluga peak — guide required for the descent' },
  { resort: 'St. Anton am Arlberg', name: 'Nassereinbahn Gondola',       type: 'lift',       description: 'Gondola from the quieter Nasserein side of St. Anton, serving intermediate terrain and powder fields' },
  { resort: 'St. Anton am Arlberg', name: 'Schindlergratbahn Cable Car', type: 'lift',       description: 'Cable car to the Schindler Grat at 2640m — launching pad for challenging off-piste descents' },
  { resort: 'St. Anton am Arlberg', name: 'Gampen Chairlift',            type: 'lift',       description: 'Lower-mountain beginner and intermediate chairlift in the sheltered Gampen area at 1850m' },
  { resort: 'St. Anton am Arlberg', name: 'Kandahar World Cup Course',   type: 'slope',      description: 'Legendary World Cup downhill and super-G race course running directly above the village' },
  { resort: 'St. Anton am Arlberg', name: 'Rendl North-Face Slopes',     type: 'slope',      description: 'North-facing Rendl sector with excellent powder retention, long blacks and wide open reds' },
  { resort: 'St. Anton am Arlberg', name: 'Albona Freeride Zone',        type: 'slope',      description: 'Ungroomed off-piste terrain off the Albona sector in the Stuben area — deep powder after snowfall' },
  { resort: 'St. Anton am Arlberg', name: 'Arlberg Hospiz Bar',          type: 'restaurant', description: 'Legendary après-ski venue in St. Christoph with Tyrolean cuisine and a roaring fire' },
  { resort: 'St. Anton am Arlberg', name: 'Krazy Kanguruh',              type: 'restaurant', description: 'World-famous après-ski bar and restaurant perched on the slopes above the village with live bands' },
  { resort: 'St. Anton am Arlberg', name: 'St. Anton Snowpark',          type: 'park',       description: 'Freestyle terrain park on the lower Nasserein slopes with rails and medium-sized kickers' },
  { resort: 'St. Anton am Arlberg', name: 'Sport Strolz',                type: 'rental',     description: 'Historic local ski shop providing custom boot-fitting and premium rental since 1929' },
  { resort: 'St. Anton am Arlberg', name: 'Arlberg Ski School',          type: 'rental',     description: 'One of Austria\'s largest and most prestigious ski schools offering lessons in multiple languages' },

  // ── Ischgl (13) ──────────────────────────────────────────────────────────────
  { resort: 'Ischgl', name: 'Silvrettabahn Gondola',      type: 'lift',       description: 'Main valley gondola from Ischgl village to the Idalp plateau at 2320m' },
  { resort: 'Ischgl', name: 'Palinkopf Cable Car',         type: 'lift',       description: 'Cross-border cable car accessing dual Austrian and Swiss Samnaun terrain above 2800m' },
  { resort: 'Ischgl', name: 'Velillbahn Gondola',          type: 'lift',       description: 'Large gondola system on the western Ischgl side providing access to the Velilltal powder fields' },
  { resort: 'Ischgl', name: 'Idjochbahn Chairlift',        type: 'lift',       description: 'High-speed chair to Idjoch at 2827m, linking to the Swiss side and top of the ski area' },
  { resort: 'Ischgl', name: 'Pardatschgratbahn Gondola',   type: 'lift',       description: 'Gondola to the Pardatschgrat at 2624m with access to a wide network of long red and black runs' },
  { resort: 'Ischgl', name: 'Fimba Valley Slope',          type: 'slope',      description: 'Scenic valley descent into the Fimba valley — a classic long red enjoyed by confident intermediates' },
  { resort: 'Ischgl', name: 'Pardatsch Black Run',         type: 'slope',      description: 'Challenging steep black descent from Pardatschgrat with sustained gradient and natural moguls' },
  { resort: 'Ischgl', name: 'Idalp Blue Cruise',           type: 'slope',      description: 'Wide-open groomed blue across the Idalp plateau — great for warm-up laps and beginners' },
  { resort: 'Ischgl', name: 'Paznauner Thaya Restaurant',  type: 'restaurant', description: 'Panoramic glass-fronted restaurant at the Idalp plateau serving Austrian mountain cuisine' },
  { resort: 'Ischgl', name: 'Trofana Royal Bar',           type: 'restaurant', description: 'Famous après-ski and fine-dining venue — Ischgl\'s most glamorous party and dining destination' },
  { resort: 'Ischgl', name: 'Top Mountain Star Restaurant',type: 'restaurant', description: 'High-altitude restaurant at the Idjoch summit with spectacular views into Switzerland' },
  { resort: 'Ischgl', name: 'Ischgl Snowpark',             type: 'park',       description: 'International-level freestyle park with multiple lines including a superpipe at Idalp' },
  { resort: 'Ischgl', name: 'Intersport Ischgl Rental',    type: 'rental',     description: 'Large multi-floor ski and snowboard rental shop in the village centre near the gondola' },

  // ── Kitzbühel (13) ───────────────────────────────────────────────────────────
  { resort: 'Kitzbühel', name: 'Hahnenkamm Gondola',              type: 'lift',       description: 'Main gondola from Kitzbühel town to Hahnenkamm — start of the famous Streif World Cup race' },
  { resort: 'Kitzbühel', name: 'Pengelstein Gondola',             type: 'lift',       description: 'Modern high-speed gondola connecting Kitzbühel to the wider KitzSki area and Jochberg sector' },
  { resort: 'Kitzbühel', name: 'Fleckalmbahn Gondola',            type: 'lift',       description: 'Six-person gondola to the Fleckalm area at 1930m, linking to the Pass Thurn ski area' },
  { resort: 'Kitzbühel', name: 'Kitzbüheler Horn Cable Car',      type: 'lift',       description: 'Cable car to the Horn summit at 1996m — the quieter, sunnier family-friendly side of the resort' },
  { resort: 'Kitzbühel', name: 'Streif Downhill Slope',           type: 'slope',      description: 'The legendary World Cup downhill course with a 650m vertical drop and gradient up to 85%' },
  { resort: 'Kitzbühel', name: 'Ganslernhang Slalom Slope',       type: 'slope',      description: 'Venue for the annual World Cup slalom event — short, steep and technically demanding' },
  { resort: 'Kitzbühel', name: 'Resterhöhe Long Blue',            type: 'slope',      description: 'Long enjoyable blue run from Resterhöhe toward Kirchberg — perfect for relaxed intermediate cruising' },
  { resort: 'Kitzbühel', name: 'Bergrestaurant Ehrenbachhöhe',    type: 'restaurant', description: 'Traditional Austrian hut at 1800m serving local kaiserschmarrn, schnitzel and Glühwein' },
  { resort: 'Kitzbühel', name: 'Sky Alm Restaurant',              type: 'restaurant', description: 'Panoramic terrace restaurant on the Hahnenkamm with stunning views over the Kitzbueheler Alps' },
  { resort: 'Kitzbühel', name: 'Snowberry\'s Mountain Bar',        type: 'restaurant', description: 'Relaxed après-ski bar and restaurant at the Pengelstein base with live music and local beers' },
  { resort: 'Kitzbühel', name: 'Hahnenkamm Snowpark',             type: 'park',       description: 'Compact terrain park on the Hahnenkamm with rails, boxes and small jumps for intermediate riders' },
  { resort: 'Kitzbühel', name: 'Intersport Kitzbühel Rental',     type: 'rental',     description: 'Award-winning ski rental shop at Kitzbühel base with test-centre for the latest equipment' },
  { resort: 'Kitzbühel', name: 'Rosi\'s Sport Rental',            type: 'rental',     description: 'Beloved local family-run rental shop in the town centre with personalised service and fair prices' },

  // ── Cervinia (13) ────────────────────────────────────────────────────────────
  { resort: 'Cervinia', name: 'Plateau Rosa Gondola',        type: 'lift',       description: 'High-altitude gondola to 3480m on the international Zermatt-Cervinia cross-border ski area' },
  { resort: 'Cervinia', name: 'Plan Maison Cable Car',       type: 'lift',       description: 'Main mid-mountain cable car from Cervinia village to Plan Maison at 2550m' },
  { resort: 'Cervinia', name: 'Laghi Cime Bianche Lift',     type: 'lift',       description: 'Chairlift to the glacial lake area and high-altitude terrain above 2900m' },
  { resort: 'Cervinia', name: 'Cretaz Express Chairlift',    type: 'lift',       description: 'High-speed chair connecting the Plan Maison area to the upper Cretaz sector' },
  { resort: 'Cervinia', name: 'Ventina Slope',               type: 'slope',      description: 'Wide and well-groomed intermediate red run — one of the most popular pistes in Cervinia' },
  { resort: 'Cervinia', name: 'Gran Sometta Descent',        type: 'slope',      description: 'Long high-altitude descent from Gran Sometta at 3491m offering spectacular Matterhorn views throughout' },
  { resort: 'Cervinia', name: 'Cielo Alto Beginner Area',    type: 'slope',      description: 'Gentle easy blue slopes at mid-mountain — the ideal learning zone for first-timers' },
  { resort: 'Cervinia', name: 'Lo Stambecco Restaurant',     type: 'restaurant', description: 'Traditional Italian mountain restaurant at 2000m with Matterhorn views and local Valdostana cuisine' },
  { resort: 'Cervinia', name: 'Plan Maison Restaurant',      type: 'restaurant', description: 'Popular mid-mountain lunch stop at 2550m offering Italian pasta, pizza and mountain wines' },
  { resort: 'Cervinia', name: 'Baita Cretaz',                type: 'restaurant', description: 'Cozy mountain hut at 2300m serving Italian hot chocolate, polenta and Aosta Valley specialties' },
  { resort: 'Cervinia', name: 'Cervinia Snowpark',           type: 'park',       description: 'Accessible freestyle park with beginner and intermediate features near the Plan Maison mid-station' },
  { resort: 'Cervinia', name: 'Cervinia Freestyle Park',     type: 'park',       description: 'Advanced freestyle zone with large kickers and rails on the upper mountain terrain' },
  { resort: 'Cervinia', name: 'Noleggio Breuil Rental',      type: 'rental',     description: 'Centrally located ski and snowboard rental with clothing hire at Cervinia village' },

  // ── Cortina d'Ampezzo (13) ────────────────────────────────────────────────────
  { resort: "Cortina d'Ampezzo", name: 'Faloria Cable Car',              type: 'lift',       description: 'Iconic cable car rising above the Boite valley to Faloria at 2123m with Dolomite views' },
  { resort: "Cortina d'Ampezzo", name: 'Tofana Freccia nel Cielo',       type: 'lift',       description: 'Three-stage cable car to the Tofana di Mezzo summit at 3244m — "Arrow in the Sky"' },
  { resort: "Cortina d'Ampezzo", name: 'Lagazuoi Cable Car',             type: 'lift',       description: 'Cable car to Lagazuoi at 2752m, gateway to the Alta Via 1 off-piste and the Armentarola descent' },
  { resort: "Cortina d'Ampezzo", name: 'Cinque Torri Chairlift',         type: 'lift',       description: 'Chairlift to the iconic Cinque Torri rock towers at 2360m — dramatic scenery and quiet slopes' },
  { resort: "Cortina d'Ampezzo", name: 'Socrepes Chairlift',             type: 'lift',       description: 'Beginner and intermediate sector chairlift with gentle terrain, great for learning and families' },
  { resort: "Cortina d'Ampezzo", name: 'Ra Valles World Cup Slope',      type: 'slope',      description: 'Championship Dolomites descent from the Tofana glacier — venue for historic World Cup events' },
  { resort: "Cortina d'Ampezzo", name: 'Olimpia Downhill Course',        type: 'slope',      description: 'Historic Olympic downhill course from the 1956 Cortina Games — a classic steep technical run' },
  { resort: "Cortina d'Ampezzo", name: 'Socrepes Easy Slope',            type: 'slope',      description: 'Gentle beginner slope at Socrepes — the best area for first-time skiers and snowboarders in Cortina' },
  { resort: "Cortina d'Ampezzo", name: 'Rifugio Averau Restaurant',      type: 'restaurant', description: 'Historic mountain refuge at 2416m with a breathtaking 360° Dolomite panorama and local cuisine' },
  { resort: "Cortina d'Ampezzo", name: 'Baita Pie Tofana Restaurant',    type: 'restaurant', description: 'Cozy slope-side hut at the base of the Tofana cable car serving warming Italian mountain food' },
  { resort: "Cortina d'Ampezzo", name: 'Rifugio Col Gallina',            type: 'restaurant', description: 'Panoramic alpine refuge at 2454m between the Lagazuoi and Cinque Torri sectors' },
  { resort: "Cortina d'Ampezzo", name: 'Dolomiti Rental Cortina',        type: 'rental',     description: 'Premium equipment rental and full ski service in the historic 1956 Olympic venue' },
  { resort: "Cortina d'Ampezzo", name: 'Cortina Ski Service Rental',     type: 'rental',     description: 'Comprehensive ski and snowboard rental and boot-fitting at multiple locations in Cortina village' },

  // ── Whistler Blackcomb (14) ───────────────────────────────────────────────────
  { resort: 'Whistler Blackcomb', name: 'Peak 2 Peak Gondola',               type: 'lift',       description: 'Record-breaking 4.4km gondola linking Whistler and Blackcomb peaks 436m above the valley floor' },
  { resort: 'Whistler Blackcomb', name: 'Whistler Village Gondola',          type: 'lift',       description: 'Main 8-person gondola from Whistler Village to Roundhouse Lodge at 1850m' },
  { resort: 'Whistler Blackcomb', name: 'Blackcomb Gondola',                 type: 'lift',       description: 'Access gondola from Blackcomb base to Rendezvous Lodge and the upper mountain terrain' },
  { resort: 'Whistler Blackcomb', name: 'Harmony Express Chairlift',         type: 'lift',       description: 'High-speed quad on Whistler Mountain giving access to Harmony Bowl and Symphony Bowl terrain' },
  { resort: 'Whistler Blackcomb', name: 'Crystal Ridge Express',             type: 'lift',       description: 'Fast chairlift serving the open Crystal Bowl area and connection to the Blackcomb glacier' },
  { resort: 'Whistler Blackcomb', name: 'Glacier Express Chairlift',         type: 'lift',       description: 'Upper Blackcomb chairlift serving the glacier terrain and Spanky\'s Ladder extreme zone' },
  { resort: 'Whistler Blackcomb', name: 'Symphony Bowl Slope',               type: 'slope',      description: 'Vast open powder bowl accessible via the Harmony Express — Whistler\'s quietest and most scenic area' },
  { resort: 'Whistler Blackcomb', name: "Spanky's Ladder Couloirs",          type: 'slope',      description: 'Famous steep exposed couloirs off the Blackcomb summit — expert-only with mandatory traversing' },
  { resort: 'Whistler Blackcomb', name: 'Dave Murray Downhill Slope',        type: 'slope',      description: 'Long classic groomed run from Whistler peak to the village — the 2010 Olympic men\'s downhill course' },
  { resort: 'Whistler Blackcomb', name: 'Roundhouse Lodge Restaurant',       type: 'restaurant', description: 'Large mid-mountain facility at 1850m offering panoramic dining and a food court for all tastes' },
  { resort: 'Whistler Blackcomb', name: 'Christine\'s Restaurant',           type: 'restaurant', description: 'Fine dining at Rendezvous Lodge on Blackcomb — elegant mountain cuisine with glacier views' },
  { resort: 'Whistler Blackcomb', name: 'Merlin\'s Bar & Grill',             type: 'restaurant', description: 'Lively après-ski bar and grill at Blackcomb Base with a rooftop patio and après music' },
  { resort: 'Whistler Blackcomb', name: 'Whistler Blackcomb Terrain Parks',  type: 'park',       description: 'World-class parks including Habitat Terrain Park on Blackcomb and Nintendo Terrain Park on Whistler' },
  { resort: 'Whistler Blackcomb', name: 'Whistler Kids Snow School',         type: 'rental',     description: 'Dedicated beginner and children\'s ski school with full rental packages and gentle learning slopes' },

  // ── Vail (14) ─────────────────────────────────────────────────────────────────
  { resort: 'Vail', name: 'Eagle Bahn Gondola',        type: 'lift',       description: 'Gondola from Lionshead Village to Eagle\'s Nest ridge at 3356m with mountain shops and restaurants' },
  { resort: 'Vail', name: 'Gondola One',               type: 'lift',       description: 'Original Vail gondola from Vail Village to the mid-mountain Born Free area' },
  { resort: 'Vail', name: 'Born Free Express',         type: 'lift',       description: 'High-speed quad from Vail Village accessing the legendary Back Bowls and Blue Sky Basin' },
  { resort: 'Vail', name: 'Mountain Top Express',      type: 'lift',       description: 'Summit chairlift to Vail Mountain peak at 3432m — access to the massive Back Bowls' },
  { resort: 'Vail', name: 'Riva Bahn Express',         type: 'lift',       description: 'High-speed detachable quad on the east side connecting Mid-Vail to the Grand Review area' },
  { resort: 'Vail', name: 'Tea Cup Express',           type: 'lift',       description: 'Chairlift providing access into Game Creek Bowl — a locals\' favourite powder stash' },
  { resort: 'Vail', name: 'Blue Sky Basin',            type: 'slope',      description: '645-acre backcountry-feel terrain with deep powder, gladed tree skiing and wide-open bowls' },
  { resort: 'Vail', name: 'Game Creek Bowl',           type: 'slope',      description: 'Private-feeling bowl on the back side of Vail with varied terrain from blues to steep blacks' },
  { resort: 'Vail', name: 'Prima Cornice Slope',       type: 'slope',      description: 'Serious steep black terrain off the back of the mountain — a must for expert riders' },
  { resort: 'Vail', name: 'Bistro Fourteen',           type: 'restaurant', description: 'Slope-side mountain dining at Mid-Vail lodge at 3380m with panoramic Colorado Rockies views' },
  { resort: 'Vail', name: 'Wildwood Smokehouse',       type: 'restaurant', description: 'Mid-mountain BBQ restaurant and bar on the Wildwood run — hearty Colorado comfort food at altitude' },
  { resort: 'Vail', name: 'Two Elk Restaurant',        type: 'restaurant', description: 'Iconic full-service Back Bowls restaurant at 3323m — the highest dining facility on the mountain' },
  { resort: 'Vail', name: 'Vail Ski School',           type: 'rental',     description: 'Official resort ski and snowboard school with instruction for all ages and ability levels' },
  { resort: 'Vail', name: 'Ski Butlers Vail',          type: 'rental',     description: 'Premium ski valet delivery and fitting service — equipment brought directly to your lodging' },

  // ── Park City Mountain (13) ────────────────────────────────────────────────────
  { resort: 'Park City Mountain', name: 'Quicksilver Gondola',          type: 'lift',       description: 'Main access gondola from Canyons Village base area to mid-mountain terrain' },
  { resort: 'Park City Mountain', name: 'Flatiron Express',             type: 'lift',       description: 'Modern high-speed quad to the upper mountain connecting Canyons Village and Park City sectors' },
  { resort: 'Park City Mountain', name: 'Motherlode Express',           type: 'lift',       description: 'Six-person high-speed chair linking the two main ski areas over the ridge' },
  { resort: 'Park City Mountain', name: 'Silverlode Express',           type: 'lift',       description: 'Park City\'s fastest high-speed six-pack serving the most popular intermediate terrain' },
  { resort: 'Park City Mountain', name: 'Iron Mountain Express',        type: 'lift',       description: 'Chairlift to Iron Mountain providing access to wide intermediate cruising terrain' },
  { resort: 'Park City Mountain', name: 'Thaynes Canyon Slope',         type: 'slope',      description: 'Challenging double-black terrain off Thaynes Canyon — deep powder and tight tree skiing' },
  { resort: 'Park City Mountain', name: 'King Con Run',                 type: 'slope',      description: 'Classic top-to-bottom groomed blue run linking the two ski areas — great for all abilities' },
  { resort: 'Park City Mountain', name: 'Mid-Mountain Lodge',           type: 'restaurant', description: 'Historic 1898 silver mining lodge converted into a full-service mountain dining facility at 2680m' },
  { resort: 'Park City Mountain', name: 'Legends Bar & Grill',         type: 'restaurant', description: 'Lively slope-side bar and restaurant at the Resort Center base — popular après-ski destination' },
  { resort: 'Park City Mountain', name: 'Umbrella Bar',                 type: 'restaurant', description: 'Outdoor umbrella bar at the top of Silverlode Express — famous for its lunchtime sun-deck scene' },
  { resort: 'Park City Mountain', name: 'Park City Terrain Park',       type: 'park',       description: 'Multiple parks including Eagle, Pinecone and JP Pass with features for all ability levels' },
  { resort: 'Park City Mountain', name: 'Park City Ski & Snowboard School', type: 'rental',  description: 'Official resort ski and snowboard school with lessons for all ages and a wide range of rental equipment' },
  { resort: 'Park City Mountain', name: 'Canyons Village Gear Rental',  type: 'rental',     description: 'Convenient full-service rental shop at the Canyons Village base with the latest equipment' },

  // ── Jackson Hole (14) ─────────────────────────────────────────────────────────
  { resort: 'Jackson Hole', name: 'Aerial Tram',                  type: 'lift',       description: 'Iconic 100-passenger red tram ascending 4139 vertical feet to the 3185m Rendezvous Mountain summit' },
  { resort: 'Jackson Hole', name: 'Bridger Gondola',              type: 'lift',       description: 'Eight-passenger gondola providing access to Après Vous Mountain and the vast Casper Bowl terrain' },
  { resort: 'Jackson Hole', name: 'Sublette Quad',                type: 'lift',       description: 'High-speed quad to the upper expert terrain off the Sublette Ridge — serious black diamond country' },
  { resort: 'Jackson Hole', name: 'Thunder Express Chairlift',    type: 'lift',       description: 'Fast chairlift serving the wide Thunder and Moran intermediate terrain on the north face' },
  { resort: 'Jackson Hole', name: 'Apres Vous Quad',              type: 'lift',       description: 'Beginner and intermediate chair on the gentler south-facing Après Vous Mountain' },
  { resort: 'Jackson Hole', name: "Corbet's Couloir",             type: 'slope',      description: 'Famous extreme couloir requiring a mandatory 10–20ft air entry — one of North America\'s most challenging runs' },
  { resort: 'Jackson Hole', name: 'Rendezvous Bowl',              type: 'slope',      description: 'Vast open powder bowl below the Aerial Tram summit with terrain ranging from steep blacks to wide reds' },
  { resort: 'Jackson Hole', name: 'Hobacks Terrain',              type: 'slope',      description: 'Wide-open powder fields at the southern end of the resort — famous for waist-deep powder days' },
  { resort: 'Jackson Hole', name: 'Casper Bowl Slope',            type: 'slope',      description: 'Mid-mountain intermediate bowl with challenging tree skiing and natural gullies on the edges' },
  { resort: 'Jackson Hole', name: 'Casper Restaurant',            type: 'restaurant', description: 'Mid-mountain cafeteria and bar at Casper Bowl with sweeping views over the Jackson Hole valley' },
  { resort: 'Jackson Hole', name: 'Mangy Moose Restaurant',       type: 'restaurant', description: 'Legendary après-ski saloon and restaurant in Teton Village — live music, antler décor and big steaks' },
  { resort: 'Jackson Hole', name: 'Nick Wilson\'s Cowboy Café',   type: 'restaurant', description: 'Classic Western dining at Teton Village base — famous for its cowboy breakfasts and après drinks' },
  { resort: 'Jackson Hole', name: 'Jackson Hole Ski School',      type: 'rental',     description: 'Official resort instruction and rental — lessons range from first-timers to steep-and-deep clinics' },
  { resort: 'Jackson Hole', name: 'Teton Village Sports Rental',  type: 'rental',     description: 'Comprehensive rental service in Teton Village at the base of the Aerial Tram' },

  // ── Breckenridge (14) ─────────────────────────────────────────────────────────
  { resort: 'Breckenridge', name: 'BreckConnect Gondola',         type: 'lift',       description: 'Free gondola connecting Breckenridge town to the ski area base — the world\'s highest gondola at 2926m' },
  { resort: 'Breckenridge', name: 'Imperial Express SuperChair',  type: 'lift',       description: 'Highest chairlift in North America at 3962m elevation, accessing double-black diamond terrain' },
  { resort: 'Breckenridge', name: 'QuickSilver Super 6',          type: 'lift',       description: 'High-speed 6-passenger chair at the Peak 8 base — the fastest way to the upper mountain' },
  { resort: 'Breckenridge', name: 'Colorado SuperChair',          type: 'lift',       description: 'Key connector chair linking Peak 8 and Peak 9 with access to a wide variety of groomed terrain' },
  { resort: 'Breckenridge', name: 'Zendo Chair',                  type: 'lift',       description: 'Access chairlift to the challenging advanced terrain and tree skiing on Peak 9' },
  { resort: 'Breckenridge', name: 'Peak 9 Groomed Slopes',        type: 'slope',      description: 'Long wide intermediate runs on Peak 9 — well-groomed and perfect for confidence-building laps' },
  { resort: 'Breckenridge', name: 'Imperial Bowl',                type: 'slope',      description: 'Extreme double-black terrain near the Imperial Express summit — expert powder skiing above treeline' },
  { resort: 'Breckenridge', name: 'Contest Bowl Slope',           type: 'slope',      description: 'Open wide bowl between Peak 8 and Peak 9 with varied terrain from wide blues to steep blacks' },
  { resort: 'Breckenridge', name: 'Ten Mile Station Restaurant',  type: 'restaurant', description: 'Large base lodge restaurant at the foot of Peak 9 with views of the Ten Mile Range' },
  { resort: 'Breckenridge', name: 'Vista Haus Restaurant',        type: 'restaurant', description: 'Mid-mountain dining at the top of Peak 8 — panoramic views of the Continental Divide' },
  { resort: 'Breckenridge', name: 'Ski Tip Lodge Restaurant',     type: 'restaurant', description: 'Historic 1880s miner\'s cabin near the base — intimate cozy dining with a crackling fire' },
  { resort: 'Breckenridge', name: 'Peak 8 SuperPark',             type: 'park',       description: 'One of the largest terrain parks in Colorado with 100+ features including multiple halfpipes' },
  { resort: 'Breckenridge', name: 'Woodward Terrain Park',        type: 'park',       description: 'Dedicated Woodward progression park on Peak 8 with structured coaching and beginner-to-pro features' },
  { resort: 'Breckenridge', name: 'Breckenridge Ski School',      type: 'rental',     description: 'Resort ski and snowboard school with lessons for all ages and convenient on-mountain rental pickup' },

  // ── Niseko United (13) ────────────────────────────────────────────────────────
  { resort: 'Niseko United', name: 'Niseko Grand Hirafu Gondola',  type: 'lift',       description: 'Main 8-person gondola at Hirafu — the largest of the four Niseko United resorts at 1308m summit' },
  { resort: 'Niseko United', name: 'Niseko Village Gondola',       type: 'lift',       description: 'Access gondola at Niseko Village resort adjacent to the Hilton Niseko Village hotel' },
  { resort: 'Niseko United', name: 'Hirafu King Quad',             type: 'lift',       description: 'High-speed quad chair connecting the upper Hirafu terrain to the Niseko peak and off-piste access' },
  { resort: 'Niseko United', name: 'Niseko Annupuri 8-Pack',       type: 'lift',       description: 'Modern 8-passenger detachable chairlift at the Annupuri sector — fastest access to the summit' },
  { resort: 'Niseko United', name: 'Ace Family Quad',              type: 'lift',       description: 'Mid-mountain family-oriented quad at Hirafu with access to gentle groomed beginner terrain' },
  { resort: 'Niseko United', name: "Red's Tree Run",               type: 'slope',      description: 'Famous powder tree skiing area in Hirafu zone — the quintessential Niseko off-piste experience' },
  { resort: 'Niseko United', name: 'Kurobishi Slope',              type: 'slope',      description: 'Steep and direct descent from the Hirafu peak — challenging and usually full of deep Hokkaido powder' },
  { resort: 'Niseko United', name: 'Annupuri Long Blue',           type: 'slope',      description: 'Long winding blue course from the Annupuri summit down to the base — great for all-day cruising' },
  { resort: 'Niseko United', name: 'Powder Restaurant',            type: 'restaurant', description: 'Popular Hirafu restaurant serving Japanese cuisine featuring local Hokkaido dairy and seasonal produce' },
  { resort: 'Niseko United', name: 'Bang Bang Kitchen',            type: 'restaurant', description: 'Beloved Hirafu village ramen and gyoza restaurant — a post-ski ritual for most regulars' },
  { resort: 'Niseko United', name: 'The General Store Café',       type: 'restaurant', description: 'Village café in Hirafu serving specialty coffee, homemade pastries and light après-ski food' },
  { resort: 'Niseko United', name: 'Niseko Hanazono Snowpark',     type: 'park',       description: 'Dedicated freestyle terrain park at Hanazono resort with progressive features for all levels' },
  { resort: 'Niseko United', name: 'Niseko Rental Shop',           type: 'rental',     description: 'High-quality Japanese equipment rental with heated boot storage and expert fitting in Hirafu village' },

  // ── Hakuba Valley (13) ────────────────────────────────────────────────────────
  { resort: 'Hakuba Valley', name: 'Happo One Gondola',             type: 'lift',       description: 'Main gondola at the flagship Happo One resort — largest in Hakuba Valley with 21 lifts' },
  { resort: 'Hakuba Valley', name: 'Goryu Gondola',                 type: 'lift',       description: 'Access gondola at Goryu resort with excellent intermediate terrain and reliable powder snow' },
  { resort: 'Hakuba Valley', name: 'Hakuba 47 Gondola',             type: 'lift',       description: 'Modern gondola at Hakuba 47 resort sharing terrain with Goryu for combined ski area access' },
  { resort: 'Hakuba Valley', name: 'Tsugaike Kogen Gondola',        type: 'lift',       description: 'Large gondola at Tsugaike Kogen resort — the best of the Hakuba resorts for deep powder skiing' },
  { resort: 'Hakuba Valley', name: 'Hakuba Cortina Gondola',        type: 'lift',       description: 'Access gondola at the westernmost Cortina resort — famous for receiving the most snowfall in Hakuba' },
  { resort: 'Hakuba Valley', name: 'Wadano Forest Slope',           type: 'slope',      description: 'Deep powder tree skiing area accessible through the Happo One backcountry gates — guide recommended' },
  { resort: 'Hakuba Valley', name: 'Skyline Course Hakuba 47',      type: 'slope',      description: 'Long top-to-bottom intermediate piste at Hakuba 47 — the most popular groomed run in the valley' },
  { resort: 'Hakuba Valley', name: 'Riverbend Course Happo One',    type: 'slope',      description: 'Popular wide beginner-to-intermediate groomed run at Happo One — excellent for warm-up and lessons' },
  { resort: 'Hakuba Valley', name: 'Evergreen Café',                type: 'restaurant', description: 'Popular international café serving espresso and light meals at the Happo One base area' },
  { resort: 'Hakuba Valley', name: 'Alps 360 Restaurant',           type: 'restaurant', description: 'Panoramic mountain restaurant at Happo One mid-station with views of the Northern Japan Alps' },
  { resort: 'Hakuba Valley', name: 'Hakuba Brewing Co. Taproom',    type: 'restaurant', description: 'Craft beer taphouse in Hakuba village serving après-ski drinks with local hops and Japanese snacks' },
  { resort: 'Hakuba Valley', name: 'Happo One Snowpark',            type: 'park',       description: 'Progressive freestyle park at Happo One with natural terrain features and built jumps and rails' },
  { resort: 'Hakuba Valley', name: 'Hakuba Valley Rental',          type: 'rental',     description: 'Well-equipped rental shop at the base of Happo One with ski, snowboard and full clothing hire' },
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    // Build resort-name → id map
    const allResorts = await queryInterface.sequelize.query(
      'SELECT id, name FROM resorts',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const resortId = {};
    allResorts.forEach(r => { resortId[r.name] = r.id; });

    // Build set of already-existing (resort_id, name) pairs
    const existingLocs = await queryInterface.sequelize.query(
      'SELECT name, resort_id FROM resort_locations',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const existingKeys = new Set(existingLocs.map(l => `${l.resort_id}:${l.name}`));

    // Filter to locations whose resort exists and that don't already exist
    const toInsert = LOCATIONS
      .filter(l => {
        const rid = resortId[l.resort];
        return rid !== undefined && !existingKeys.has(`${rid}:${l.name}`);
      })
      .map(l => ({
        resort_id:   resortId[l.resort],
        name:        l.name,
        type:        l.type,
        description: l.description,
        created_at:  now,
        updated_at:  now,
      }));

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('resort_locations', toInsert);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('resort_locations', null, {});
  }
};
