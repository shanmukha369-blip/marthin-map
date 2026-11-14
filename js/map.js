/**
 * MARS EXPLORER — PLANETARY GIS & 3D GLOBE ENGINE (map.js)
 * Combines:
 * 1. Verified NASA Mars Locations Dataset (MOLA Elevations & Coordinates)
 * 2. 3D WebGL/Canvas Interactive Mars Globe (Atmospheric Scattering & Day/Night Shading)
 * 3. 2D Planetary Topographic GIS Map (MOLA Color Ramp, Waypoint Navigation & Distance Ruler)
 *
 * Can be used as an ES module or directly via standard <script src="map.js">.
 */

// ============================================================================
// 1. MARS PLANETARY CONSTANTS & VERIFIED NASA LOCATIONS
// ============================================================================
const MARS_CONSTANTS = {
  RADIUS_KM: 3389.5,
  CIRCUMFERENCE_KM: 21297.0,
  GRAVITY_MSS: 3.721,
  SOL_DURATION_SECONDS: 88775.244,
  MEAN_SURFACE_PRESSURE_PA: 610,
  MEAN_SURFACE_TEMP_C: -63
};

const MARS_LOCATIONS = [
  {
    id: 'jezero',
    name: 'Jezero Crater',
    feature: 'Impact Crater & Ancient Delta',
    lat: 18.38,
    lon: 77.58,
    elevation: -2500, // MOLA datum (meters)
    diameterKm: 45.0,
    region: 'Syrtis Major Quadrangle',
    mission: 'NASA Mars 2020 (Perseverance & Ingenuity)',
    landingYear: 2021,
    scientificImportance: 'Ancient open-basin lake fed by an inflow river channel creating a fan-delta rich in clay minerals, smectites, and biosignature preservation potential.',
    hazards: [
      { type: 'Delta Escarpments', severity: 'CAUTION', detail: 'Steep 20-30m cliffs at delta front' },
      { type: 'Boulder Fields', severity: 'MODERATE', detail: 'Basaltic ejecta from Séítah formation' }
    ],
    images: [
      {
        title: 'Perseverance Mastcam-Z View of Kodiak Delta Remnant',
        nasaId: 'PIA24419',
        instrument: 'Mastcam-Z / Mars 2020',
        url: 'https://images-assets.nasa.gov/image/PIA24419/PIA24419~orig.jpg',
        caption: 'Stratified sedimentary rock layers confirming ancient sustained river inflow into Lake Jezero.'
      }
    ]
  },
  {
    id: 'gale',
    name: 'Gale Crater',
    feature: 'Impact Crater & Sedimentary Mound',
    lat: -5.40,
    lon: 137.80,
    elevation: -4500,
    diameterKm: 154.0,
    region: 'Aeolis Quadrangle',
    mission: 'NASA Mars Science Laboratory (Curiosity)',
    landingYear: 2012,
    scientificImportance: 'Central sedimentary peak (Aeolis Mons / Mount Sharp) rising 5.5 km from the crater floor, exposing billions of years of transition from wet clay environments to dry sulfate salts.',
    hazards: [
      { type: 'Active Sand Dunes', severity: 'HIGH', detail: 'Bagnold Dune field mobility and rover entrapment hazard' },
      { type: 'Sharp Ventifact Rocks', severity: 'MODERATE', detail: 'Grounded wind-carved stones causing wheel wear' }
    ],
    images: [
      {
        title: 'Curiosity Mastcam Mosaic of Mount Sharp',
        nasaId: 'PIA16069',
        instrument: 'Mastcam-100 / MSL Curiosity',
        url: 'https://images-assets.nasa.gov/image/PIA16069/PIA16069~orig.jpg',
        caption: 'Mount Sharp 5.5-kilometer layered mound towering above Gale Crater floor.'
      }
    ]
  },
  {
    id: 'olympus',
    name: 'Olympus Mons',
    feature: 'Giant Shield Volcano',
    lat: 18.65,
    lon: 226.20,
    elevation: 21229,
    diameterKm: 600.0,
    region: 'Tharsis Volcanic Province',
    mission: 'Orbital Reconnaissance (MRO, Viking, Mars Express)',
    scientificImportance: 'The largest planetary volcano known in the Solar System. Summit caldera is 80 km across and outer cliffs drop up to 8 km onto surrounding plains.',
    hazards: [
      { type: 'Extreme Basal Scarp', severity: 'CRITICAL', detail: 'Sheer vertical cliffs 6-8 km high surrounding perimeter' },
      { type: 'Hypobaric Thin Air', severity: 'CRITICAL', detail: 'Summit atmospheric pressure under 70 Pa (~0.07 kPa)' }
    ],
    images: [
      {
        title: 'Viking Orbiter Color Composite of Olympus Mons',
        nasaId: 'PIA02982',
        instrument: 'Viking Orbiter Camera',
        url: 'https://images-assets.nasa.gov/image/PIA02982/PIA02982~orig.jpg',
        caption: 'Full shield volcano spanning 600 km with summit caldera complex.'
      }
    ]
  },
  {
    id: 'valles',
    name: 'Valles Marineris',
    feature: 'Chasmata & Tectonic Rift System',
    lat: -13.90,
    lon: 300.80,
    elevation: -7000,
    diameterKm: 4000.0,
    region: 'Coprates / Margaritifer Sinus',
    mission: 'Orbital Reconnaissance',
    scientificImportance: 'A vast canyon system stretching over 4,000 km along the Martian equator, up to 200 km wide and 7 km deep, exposing bedrock down to primitive planetary crust.',
    hazards: [
      { type: 'Mass Wasting & Rockfalls', severity: 'CRITICAL', detail: 'Unstable canyon wall collapses and talus avalanches' },
      { type: 'Comms Shadow', severity: 'HIGH', detail: 'High canyon walls block low-angle satellite line of sight' }
    ],
    images: [
      {
        title: 'Viking Mosaic of Valles Marineris Canyon System',
        nasaId: 'PIA04304',
        instrument: 'Viking Orbiter 1',
        url: 'https://images-assets.nasa.gov/image/PIA04304/PIA04304~orig.jpg',
        caption: '4,000 km planetary canyon system across the equatorial belt.'
      }
    ]
  },
  {
    id: 'eberswalde',
    name: 'Eberswalde Crater',
    feature: 'Inverted River Delta',
    lat: -23.86,
    lon: 326.77,
    elevation: -1400,
    diameterKm: 65.3,
    region: 'Margaritifer Sinus Quadrangle',
    mission: 'Candidate Human Landing Zone',
    scientificImportance: 'Textbook exhumed meandering river delta preserved in relief, proving long-duration flowing surface water with complex distributary channels.',
    hazards: [
      { type: 'Inverted Ridge Topography', severity: 'MODERATE', detail: 'Narrow elevated gravel ridges with steep shoulders' }
    ],
    images: [
      {
        title: 'MGS MOC View of Eberswalde Delta',
        nasaId: 'PIA04869',
        instrument: 'MOC / Mars Global Surveyor',
        url: 'https://images-assets.nasa.gov/image/PIA04869/PIA04869~orig.jpg',
        caption: 'Inverted channel meanders radiating across the crater floor.'
      }
    ]
  },
  {
    id: 'endeavour',
    name: 'Endeavour Crater',
    feature: 'Impact Crater & Rim Hills',
    lat: -2.28,
    lon: 354.77,
    elevation: -1980,
    diameterKm: 22.0,
    region: 'Meridiani Planum',
    mission: 'NASA Mars Exploration Rover (Opportunity)',
    scientificImportance: 'Explored for 7 years by Opportunity rover, revealing ancient neutral-pH water chemistry, phyllosilicates, and gypsum veins.',
    hazards: [
      { type: 'Rim Slope Incline', severity: 'MODERATE', detail: 'Up to 32° slopes along Cape Tribulation' }
    ],
    images: [
      {
        title: 'Opportunity Pancam View Across Endeavour Crater',
        nasaId: 'PIA14750',
        instrument: 'Pancam / MER Opportunity',
        url: 'https://images-assets.nasa.gov/image/PIA14750/PIA14750~orig.jpg',
        caption: 'Western rim hills and crater floor viewed from Cape York.'
      }
    ]
  },
  {
    id: 'utopia',
    name: 'Utopia Planitia',
    feature: 'Vast Northern Basin & Subsurface Ice',
    lat: 46.70,
    lon: 117.50,
    elevation: -4000,
    diameterKm: 3300.0,
    region: 'Northern Lowlands',
    mission: 'Viking 2 (1976), CNSA Zhurong (2021)',
    scientificImportance: 'Largest confirmed impact basin on Mars. Ground-penetrating radar confirms massive subsurface water ice deposits exceeding Lake Superior volume.',
    hazards: [
      { type: 'Subzero Winter Frost', severity: 'HIGH', detail: 'Winter CO2 and H2O frost blankets surface' }
    ],
    images: [
      {
        title: 'Viking Lander 2 Boulders in Utopia Planitia',
        nasaId: 'PIA00568',
        instrument: 'Viking Lander 2',
        url: 'https://images-assets.nasa.gov/image/PIA00568/PIA00568~orig.jpg',
        caption: 'Porous volcanic boulders and duricrust on smooth northern basin plains.'
      }
    ]
  },
  {
    id: 'elysium',
    name: 'Elysium Planitia',
    feature: 'Smooth Volcanic Plain & Seismic Station',
    lat: 4.50,
    lon: 135.90,
    elevation: -2900,
    diameterKm: 1700.0,
    region: 'Elysium Quadrangle',
    mission: 'NASA InSight Lander (2018-2022)',
    scientificImportance: 'Smooth flat basaltic plains hosting InSight SEIS seismometer, which recorded over 1,300 marsquakes and mapped Mars liquid core.',
    hazards: [
      { type: 'Dust Deposition on Arrays', severity: 'HIGH', detail: 'Heavy atmospheric dust deposition reducing power output' }
    ],
    images: [
      {
        title: 'InSight IDC Camera View of Instrument Deployment',
        nasaId: 'PIA22958',
        instrument: 'IDC / InSight Lander',
        url: 'https://images-assets.nasa.gov/image/PIA22958/PIA22958~orig.jpg',
        caption: 'SEIS seismometer deployed on pebble-strewn volcanic plains.'
      }
    ]
  },
  {
    id: 'boreum',
    name: 'Planum Boreum (North Pole)',
    feature: 'Polar Ice Cap & Chasma Boreale',
    lat: 85.00,
    lon: 0.00,
    elevation: -2200,
    diameterKm: 1000.0,
    region: 'North Polar Region',
    mission: 'Orbital Reconnaissance (MRO, Mars Express)',
    scientificImportance: 'Permanent 3 km thick dome of water ice mixed with dust, capped seasonally by frozen CO2. Holds 5-million-year record of Martian climate oscillations.',
    hazards: [
      { type: 'Extreme Cryogenic Subzero', severity: 'CRITICAL', detail: 'Temperatures down to -143°C during polar night' }
    ],
    images: [
      {
        title: 'MRO MARCI Composite of North Polar Cap',
        nasaId: 'PIA13454',
        instrument: 'MARCI / MRO',
        url: 'https://images-assets.nasa.gov/image/PIA13454/PIA13454~orig.jpg',
        caption: 'Spiral trough pattern of water-ice and Chasma Boreale canyon.'
      }
    ]
  },
  {
    id: 'australe',
    name: 'Planum Australe (South Pole)',
    feature: 'Residual CO2 Ice Sheet & Layered Deposits',
    lat: -85.00,
    lon: 0.00,
    elevation: 2100,
    diameterKm: 350.0,
    region: 'South Polar Region',
    mission: 'Orbital Reconnaissance & MARSIS Radar',
    scientificImportance: 'Perennial carbon dioxide ice cap 8 meters thick overlying hundreds of meters of water ice.',
    hazards: [
      { type: 'CO2 Geysers in Spring', severity: 'CRITICAL', detail: 'Sublimation jets erupting sand and CO2 gas at high velocity' }
    ],
    images: [
      {
        title: 'MGS View of South Polar Cap',
        nasaId: 'PIA02394',
        instrument: 'MOC / Mars Global Surveyor',
        url: 'https://images-assets.nasa.gov/image/PIA02394/PIA02394~orig.jpg',
        caption: 'Swiss-cheese features formed by pitted CO2 sublimation depressions.'
      }
    ]
  },
  {
    id: 'arcadia',
    name: 'Arcadia Planitia',
    feature: 'Smooth Ice-Rich Lowland Basin',
    lat: 39.20,
    lon: 189.70,
    elevation: -3200,
    diameterKm: 1200.0,
    region: 'Diacria Quadrangle',
    mission: 'Human Base Candidate Zone',
    scientificImportance: 'Prime candidate for human landing due to extensive sheet ice buried merely 1 to 2.5 meters below surface.',
    hazards: [
      { type: 'Thermokarst Subsidence', severity: 'MODERATE', detail: 'Ground collapse risk if subsurface ice thaws under habitat' }
    ],
    images: [
      {
        title: 'HiRISE View of Patterned Ground in Arcadia',
        nasaId: 'PIA23485',
        instrument: 'HiRISE / MRO',
        url: 'https://images-assets.nasa.gov/image/PIA23485/PIA23485~orig.jpg',
        caption: 'Polygonal ground texture indicating massive shallow ice sheet.'
      }
    ]
  },
  {
    id: 'gusev',
    name: 'Gusev Crater',
    feature: 'Crater Basin & Columbia Hills',
    lat: -14.57,
    lon: 175.47,
    elevation: -1900,
    diameterKm: 166.0,
    region: 'Aeolis / Gusev Quadrangle',
    mission: 'NASA MER Spirit (2004)',
    scientificImportance: 'Site of Spirit rover landing. Discovered ancient hydrothermal spring silica deposits proving past volcanic hot springs.',
    hazards: [
      { type: 'Hidden Sulfate Soft Sand Traps', severity: 'HIGH', detail: 'Troy sand trap caused Spirit rover entrapment' }
    ],
    images: [
      {
        title: 'Spirit Panorama from Summit of Husband Hill',
        nasaId: 'PIA07997',
        instrument: 'Pancam / MER Spirit',
        url: 'https://images-assets.nasa.gov/image/PIA07997/PIA07997~orig.jpg',
        caption: '360-degree panorama of Gusev Crater floor from Columbia Hills peak.'
      }
    ]
  }
];

