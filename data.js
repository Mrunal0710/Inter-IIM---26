/* =====================================================================
   INTER IIM '26 · CONTINGENT HUB · CONTENT FILE
   ---------------------------------------------------------------------
   Most edits happen here. Search for "EDIT" to find what's still missing.
   Times are 24h "HH:MM" in IST. Anything from 00:00 to 03:59 counts as
   late night of the SAME event day (e.g. a 00:10 bus on Day 1 runs after
   the 23:10 one).
   Fixtures live in fixtures.js, and also sync live from the schedule
   Google Sheet (see config.scheduleSheet).
   ===================================================================== */

window.SITE = {

  /* ---------------- CORE SETTINGS ---------------- */
  config: {
    eventName: "Inter IIM '26",
    tagline: "Contingent Hub",
    host: "IIM Kozhikode",
    siteUrl: "",                        // EDIT: your Vercel URL once live (used by the Share button)
    sportagonUrl: "",                   // EDIT: Sportagon link
    sportagonName: "Sportagon",

    /* GOOGLE MY MAPS: the Map tab draws this map's layers, pins, paths and
       shapes live on a satellite base, with a legend. Edit the map in Google;
       the site updates within about a minute. The map must be shared as
       "Anyone with the link can view". Leave "" to use the places below. */
    googleMyMapsId: "16rOhbVtiajQ1wK40gJJrr9aYv3wFapU",

    mapCenter: [11.2943, 75.8736],      // IIM Kozhikode campus centre (verified)
    mapZoom: 17,

    /* LIVE FIXTURES from the sports committee's schedule sheet.
       The sheet must be shared as "Anyone with the link → Viewer".
       If it can't be read, or its layout changes, the site falls back
       to fixtures.js. Set id to "" to turn live sync off. */
    mapStartLayersHidden: [],          // optional: layer names to start switched off, e.g. ["8. Outside the Gate - Kunnamangalam"]
    scheduleSheet: {
      id: "1M5e54Ff0bAhkAeLbHIN5E2FSLR3fO5UtF8BzWR8HvCI",
      tabs: { D1: "Day 1 - 13th", D2: "Day 2 - 14th", D3: "Day 3 - 15th" }
    },

    /* OPTIONAL: other live lists from published Google Sheet CSVs (README §4). */
    liveSheets: { announcements: "", autos: "", buses: "" }
  },

  /* ---------------- EVENT DAYS ---------------- */
  days: [
    { key: "D1", label: "Day 1", date: "2026-11-13" },
    { key: "D2", label: "Day 2", date: "2026-11-14" },
    { key: "D3", label: "Day 3", date: "2026-11-15" }
  ],

  /* ---------------- ANNOUNCEMENTS ---------------- level: "info" | "alert" */
  announcements: [
    { level: "alert", text: "Two sports are OFF CAMPUS: cricket at the NIT Calicut ground (~7 km) and badminton at the Devagiri Sports Complex (~6–7 km). Everything else is on the IIMK campus." },
    { level: "info",  text: "Free campus buses loop between PGP Auditorium, D Landing, Phase V and the Main Gate from early morning to past midnight. Use the Travel tab to find your next bus." },
    { level: "info",  text: "Fixtures can move. Check Sportagon or the Sports tab before you head out." }
  ],

  /* ---------------- TEAMS ----------------
     letter = the code used in the fixture sheet ("B VS K").
     visiting: true for the six visiting contingents.
     hostel: the common room this IIM stays in: "cr-ab", "cr-df", "cr-j", "cr-eg" or "cr-mn".
     EDIT once allocations are final. */
  teams: [
    { id: "iimb", letter: "B", name: "IIM Bangalore",      short: "IIMB", color: "#b3141c", logo: "assets/iimb.png", visiting: true,  hostel: "" },
    { id: "iimv", letter: "V", name: "IIM Visakhapatnam",  short: "IIMV", color: "#e4572e", logo: "assets/iimv.png", visiting: true,  hostel: "" },
    { id: "iimt", letter: "T", name: "IIM Tiruchirappalli",short: "IIMT", color: "#f08a24", logo: "assets/iimt.png", visiting: true,  hostel: "" },
    { id: "iimi", letter: "I", name: "IIM Indore",         short: "IIMI", color: "#2e3192", logo: "assets/iimi.png", visiting: true,  hostel: "" },
    { id: "iimn", letter: "N", name: "IIM Nagpur",         short: "IIMN", color: "#e8a317", logo: "assets/iimn.png", visiting: true,  hostel: "" },
    { id: "iimm", letter: "M", name: "IIM Mumbai",         short: "IIMM", color: "#1b2a6b", logo: "assets/iimm.png", visiting: true,  hostel: "" },
    { id: "iimk", letter: "K", name: "IIM Kozhikode",      short: "IIMK", color: "#1f5aa6", logo: "assets/iimk.png", visiting: false, hostel: "" }
  ],

  /* ---------------- MAP CATEGORIES ---------------- */
  categories: [
    { id: "sports",    label: "Sports venues", emoji: "🏟️", color: "#e0a10b" },
    { id: "transport", label: "Bus stops & autos", emoji: "🚌", color: "#12a594" },
    { id: "food",      label: "Food",          emoji: "🍛", color: "#e5484d" },
    { id: "stay",      label: "Stay",          emoji: "🛏️", color: "#5b5bd6" },
    { id: "medical",   label: "Medical",       emoji: "🩺", color: "#d6336c" },
    { id: "city",      label: "Around Kozhikode", emoji: "🌴", color: "#6e56cf" }
  ],

  /* ---------------- PLACES ----------------
     Campus pins are APPROXIMATE (verified:false). Fix them in Google My Maps
     or with ?pick (README §3). `also` puts a place under extra categories.
     `gmaps` = text search used for directions (for well-known places). */
  places: [
    // Coordinates come from the IIMK Google My Map. mapName = the exact pin name there, so
    // links like "#map/football" open that pin. If you rename a pin in My Maps, update mapName.
    // Sports venues
    { id: "phase5",   cat: "sports", mapName: "Sports Complex IIMK", name: "Phase V Sports Complex", lat: 11.292292, lng: 75.87604,
      desc: "Futsal, frisbee, hockey, kabaddi and squash. Football, tennis and swimming are right next to it. Go down the stairs between the PT Usha and Mary Kom hostels." },
    { id: "football", cat: "sports", mapName: "Football Ground", name: "Football Ground (Phase V)", lat: 11.2918394, lng: 75.8759925, desc: "Football." },
    { id: "tennis",   cat: "sports", mapName: "Tennis Court", name: "Tennis Court (Phase V)", lat: 11.292406, lng: 75.8758018, desc: "Tennis." },
    { id: "swimming", cat: "sports", mapName: "Swimming pool", name: "Swimming Pool (Phase V)", lat: 11.2922917, lng: 75.876406, desc: "Swimming." },
    { id: "devagiri", cat: "sports", mapName: "Badminton, Devagiri Sports Complex", name: "Devagiri Sports Complex", lat: 11.2639971, lng: 75.8353342,
      gmaps: "Devagiri College Kozhikode", desc: "Badminton. OFF CAMPUS, about 6–7 km away in Kozhikode." },
    { id: "bball",    cat: "sports", mapName: "Basketball Court", name: "Basketball Court (Main Gate)", lat: 11.300364, lng: 75.873027, desc: "Basketball. Next to the main ground; take LEFT at the Main Gate." },
    { id: "volley",   cat: "sports", mapName: "Volleyball Court", name: "Volleyball Court (Main Gate)", lat: 11.300569, lng: 75.873075, desc: "Volleyball. Next to the main ground; take LEFT at the Main Gate." },
    { id: "mg-ground",cat: "sports", mapName: "Kho Kho and Throwball", name: "Main Gate Ground (Kho-Kho & Throwball)", lat: 11.3008104, lng: 75.8735103, desc: "Kho-kho and throwball." },
    { id: "eblock",   cat: "sports", mapName: "E1, E2, E3, E4 Classroom", name: "E1–E4 Classrooms (Phase V)", lat: 11.2924448, lng: 75.8748743,
      desc: "Second floor. E1: Table tennis (men) · E2: Table tennis (women) · E3: Carrom · E4: Chess." },
    { id: "gym",      cat: "sports", mapName: "Gymnasium", name: "Student Gymnasium", lat: 11.2915, lng: 75.873824, desc: "Powerlifting. Second floor, above J Mess." },
    { id: "pq",       cat: "sports", mapName: "PQ Common Room", name: "PQ Common Room", lat: 11.2919578, lng: 75.8754765, desc: "Pool. Some pool matches may be at the AB Common Room, so check the fixture." },
    { id: "nit",      cat: "sports", name: "NIT Calicut Cricket Ground", lat: 11.3216, lng: 75.9336, gmaps: "NIT Calicut, Kattangal, Kozhikode",
      desc: "Cricket. OFF CAMPUS, about 7 km away (₹250 one way / ₹500 return by auto)." },

    // Gates, buses & autos
    { id: "main-gate", cat: "transport", mapName: "IIM Kozhikode Main Gate", name: "Main Gate", lat: 11.301753, lng: 75.873565,
      desc: "Campus bus stop. Security check here, so keep your Inter-IIM ID ready. Team Namo autos wait here." },
    { id: "d-landing", cat: "transport", also: ["food"], mapName: "D landing", name: "D Landing", lat: 11.2920947, lng: 75.8736134,
      desc: "Campus bus stop, plus pickup for autos and cabs. The kiosk/cafe is open 3 pm–2:30 am." },
    { id: "phase5-stop", cat: "transport", mapName: "Bus Stop", name: "Phase V Bus Stop", lat: 11.2925577, lng: 75.8749792, desc: "Campus bus stop." },
    { id: "pgp-audi",  cat: "transport", name: "PGP Auditorium", lat: 11.2931, lng: 75.8732, verified: false, desc: "Campus bus stop. Start and end point for most bus runs." },

    // Food
    { id: "mess", cat: "food", mapName: "H Mess", name: "H Mess", lat: 11.292589, lng: 75.872198,
      desc: "Breakfast 8–10 am · Lunch 1–3 pm · Dinner 8–10:30 pm. Washrooms in A, B & C Blocks, and on the mess level and first floor." },
    { id: "night-mess", cat: "food", mapName: "J Top (Silver Spoon Night Mess)", name: "Night Mess (J Top)", lat: 11.2914706, lng: 75.8737486, desc: "Night mess 10 pm–2:30 am." },

    // Stay: contingent common rooms
    { id: "cr-ab", cat: "stay", mapName: "AB Common Room", name: "A & B Common Room", lat: 11.2930145, lng: 75.8742268, desc: "Washrooms: C Hostel. Some pool matches may be played here." },
    { id: "cr-df", cat: "stay", mapName: "DF Common Room", name: "D & F Common Room", lat: 11.2922309, lng: 75.8735439, desc: "Washrooms: K1 Hostel, K2 Hostel and the J Mess building." },
    { id: "cr-j",  cat: "stay", mapName: "J Common Room",  name: "J Common Room",     lat: 11.2916864, lng: 75.8737698, desc: "Washrooms: K1 Hostel, K2 Hostel and the J Mess building." },
    { id: "cr-eg", cat: "stay", mapName: "EG Common Room", name: "E & G Common Room", lat: 11.2925277, lng: 75.8735274, desc: "Washrooms: E Hostel and G Hostel." },
    { id: "cr-mn", cat: "stay", mapName: "MN Common Room", name: "M & N Common Room", lat: 11.2924253, lng: 75.8754009, desc: "Washrooms: Phase V building (all three floors)." },

    // Medical
    { id: "medical", cat: "medical", mapName: "Health Centre", name: "Health Centre", lat: 11.29628, lng: 75.872953, desc: "Campus medical centre. Go here first for any injury or illness." },
    { id: "gmch",    cat: "medical", name: "Govt. Medical College Hospital", lat: 11.2716, lng: 75.8373, gmaps: "Government Medical College Hospital Kozhikode",
      desc: "Nearest major hospital, about 9 km away. ₹270 by auto." },

    // Off-campus transport
    { id: "kgm",     cat: "transport", mapName: "Kunnamangalam Bus Stand", name: "Kunnamangalam (KGM) Bus Stand", lat: 11.304748, lng: 75.877826, gmaps: "Kunnamangalam Bus Stand",
      desc: "Buses to Kozhikode city and the railway station. KGM to hostel is ₹80 by auto." },
    { id: "rly",     cat: "transport", name: "Kozhikode Railway Station", lat: 11.2468, lng: 75.7807, gmaps: "Kozhikode Railway Station",
      desc: "About 16–18 km. ₹450 one way / ₹800 return by auto or taxi." },
    { id: "airport", cat: "transport", name: "Calicut International Airport (CCJ)", lat: 11.1369, lng: 75.9512, gmaps: "Calicut International Airport",
      desc: "About 35 km. Drop or pickup ₹900. Waiting and coming back ₹1,200." },

    // Around Kozhikode (fares from the Team Namo card)
    { id: "beach",      cat: "city", name: "Kozhikode Beach", lat: 11.2588, lng: 75.7712, gmaps: "Kozhikode Beach", desc: "Sunset and street food. ₹450 / ₹800 return." },
    { id: "kappad",     cat: "city", name: "Kappad Beach", lat: 11.3830, lng: 75.7190, gmaps: "Kappad Beach", desc: "Where Vasco da Gama landed. ₹900 / ₹1,200 return." },
    { id: "beypore",    cat: "city", name: "Beypore Beach", lat: 11.1597, lng: 75.8040, gmaps: "Beypore Beach", desc: "Long breakwater walk. ₹750 / ₹1,100 return." },
    { id: "thusharagiri", cat: "city", name: "Thusharagiri Waterfalls", lat: 11.4720, lng: 76.0530, gmaps: "Thusharagiri Waterfalls", desc: "Half-day trip. ₹950 / ₹1,400 return." },
    { id: "hilite",     cat: "city", name: "HiLITE Mall", lat: 11.2482, lng: 75.8340, gmaps: "HiLITE Mall Kozhikode", desc: "Malls, food court and movies. ₹350 / ₹700 return." }
  ],

  /* ---------------- SPORT → VENUE ----------------
     Keys match the sport names in the fixture sheet (without "(M)/(W)/(Mixed)"),
     unless a full name is given. */
  venues: {
    "Badminton": "devagiri", "Basketball": "bball", "Carrom": "eblock", "Chess": "eblock",
    "Cricket": "nit", "Football": "football", "Futsal": "phase5", "Frisbee": "phase5",
    "Hockey": "phase5", "Kabaddi": "phase5", "Kho-Kho": "mg-ground", "Pool": "pq",
    "Squash": "phase5", "Table Tennis": "eblock", "Tennis": "tennis", "Throwball": "mg-ground",
    "Volleyball": "volley", "Powerlifting": "gym", "Swimming": "swimming"
  },
  venueNotes: {
    "Table Tennis (M)": "E1 Classroom", "Table Tennis (W)": "E2 Classroom",
    "Carrom (Mixed)": "E3 Classroom", "Chess (M)": "E4 Classroom", "Chess (W)": "E4 Classroom",
    "Volleyball (M)": "Volleyball Court (left at Main Gate)", "Volleyball (W)": "Volleyball Court (left at Main Gate)",
    "Pool (M)": "PQ or AB Common Room", "Pool (W)": "PQ or AB Common Room", "Badminton (M)": "Devagiri (off campus)", "Badminton (W)": "Devagiri (off campus)",
    "Basketball (M)": "Basketball Court (left at Main Gate)", "Basketball (W)": "Basketball Court (left at Main Gate)"
  },
  sportEmoji: {
    "Badminton": "🏸", "Basketball": "🏀", "Carrom": "🎯", "Chess": "♟️", "Cricket": "🏏", "Football": "⚽",
    "Futsal": "🥅", "Frisbee": "🥏", "Hockey": "🏑", "Kabaddi": "🤼", "Kho-Kho": "🏃", "Pool": "🎱",
    "Squash": "🟢", "Table Tennis": "🏓", "Tennis": "🎾", "Throwball": "🤾", "Volleyball": "🏐",
    "Powerlifting": "🏋️", "Swimming": "🏊"
  },

  /* ---------------- AUTO & TAXI CHETTAS ----------------
     alt = second number seen on another list. Confirm before going live. */
  autos: [
    { name: "Aswanth",    phone: "+917025364310", team: "Team Namo" },
    { name: "Shikhil (Shikildas)", phone: "+918075749508", team: "Team Namo" },
    { name: "Shivaji",    phone: "+919048096464", team: "Team Namo" },
    { name: "Sidharth",   phone: "+919995820318", team: "Team Namo" },
    { name: "Biju",       phone: "+919846579340", team: "Team Namo" },
    { name: "Prassed (Praseeth)", phone: "+919446156719", alt: "+919037579511", team: "Team Namo" },
    { name: "Santhosh",   phone: "+919995317364", alt: "+919633553058", team: "Team Namo" },
    { name: "Ranjith (Renjith)", phone: "+917591909802", alt: "+917907767686", team: "Team Namo" },
    { name: "Subish",     phone: "+919847021751" },
    { name: "Jithesh",    phone: "+919961441341" },
    { name: "Sabish",     phone: "+919847798281" },
    { name: "Jamaludeen", phone: "+919539163173" },
    { name: "Gafoor",     phone: "+917736617452" },
    { name: "Mujeeb",     phone: "+919539773714" },
    { name: "Rihan",      phone: "+919656024060" },
    { name: "Madhu",      phone: "+919447950629" }
  ],

  /* ---------------- FARES (Team Namo call-taxi card, IIMK Main Gate) ----------------
     drop = one way from campus; ret = return trip (up to 2 hrs waiting). */
  fareNote: "Up to 2 hours of waiting is included in return fares. Each extra hour costs ₹100.",
  fares: [
    { group: "On & near campus", items: [
      { to: "Gate → Hostel", drop: 70 }, { to: "KGM (Kunnamangalam) → Hostel", drop: 80 },
      { to: "Monad → Hostel, Springway Bar", drop: 100 }, { to: "Miracle", drop: 100 },
      { to: "VR Residency, Lissy Hotel", drop: 120 }, { to: "Wakka Wakka", drop: 120 },
      { to: "Silver Spoon, Harahara Temple", drop: 140 }, { to: "Chandrettante Chayakkada", drop: 150 },
      { to: "Milma", drop: 150 }, { to: "CBI – Moozhikkal", drop: 220 },
      { to: "Dr. Cafe, E Max, NIT, Nirmala", drop: 250, ret: 500 }, { to: "Medical College", drop: 270 },
      { to: "KMCT", drop: 370 } ] },
    { group: "Kozhikode city, food & malls", items: [
      { to: "Hostel → Kozhikode City", drop: 400, ret: 800 }, { to: "HiLITE Mall", drop: 350, ret: 700 },
      { to: "Gulmohar, Choco Lick", drop: 350, ret: 700 }, { to: "Natural Ice Cream", drop: 350, ret: 700 },
      { to: "Regal Movie", drop: 400, ret: 800 }, { to: "Katsu, Le Arabia, Gokulam Mall", drop: 400, ret: 800 },
      { to: "Decathlon", drop: 400, ret: 800 }, { to: "Copper Kitchen, Eatmosphere", drop: 500, ret: 850 },
      { to: "Lady Loafella", drop: 500, ret: 900 }, { to: "Mukkam Movie", drop: 450 } ] },
    { group: "Travel", items: [
      { to: "Railway Station & Beach, Sea Queen, Taj", drop: 450, ret: 800 },
      { to: "Airport (drop or pickup)", drop: 900 }, { to: "Airport (waiting & coming back)", drop: 1200 },
      { to: "Passport Seva Kendra, West Hill", drop: 450 }, { to: "Foreign Office", drop: 550 } ] },
    { group: "Outings", items: [
      { to: "Kadav Resort", drop: 550, ret: 900 }, { to: "Beypore Beach", drop: 750, ret: 1100 },
      { to: "Kappad Beach", drop: 900, ret: 1200 }, { to: "Thusharagiri", drop: 950, ret: 1400 } ] }
  ],

  /* ---------------- CAMPUS BUSES (from Inter-IIM Bus Schedule) ----------------
     Each trip: d = day key, t = departure time from `from`, via = stops on the way. */
  busStops: ["Main Gate", "Phase V", "D Landing", "PGP Auditorium"],
  busStopPlace: { "Main Gate": "main-gate", "Phase V": "phase5-stop", "D Landing": "d-landing", "PGP Auditorium": "pgp-audi" },
  buses: [
    {"d": "D1", "t": "07:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "07:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D1", "t": "08:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "08:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D1", "t": "09:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "09:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "10:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "10:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "11:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "11:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "12:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "12:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "13:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "13:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "14:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "14:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "14:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D1", "t": "15:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "15:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "15:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "16:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "16:10", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "16:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D1", "t": "17:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "17:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "17:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "18:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "18:25", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "18:40", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "18:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "19:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "19:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "19:40", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "20:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "20:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "21:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "21:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "22:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D1", "t": "22:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "23:10", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D1", "t": "23:10", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D1", "t": "00:10", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D1", "t": "00:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "05:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D2", "t": "06:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "06:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D2", "t": "07:30", "from": "PGP Auditorium", "via": ["D Landing"], "to": "Phase V"},
    {"d": "D2", "t": "07:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D2", "t": "08:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "08:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "08:40", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "08:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "09:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "09:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "10:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "10:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "11:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "11:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "11:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D2", "t": "11:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "12:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "12:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "12:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D2", "t": "13:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "13:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "14:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "14:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D2", "t": "14:40", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "15:00", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "15:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "16:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "16:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "17:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "17:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "17:40", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "18:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "18:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "18:40", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "18:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "19:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "19:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "20:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "20:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "20:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D2", "t": "20:40", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "21:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "21:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "22:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "22:30", "from": "PGP Auditorium", "via": ["D Landing"], "to": "Phase V"},
    {"d": "D2", "t": "22:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D2", "t": "22:40", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "23:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D2", "t": "23:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D2", "t": "00:10", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D3", "t": "05:30", "from": "PGP Auditorium", "via": ["D Landing"], "to": "Phase V"},
    {"d": "D3", "t": "06:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "06:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D3", "t": "07:30", "from": "PGP Auditorium", "via": ["D Landing"], "to": "Phase V"},
    {"d": "D3", "t": "07:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D3", "t": "08:10", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D3", "t": "08:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "09:00", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "09:00", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "10:00", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "10:00", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "11:00", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D3", "t": "11:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "11:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "11:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D3", "t": "12:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "12:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "13:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "13:30", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "14:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "14:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "14:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D3", "t": "15:10", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "15:30", "from": "Main Gate", "via": [], "to": "Phase V"},
    {"d": "D3", "t": "15:40", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "16:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "16:30", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "17:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "17:25", "from": "PGP Auditorium", "via": ["D Landing"], "to": "Phase V"},
    {"d": "D3", "t": "17:40", "from": "PGP Auditorium", "via": ["D Landing", "Phase V"], "to": "Main Gate"},
    {"d": "D3", "t": "17:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "18:10", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "18:40", "from": "Main Gate", "via": ["Phase V", "D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "19:40", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D3", "t": "19:40", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"},
    {"d": "D3", "t": "20:10", "from": "Phase V", "via": [], "to": "Main Gate"},
    {"d": "D3", "t": "20:10", "from": "Phase V", "via": ["D Landing"], "to": "PGP Auditorium"}
  ],

  publicTransport: [
    { title: "City buses", text: "Private and KSRTC buses run along the Kozhikode–Wayanad road (NH 766) through Kunnamangalam. Get off at Kunnamangalam (KGM) stand and take an auto to the hostel (₹80)." },
    { title: "Autos & taxis", text: "The Team Namo stand is at the Main Gate. Use the fixed fares in the fare card, and agree the price before you ride." },
    { title: "Late night", text: "The last campus buses run just after midnight. After that, call a chettan from the list." }
  ],

  /* ---------------- WAYFINDING (from the placard signage plan) ---------------- */
  wayfinding: [
    { where: "Main Gate Ground", what: "Kho-Kho & Throwball", place: "mg-ground" },
    { where: "Courts by the main ground: take LEFT at the Main Gate", what: "Volleyball & Basketball", place: "volley" },
    { where: "Phase V Sports Complex (down the stairs between the PT Usha & Mary Kom hostels)", what: "Squash, Kabaddi, Frisbee, Futsal & Hockey", place: "phase5" },
    { where: "Phase V: Football Ground, Tennis Court, Swimming Pool", what: "Football, Tennis & Swimming", place: "football" },
    { where: "E1–E4 Classrooms, second floor, Phase V classroom entrance", what: "Table Tennis, Carrom & Chess", place: "eblock" },
    { where: "Devagiri Sports Complex (OFF CAMPUS, ~6–7 km)", what: "Badminton", place: "devagiri" },
    { where: "PQ or AB Common Room", what: "Pool", place: "pq" },
    { where: "Student Gymnasium, second floor above J Mess", what: "Powerlifting", place: "gym" },
    { where: "NIT Calicut (off campus, ~7 km)", what: "Cricket", place: "nit" }
  ],
  washrooms: [
    { at: "H Mess", use: "A Block, B Block & C Block · H Mess level & first floor", place: "mess" },
    { at: "A & B Common Room", use: "C Hostel", place: "cr-ab" },
    { at: "D & F Common Room", use: "K1 Hostel, K2 Hostel & J Mess building", place: "cr-df" },
    { at: "J Common Room", use: "K1 Hostel, K2 Hostel & J Mess building", place: "cr-j" },
    { at: "E & G Common Room", use: "E Hostel & G Hostel", place: "cr-eg" },
    { at: "M & N Common Room", use: "Phase 5 building (all three floors)", place: "cr-mn" },
    { at: "Phase 5 Sports Complex", use: "Phase 5 building (all three floors)", place: "phase5" }
  ],

  /* ---------------- FOOD ---------------- start/end are 24h; end past midnight is fine */
  food: [
    { meal: "Breakfast",  start: "08:00", end: "10:00", where: "mess" },
    { meal: "Lunch",      start: "13:00", end: "15:00", where: "mess" },
    { meal: "Dinner",     start: "20:00", end: "22:30", where: "mess" },
    { meal: "Night mess", start: "22:00", end: "02:30", where: "night-mess" },
    { meal: "D Landing kiosk", start: "15:00", end: "02:30", where: "d-landing" }
  ],

  /* ---------------- EMERGENCY ---------------- */
  emergency: [
    { label: "Emergency (all services)", phone: "112" },
    { label: "Ambulance", phone: "108" },
    { label: "IIMK switchboard", phone: "+914952809100" }
  ],

  /* ---------------- FAQ ---------------- */
  faqs: [
    { q: "Where can I find fixtures and results?", a: "The Sports tab has the full three-day schedule, filtered to your IIM if you pick it at the top. Live scores and results are on Sportagon." },
    { q: "How do I get around campus?", a: "Free buses link PGP Auditorium, D Landing, Phase V and the Main Gate all day. Open Travel → Campus bus, choose where you are and where you're going, and it shows the next buses." },
    { q: "Where are the washrooms?", a: "Each common room has assigned washroom buildings. See Help → Washrooms, or the signboard in your common room. At H Mess, use A, B or C Block, or the mess level and first floor." },
    { q: "How do I find the venues?", a: "Follow the placards. Kho-kho and throwball are at the Main Ground by the Main Gate. For volleyball and basketball, take LEFT at the Main Gate. Phase 5 has the sports complex plus the E1–E4 classrooms (table tennis, carrom, chess)." },
    { q: "Where is cricket?", a: "At the NIT Calicut cricket ground, about 7 km from campus. By auto it's ₹250 one way or ₹500 return." },
    { q: "Where can I eat at 1 am?", a: "The night mess is open 10 pm–2:30 am, and the D Landing kiosk is open 3 pm–2:30 am." },
    { q: "Do I need cash?", a: "UPI works almost everywhere. Keep some cash for autos and small shops as a backup." },
    { q: "Is it going to rain?", a: "Kozhikode can still get November showers. Check the weather card on the home screen. Outdoor fixtures may shift, and Sportagon will have the latest." }
  ],

  /* ---------------- MALAYALAM PHRASEBOOK ---------------- */
  phrases: [
    { en: "Hello",                     ml: "Namaskaram",            script: "നമസ്കാരം" },
    { en: "Thank you",                 ml: "Nanni",                 script: "നന്ദി" },
    { en: "Brother / Sister (polite)", ml: "Chetta / Chechi",       script: "ചേട്ടാ / ചേച്ചി" },
    { en: "How much?",                 ml: "Ethra aayi?",           script: "എത്ര ആയി?" },
    { en: "Take me to IIM",            ml: "IIM-lekku pokanam",     script: "ഐഐഎമ്മിലേക്ക് പോകണം" },
    { en: "Stop here",                 ml: "Ivide nirthu",          script: "ഇവിടെ നിർത്തൂ" },
    { en: "Slowly, please",            ml: "Pathukke",              script: "പതുക്കെ" },
    { en: "Where is…?",                ml: "… evideya?",            script: "… എവിടെയാ?" },
    { en: "Water",                     ml: "Vellam",                script: "വെള്ളം" },
    { en: "Okay",                      ml: "Sheri",                 script: "ശരി" },
    { en: "Don't want / No need",      ml: "Venda",                 script: "വേണ്ട" },
    { en: "I don't know Malayalam",    ml: "Enikku Malayalam ariyilla", script: "എനിക്ക് മലയാളം അറിയില്ല" }
  ]
};
