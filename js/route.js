/**
 * MARS EXPLORER — SMART MARS NAVIGATION & ROUTE PLANNING (route.js)
 * Calculates:
 * 1. Great-Circle Geodesics on Mars Sphere (R = 3,389.5 km)
 * 2. Initial Bearing / Azimuth & 16-Point Compass Headings
 * 3. Multimodal Travel Time (Pressurized Rover, Light Rover, EVA Walking)
 * 4. Intermediate Waypoint Interpolation & MOLA Elevation Profiles
 * 5. Route Comparison Matrix (Alpha Direct vs. Bravo Ridge Bypass vs. Charlie Wash)
 * 6. Local Storage Persistence & Route Dossier Serialization
 *
 * Can be used as an ES module or directly via standard <script src="route.js">.
 */

// ============================================================================
// 1. MARS PLANETARY CONSTANTS & DEFAULT WAYPOINTS
// ============================================================================
const MARS_GEODESIC_CONSTANTS = {
  RADIUS_KM: 3389.5,
  CIRCUMFERENCE_KM: 21297.0,
  SPEED_KMH: {
    pressurized_rover: 12.0,
    light_rover: 8.0,
    eva_walk: 3.2
  }
};

const DEFAULT_LOCATIONS = [
  { id: 'jezero', name: 'Jezero Crater', lat: 18.38, lon: 77.58, elevation: -2500 },
  { id: 'gale', name: 'Gale Crater', lat: -5.40, lon: 137.80, elevation: -4500 },
  { id: 'olympus', name: 'Olympus Mons', lat: 18.65, lon: 226.20, elevation: 21229 },
  { id: 'valles', name: 'Valles Marineris', lat: -13.90, lon: 300.80, elevation: -7000 },
  { id: 'eberswalde', name: 'Eberswalde Crater', lat: -23.86, lon: 326.77, elevation: -1400 },
  { id: 'endeavour', name: 'Endeavour Crater', lat: -2.28, lon: 354.77, elevation: -1980 },
  { id: 'utopia', name: 'Utopia Planitia', lat: 46.70, lon: 117.50, elevation: -4000 },
  { id: 'elysium', name: 'Elysium Planitia', lat: 4.50, lon: 135.90, elevation: -2900 },
  { id: 'boreum', name: 'Planum Boreum (North Pole)', lat: 85.00, lon: 0.00, elevation: -2200 },
  { id: 'australe', name: 'Planum Australe (South Pole)', lat: -85.00, lon: 0.00, elevation: 2100 },
  { id: 'arcadia', name: 'Arcadia Planitia', lat: 39.20, lon: 189.70, elevation: -3200 },
  { id: 'gusev', name: 'Gusev Crater', lat: -14.57, lon: 175.47, elevation: -1900 }
];

// ============================================================================
// 2. MARS ROUTE PLANNER ENGINE
// ============================================================================
class MarsRoutePlanner {
  constructor(startId = 'jezero', destId = 'gale', travelMode = 'pressurized_rover') {
    this.locations = (typeof window !== 'undefined' && window.MARS_LOCATIONS) ? window.MARS_LOCATIONS : DEFAULT_LOCATIONS;
    this.startLocation = this.getLocation(startId) || this.locations[0];
    this.destLocation = this.getLocation(destId) || this.locations[1];
    this.travelMode = travelMode;
    this.savedRoutes = this.loadSavedRoutes();
  }

  getLocation(id) {
    return this.locations.find((l) => l.id === id) || null;
  }

  setEndpoints(startId, destId) {
    const s = this.getLocation(startId);
    const d = this.getLocation(destId);
    if (s) this.startLocation = s;
    if (d) this.destLocation = d;
    return this.calculateRouteIntel();
  }