// ============================================================================
// 2. INTERACTIVE 3D MARS GLOBE ENGINE
// ============================================================================
class MarsGlobe3D {
  constructor(canvasId, onLocationSelect) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.onLocationSelect = onLocationSelect;

    this.radius = 180;
    this.rotationX = 0.25;
    this.rotationY = 1.35; // Centered on Jezero initially
    this.targetRotationY = 1.35;
    this.targetRotationX = 0.25;
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.autoRotate = true;
    this.hoveredLocation = null;
    this.selectedLocationId = 'jezero';

    this.initTexture();
    this.initEvents();
    this.resize();
    this.animate();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(380, rect.height || 460);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
    this.radius = Math.min(this.width, this.height) * 0.38 * this.zoom;
  }

  initTexture() {
    this.texWidth = 720;
    this.texHeight = 360;
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = this.texWidth;
    this.textureCanvas.height = this.texHeight;
    const tctx = this.textureCanvas.getContext('2d');

    // Base oxidized iron Martian surface gradient
    const baseGrad = tctx.createLinearGradient(0, 0, 0, this.texHeight);
    baseGrad.addColorStop(0, '#f8fafc'); // North Polar cap
    baseGrad.addColorStop(0.08, '#d97706');
    baseGrad.addColorStop(0.25, '#c2410c'); // Northern lowlands
    baseGrad.addColorStop(0.5, '#9a3412'); // Equatorial highlands
    baseGrad.addColorStop(0.75, '#7c2d12'); // Southern cratered highlands
    baseGrad.addColorStop(0.92, '#ea580c');
    baseGrad.addColorStop(1, '#f8fafc'); // South Polar cap
    tctx.fillStyle = baseGrad;
    tctx.fillRect(0, 0, this.texWidth, this.texHeight);

    // Syrtis Major dark volcanic province (lon ~77, lat ~18)
    tctx.fillStyle = 'rgba(67, 20, 7, 0.45)';
    tctx.beginPath();
    tctx.moveTo(this.texWidth * (77 / 360), this.texHeight * (0.5 - 18 / 180));
    tctx.lineTo(this.texWidth * (65 / 360), this.texHeight * (0.5 + 5 / 180));
    tctx.lineTo(this.texWidth * (85 / 360), this.texHeight * (0.5 + 2 / 180));
    tctx.closePath();
    tctx.fill();

    // Valles Marineris canyon rift (lon 280-320, lat -14)
    tctx.strokeStyle = 'rgba(30, 8, 3, 0.7)';
    tctx.lineWidth = 4;
    tctx.beginPath();
    tctx.moveTo(this.texWidth * (270 / 360), this.texHeight * (0.5 + 10 / 180));
    tctx.quadraticCurveTo(
      this.texWidth * (295 / 360),
      this.texHeight * (0.5 + 15 / 180),
      this.texWidth * (325 / 360),
      this.texHeight * (0.5 + 12 / 180)
    );
    tctx.stroke();

    // Olympus Mons caldera (lon 226, lat 18.6)
    const ox = this.texWidth * (226 / 360);
    const oy = this.texHeight * (0.5 - 18.6 / 180);
    const oGrad = tctx.createRadialGradient(ox, oy, 2, ox, oy, 22);
    oGrad.addColorStop(0, '#fbcfe8');
    oGrad.addColorStop(0.3, '#d97706');
    oGrad.addColorStop(1, 'rgba(124, 45, 18, 0)');
    tctx.fillStyle = oGrad;
    tctx.beginPath();
    tctx.arc(ox, oy, 22, 0, Math.PI * 2);
    tctx.fill();
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.targetRotationY += dx * 0.006;
        this.targetRotationX += dy * 0.006;
        this.targetRotationX = Math.max(-1.3, Math.min(1.3, this.targetRotationX));
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      } else {
        this.checkHover(e);
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      this.zoom = Math.max(0.7, Math.min(2.5, this.zoom * zoomFactor));
      this.radius = Math.min(this.width, this.height) * 0.38 * this.zoom;
    });

    this.canvas.addEventListener('click', () => {
      if (this.hoveredLocation) {
        this.selectLocation(this.hoveredLocation);
      }
    });

    // Touch support for mobile / tablets
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.autoRotate = false;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isDragging && e.touches.length === 1) {
        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;
        this.targetRotationY += dx * 0.006;
        this.targetRotationX += dy * 0.006;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      }
    });

    window.addEventListener('touchend', () => {
      this.isDragging = false;
    });

    window.addEventListener('resize', () => this.resize());
  }

  checkHover(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    let closest = null;
    let minDist = 24;

    for (const loc of MARS_LOCATIONS) {
      const pos = this.latLonToScreen(loc.lat, loc.lon);
      if (pos && pos.visible) {
        const dist = Math.hypot(mx - pos.x, my - pos.y);
        if (dist < minDist) {
          minDist = dist;
          closest = loc;
        }
      }
    }

    if (this.hoveredLocation !== closest) {
      this.hoveredLocation = closest;
      this.canvas.style.cursor = closest ? 'pointer' : 'grab';
    }
  }

  latLonToScreen(lat, lon) {
    const phi = (lat * Math.PI) / 180;
    const theta = (lon * Math.PI) / 180 + this.rotationY;

    const x = Math.cos(phi) * Math.sin(theta);
    const y = -Math.sin(phi);
    const z = Math.cos(phi) * Math.cos(theta);

    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);
    const y2 = y * cosX - z * sinX;
    const z2 = y * sinX + z * cosX;

    const centerX = this.width / 2;
    const centerY = this.height / 2;

    return {
      x: centerX + x * this.radius,
      y: centerY + y2 * this.radius,
      z: z2,
      visible: z2 > -0.1
    };
  }

  selectLocation(location) {
    this.selectedLocationId = location.id;
    const targetLon = (location.lon * Math.PI) / 180;
    this.targetRotationY = -targetLon + Math.PI / 2;
    this.targetRotationX = ((location.lat * Math.PI) / 180) * 0.6;
    this.autoRotate = false;

    if (this.onLocationSelect) {
      this.onLocationSelect(location);
    }
  }

  focusLocationById(id) {
    const loc = MARS_LOCATIONS.find((l) => l.id === id);
    if (loc) this.selectLocation(loc);
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    return this.autoRotate;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;

    this.rotationY += (this.targetRotationY - this.rotationY) * 0.12;
    this.rotationX += (this.targetRotationX - this.rotationX) * 0.12;

    if (this.autoRotate && !this.isDragging) {
      this.targetRotationY += 0.0018;
    }

    // Atmospheric Ray Scattering Halo
    const atmoGrad = ctx.createRadialGradient(cx, cy, this.radius * 0.96, cx, cy, this.radius * 1.18);
    atmoGrad.addColorStop(0, 'rgba(56, 189, 248, 0.28)');
    atmoGrad.addColorStop(0.3, 'rgba(234, 88, 12, 0.18)');
    atmoGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = atmoGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius * 1.18, 0, Math.PI * 2);
    ctx.fill();

    // Mars Globe Sphere Mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.clip();

    // Base Sphere Fill
    ctx.fillStyle = '#9a3412';
    ctx.fillRect(cx - this.radius, cy - this.radius, this.radius * 2, this.radius * 2);

    // Textured Slices
    const bands = 28;
    for (let i = 0; i < bands; i++) {
      const v1 = (i / bands) * Math.PI - Math.PI / 2;
      const v2 = ((i + 1) / bands) * Math.PI - Math.PI / 2;

      const y1 = cy - Math.sin(v1) * this.radius;
      const y2 = cy - Math.sin(v2) * this.radius;
      const rSlice = Math.cos((v1 + v2) / 2) * this.radius;

      if (rSlice <= 0) continue;

      const texV = (0.5 - (v1 + v2) / (2 * Math.PI)) * this.texHeight;
      const sampleWidth = this.texWidth;
      const offsetU = (((this.rotationY / (2 * Math.PI)) % 1) + 1) % 1;
      const sx = offsetU * sampleWidth;

      ctx.drawImage(
        this.textureCanvas,
        sx % sampleWidth,
        Math.max(0, Math.min(this.texHeight - 4, texV)),
        sampleWidth / 3,
        4,
        cx - rSlice,
        Math.min(y1, y2),
        rSlice * 2,
        Math.abs(y2 - y1) + 1
      );
    }

    // Day/Night Terminator Shading (Sun vector from top-left)
    const sunGrad = ctx.createRadialGradient(
      cx - this.radius * 0.45,
      cy - this.radius * 0.45,
      this.radius * 0.1,
      cx + this.radius * 0.2,
      cy + this.radius * 0.2,
      this.radius * 1.25
    );
    sunGrad.addColorStop(0, 'rgba(255, 245, 230, 0.25)');
    sunGrad.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    sunGrad.addColorStop(0.85, 'rgba(5, 8, 17, 0.75)');
    sunGrad.addColorStop(1, 'rgba(3, 7, 18, 0.95)');

    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // End globe mask

    // Render Location Hotspots & Labels
    MARS_LOCATIONS.forEach((loc) => {
      const pt = this.latLonToScreen(loc.lat, loc.lon);
      if (!pt || !pt.visible) return;

      const isSelected = loc.id === this.selectedLocationId;
      const isHovered = this.hoveredLocation && loc.id === this.hoveredLocation.id;
      const alpha = Math.max(0.35, Math.min(1.0, (pt.z + 0.3) / 1.3));
      const pulse = Math.sin(Date.now() * 0.005) * 2;

      ctx.fillStyle = isSelected ? '#00e5ff' : isHovered ? '#ff9800' : '#ff5722';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 5 + pulse : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isSelected ? `rgba(0, 229, 255, ${alpha})` : `rgba(255, 255, 255, ${alpha * 0.6})`;
      ctx.lineWidth = isSelected ? 2 : 1.2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 12 + pulse : 8, 0, Math.PI * 2);
      ctx.stroke();

      if (isSelected || isHovered || this.zoom > 1.2) {
        ctx.font = '10px "Space Grotesk", sans-serif';
        const labelText = loc.name;
        const textWidth = ctx.measureText(labelText).width;
        const boxX = pt.x + 14;
        const boxY = pt.y - 12;

        ctx.fillStyle = isSelected ? 'rgba(5, 20, 38, 0.9)' : 'rgba(10, 15, 29, 0.85)';
        ctx.strokeStyle = isSelected ? '#00e5ff' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, textWidth + 14, 24, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#38bdf8' : '#ffffff';
        ctx.fillText(labelText, boxX + 6, boxY + 14);
      }
    });
  }

  animate() {
    this.render();
    requestAnimationFrame(() => this.animate());
  }
}