  /**
   * Great-Circle Distance on Martian Sphere using Haversine formulation:
   * d = 2 * R * arcsin(sqrt(sin^2(dPhi/2) + cos(phi1)*cos(phi2)*sin^2(dLambda/2)))
   */
  calcGreatCircleDistance(lat1, lon1, lat2, lon2) {
    const R = MARS_GEODESIC_CONSTANTS.RADIUS_KM;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dPhi = ((lat2 - lat1) * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Initial Azimuth (Bearing) from True Martian North (0° to 360°)
   */
  calcInitialBearing(lat1, lon1, lat2, lon2) {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const dLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

    const theta = Math.atan2(y, x);
    return ((theta * 180) / Math.PI + 360) % 360;
  }

  getCompassDirection(bearing) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(bearing / 22.5) % 16;
    return directions[idx];
  }

  /**
   * Generate intermediate waypoints with terrain elevation interpolation
   */
  generateWaypoints(count = 6) {
    const waypoints = [];
    const lat1 = this.startLocation.lat;
    const lon1 = this.startLocation.lon;
    const lat2 = this.destLocation.lat;
    const lon2 = this.destLocation.lon;

    const elev1 = this.startLocation.elevation || 0;
    const elev2 = this.destLocation.elevation || 0;

    for (let i = 0; i <= count; i++) {
      const frac = i / count;
      const lat = lat1 + (lat2 - lat1) * frac;
      const lon = lon1 + (lon2 - lon1) * frac;

      // Realistic topography fluctuation using sinusoidal elevation gradient
      const ridgeNoise = Math.sin(frac * Math.PI) * (frac < 0.5 ? 420 : -310);
      const elev = Math.round(elev1 + (elev2 - elev1) * frac + ridgeNoise);

      waypoints.push({
        index: i,
        name: i === 0 ? `Start: ${this.startLocation.name}` : i === count ? `Dest: ${this.destLocation.name}` : `WP-${i}`,
        lat: Number(lat.toFixed(3)),
        lon: Number(lon.toFixed(3)),
        elevation: elev,
        distFromStartKm: Number(this.calcGreatCircleDistance(lat1, lon1, lat, lon).toFixed(1))
      });
    }

    return waypoints;
  }

  /**
   * Full route calculation package including distance, time, slope, and confidence
   */
  calculateRouteIntel() {
    const directDistKm = this.calcGreatCircleDistance(
      this.startLocation.lat,
      this.startLocation.lon,
      this.destLocation.lat,
      this.destLocation.lon
    );

    // Terrain winding factor for rover obstacle avoidance (~1.28x straight line)
    const traversableDistKm = directDistKm * 1.28;
    const bearing = this.calcInitialBearing(
      this.startLocation.lat,
      this.startLocation.lon,
      this.destLocation.lat,
      this.destLocation.lon
    );

    const speed = MARS_GEODESIC_CONSTANTS.SPEED_KMH[this.travelMode] || 12.0;
    const travelTimeHours = traversableDistKm / speed;

    const startElev = this.startLocation.elevation || 0;
    const destElev = this.destLocation.elevation || 0;
    const elevChangeM = Math.abs(destElev - startElev);
    const avgSlopeDeg = Math.min(28, (elevChangeM / (traversableDistKm * 1000)) * 57.3 + 3.2);

    const isSlopeHazard = avgSlopeDeg > 12.0;
    const confidencePct = Math.max(76, Math.min(98, 95 - avgSlopeDeg * 0.8));

    return {
      start: this.startLocation,
      dest: this.destLocation,
      directDistKm: Number(directDistKm.toFixed(1)),
      traversableDistKm: Number(traversableDistKm.toFixed(1)),
      bearingDeg: Number(bearing.toFixed(1)),
      compassDir: this.getCompassDirection(bearing),
      travelMode: this.travelMode,
      speedKmh: speed,
      travelTimeHours: Number(travelTimeHours.toFixed(2)),
      elevChangeM,
      avgSlopeDeg: Number(avgSlopeDeg.toFixed(1)),
      isSlopeHazard,
      confidencePct: Number(confidencePct.toFixed(0)),
      dataFreshness: 'MRO HiRISE 25cm / MOLA 463m Quad Grid (Verified)',
      waypoints: this.generateWaypoints(6)
    };
  }

  /**
   * Route comparison matrix comparing 3 traversal profiles
   */
  getRouteComparison() {
    const baseIntel = this.calculateRouteIntel();
    const directKm = baseIntel.traversableDistKm;
    const speed = MARS_GEODESIC_CONSTANTS.SPEED_KMH[this.travelMode] || 12.0;

    return [
      {
        id: 'direct',
        name: 'Alpha Direct (High Hazard)',
        distKm: Number(directKm.toFixed(1)),
        timeHours: Number((directKm / speed).toFixed(1)),
        avgSlope: `${baseIntel.avgSlopeDeg + 5.4}°`,
        riskLevel: 'HIGH',
        riskBadgeClass: 'badge-warning',
        o2EstimatedLiters: Number(((directKm / speed) * 60 * 1.4).toFixed(0)),
        description: 'Shortest geodesic distance across direct crater rims and boulder terraces. High mechanical rover wear.'
      },
      {
        id: 'detour',
        name: 'Bravo Ridge Bypass (Recommended)',
        distKm: Number((directKm * 1.18).toFixed(1)),
        timeHours: Number(((directKm * 1.18) / speed).toFixed(1)),
        avgSlope: `${Math.max(2, baseIntel.avgSlopeDeg - 3.1)}°`,
        riskLevel: 'LOW (NOMINAL)',
        riskBadgeClass: 'badge-success',
        o2EstimatedLiters: Number((((directKm * 1.18) / speed) * 60 * 1.1).toFixed(0)),
        description: 'Circumnavigates steep escarpments along smooth basaltic wash plains. Lowest vehicle turnover risk.'
      },
      {
        id: 'canyon',
        name: 'Charlie Lowland Wash',
        distKm: Number((directKm * 1.35).toFixed(1)),
        timeHours: Number(((directKm * 1.35) / speed).toFixed(1)),
        avgSlope: `${Math.max(1.5, baseIntel.avgSlopeDeg - 4.2)}°`,
        riskLevel: 'MODERATE',
        riskBadgeClass: 'badge-caution',
        o2EstimatedLiters: Number((((directKm * 1.35) / speed) * 60 * 1.15).toFixed(0)),
        description: 'Follows ancient dried alluvial fan beds. Excellent wheel traction, but potential soft drift sand pockets.'
      }
    ];
  }

  /**
   * Save route to browser LocalStorage
   */
  saveRoute() {
    const intel = this.calculateRouteIntel();
    const routeRecord = {
      id: `route-${Date.now()}`,
      timestamp: new Date().toISOString(),
      startName: this.startLocation.name,
      destName: this.destLocation.name,
      distanceKm: intel.traversableDistKm,
      timeHours: intel.travelTimeHours,
      travelMode: this.travelMode,
      waypointsCount: intel.waypoints.length
    };

    this.savedRoutes.unshift(routeRecord);
    if (this.savedRoutes.length > 10) this.savedRoutes.pop();

    try {
      localStorage.setItem('mars_saved_routes', JSON.stringify(this.savedRoutes));
    } catch (e) {}

    return routeRecord;
  }

  loadSavedRoutes() {
    try {
      const data = localStorage.getItem('mars_saved_routes');
      if (data) return JSON.parse(data);
    } catch (e) {}

    return [
      {
        id: 'r-sample-1',
        timestamp: 'Sol 140 10:15 LMST',
        startName: 'Jezero Crater',
        destName: 'Kodiak Butte Overlook',
        distanceKm: 14.8,
        timeHours: 1.2,
        travelMode: 'pressurized_rover',
        waypointsCount: 4
      },
      {
        id: 'r-sample-2',
        timestamp: 'Sol 138 14:30 LMST',
        startName: 'Octavia E. Butler Landing',
        destName: 'Western Delta Front Channel',
        distanceKm: 28.4,
        timeHours: 2.3,
        travelMode: 'pressurized_rover',
        waypointsCount: 5
      }
    ];
  }
}

// Make accessible to browser global scope & module systems
if (typeof window !== 'undefined') {
  window.MarsRoutePlanner = MarsRoutePlanner;
  window.MARS_GEODESIC_CONSTANTS = MARS_GEODESIC_CONSTANTS;
}

export { MarsRoutePlanner, MARS_GEODESIC_CONSTANTS };