// ============================================================================
// 3. 2D PLANETARY TOPOGRAPHIC GIS MAP ENGINE
// ============================================================================
class MarsMap2D {
  constructor(canvasId, onLocationSelect) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.onLocationSelect = onLocationSelect;

    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    this.selectedLocation = MARS_LOCATIONS[0];
    this.startLocation = MARS_LOCATIONS[0];
    this.destLocation = MARS_LOCATIONS[1];

    this.measuringMode = false;
    this.measurePoints = [];
    this.measuredDistanceKm = null;

    this.initEvents();
    this.resize();
    this.render();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = Math.max(400, rect.height || 520);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.scale(dpr, dpr);
    this.render();
  }

  geoToPixel(lat, lon) {
    const mapW = this.width * this.zoom;
    const mapH = this.height * this.zoom;
    const cx = this.width / 2 + this.panX;
    const cy = this.height / 2 + this.panY;

    const normalizedLon = ((lon % 360) + 360) % 360;
    const x = cx + ((normalizedLon - 180) / 360) * mapW;
    const y = cy - (lat / 180) * mapH;
    return { x, y };
  }

  pixelToGeo(px, py) {
    const mapW = this.width * this.zoom;
    const mapH = this.height * this.zoom;
    const cx = this.width / 2 + this.panX;
    const cy = this.height / 2 + this.panY;

    const lon = ((px - cx) / mapW) * 360 + 180;
    const lat = -((py - cy) / mapH) * 180;

    return {
      lat: Math.max(-90, Math.min(90, lat)),
      lon: ((lon % 360) + 360) % 360
    };
  }

  initEvents() {
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (mx >= 0 && mx <= this.width && my >= 0 && my <= this.height) {
        const geo = this.pixelToGeo(mx, my);
        const hud = document.getElementById('map-cursor-coords');
        if (hud) hud.textContent = `${Math.abs(geo.lat).toFixed(2)}° ${geo.lat >= 0 ? 'N' : 'S'}, ${geo.lon.toFixed(2)}° E`;
      }

      if (this.isDragging) {
        this.panX = e.clientX - this.startX;
        this.panY = e.clientY - this.startY;
        this.render();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.15 : 0.85;
      this.zoom = Math.max(1.0, Math.min(8.0, this.zoom * factor));
      this.render();
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      if (this.measuringMode) {
        const geo = this.pixelToGeo(mx, my);
        this.measurePoints.push(geo);
        if (this.measurePoints.length === 2) {
          this.measuredDistanceKm = this.calcDistance(
            this.measurePoints[0].lat,
            this.measurePoints[0].lon,
            this.measurePoints[1].lat,
            this.measurePoints[1].lon
          );
        } else if (this.measurePoints.length > 2) {
          this.measurePoints = [geo];
          this.measuredDistanceKm = null;
        }
        this.render();
        return;
      }

      for (const loc of MARS_LOCATIONS) {
        const pt = this.geoToPixel(loc.lat, loc.lon);
        if (Math.hypot(mx - pt.x, my - pt.y) <= 18) {
          this.selectLocation(loc);
          break;
        }
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  calcDistance(lat1, lon1, lat2, lon2) {
    const R = MARS_CONSTANTS.RADIUS_KM;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  selectLocation(loc) {
    this.selectedLocation = loc;
    if (this.onLocationSelect) this.onLocationSelect(loc);
    this.render();
  }

  setStartLocation(loc) {
    this.startLocation = loc;
    this.render();
  }

  setDestLocation(loc) {
    this.destLocation = loc;
    this.render();
  }

  panToLocation(loc) {
    this.zoom = Math.max(this.zoom, 2.2);
    const mapW = this.width * this.zoom;
    const mapH = this.height * this.zoom;
    const normalizedLon = ((loc.lon % 360) + 360) % 360;
    this.panX = -(((normalizedLon - 180) / 360) * mapW);
    this.panY = (loc.lat / 180) * mapH;
    this.selectLocation(loc);
  }

  toggleMeasureTool() {
    this.measuringMode = !this.measuringMode;
    this.measurePoints = [];
    this.measuredDistanceKm = null;
    this.render();
    return this.measuringMode;
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    const mapW = this.width * this.zoom;
    const mapH = this.height * this.zoom;
    const cx = this.width / 2 + this.panX;
    const cy = this.height / 2 + this.panY;

    // NASA MOLA Topographic Elevation Color Ramp
    const molaGrad = ctx.createLinearGradient(0, cy - mapH / 2, 0, cy + mapH / 2);
    molaGrad.addColorStop(0, '#f1f5f9'); // North Polar cap
    molaGrad.addColorStop(0.12, '#0284c7'); // Lowland Basin (-4000m)
    molaGrad.addColorStop(0.28, '#0d9488'); // Vastitas Borealis
    molaGrad.addColorStop(0.45, '#ca8a04'); // Datum 0m
    molaGrad.addColorStop(0.55, '#c2410c'); // Cratered Highlands
    molaGrad.addColorStop(0.75, '#991b1b'); // High Plateaus
    molaGrad.addColorStop(1, '#f8fafc'); // South Polar cap

    ctx.fillStyle = molaGrad;
    ctx.fillRect(cx - mapW / 2, cy - mapH / 2, mapW, mapH);

    // Active Geodesic Route Line
    if (this.startLocation && this.destLocation && this.startLocation.id !== this.destLocation.id) {
      const pStart = this.geoToPixel(this.startLocation.lat, this.startLocation.lon);
      const pDest = this.geoToPixel(this.destLocation.lat, this.destLocation.lon);

      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pDest.x, pDest.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Distance Measurement Ruler
    if (this.measuringMode && this.measurePoints.length === 2 && this.measuredDistanceKm !== null) {
      const p1 = this.geoToPixel(this.measurePoints[0].lat, this.measurePoints[0].lon);
      const p2 = this.geoToPixel(this.measurePoints[1].lat, this.measurePoints[1].lon);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    // Render Location Pins
    MARS_LOCATIONS.forEach((loc) => {
      const pt = this.geoToPixel(loc.lat, loc.lon);
      const isSelected = this.selectedLocation && loc.id === this.selectedLocation.id;

      ctx.fillStyle = isSelected ? '#00e5ff' : '#ea580c';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isSelected ? 6 : 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.font = isSelected ? 'bold 11px sans-serif' : '10px sans-serif';
      ctx.fillStyle = isSelected ? '#00e5ff' : '#ffffff';
      ctx.fillText(loc.name, pt.x + 8, pt.y + 3);
    });
  }
}

// Make accessible to browser global scope & module systems
if (typeof window !== 'undefined') {
  window.MarsGlobe3D = MarsGlobe3D;
  window.MarsMap2D = MarsMap2D;
  window.MARS_LOCATIONS = MARS_LOCATIONS;
  window.MARS_CONSTANTS = MARS_CONSTANTS;
}

export { MarsGlobe3D, MarsMap2D, MARS_LOCATIONS, MARS_CONSTANTS };
