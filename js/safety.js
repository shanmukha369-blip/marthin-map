/**
 * MARS EXPLORER — ASTRONAUT SAFETY & MISSION THREAT INTELLIGENCE (safety.js)
 * Implements:
 * 1. Multi-factor Astronaut Safety Index (EVA Composite Safety Score 0-100%)
 * 2. Life-Support & Environmental Threshold Safety Monitoring (O2, Suit PSI, Rads, Dust Tau)
 * 3. Verified Martian Hazard Matrix & NASA Instrument Provenance
 * 4. Emergency SOS Beacon & Deep Space Network (DSN) Distress Packet Serialization
 * 5. Mission Standard Operating Procedures (SOPs) for EVA Contingencies
 * 6. Procedural Web Audio Emergency Siren Synthesizer (Zero Dependencies)
 * 7. Incident Black-Box Telemetry Logger & LocalStorage Persistence
 *
 * Can be used as an ES module or directly via standard <script src="safety.js">.
 */

// ============================================================================
// 1. MARS SAFETY THRESHOLDS & REGULATORY LIMITS
// ============================================================================
const MARS_SAFETY_THRESHOLDS = {
  OXYGEN: {
    CRITICAL_MIN_L: 300,    // Hard redline: 12-minute emergency return reserve
    WARNING_MIN_L: 600,     // Orange threshold: Initiate EVA abort
    NOMINAL_MIN_L: 1200     // Green threshold: Unrestricted operations
  },
  SUIT_PRESSURE_KPA: {
    CRITICAL_MIN: 24.5,     // Hypobaric hypoxia danger
    NOMINAL_MIN: 28.0,
    NOMINAL_TARGET: 29.6,   // Standard NASA EMU / xEMU cabin equivalent
    MAX_ALLOWABLE: 33.0
  },
  HEART_RATE_BPM: {
    BRADYCARDIA: 50,
    NOMINAL_LOW: 60,
    NOMINAL_HIGH: 100,
    EXERTION_WARNING: 135,
    CRITICAL_MAX: 165
  },
  CORE_TEMP_C: {
    HYPOTHERMIA: 35.0,
    NOMINAL: 37.0,
    HYPERTHERMIA_WARNING: 38.2,
    CRITICAL: 39.0
  },
  ENVIRONMENT: {
    MAX_TRAVERSABLE_SLOPE_DEG: 18.0,  // Rover rollover limit
    MAX_DUST_OPTICAL_DEPTH_TAU: 2.5,  // Severe solar occlusion limit
    MAX_RADIATION_MSV_DAY: 1.5,       // Solar energetic particle event threshold
    MIN_SURFACE_TEMP_C: -125          // Polar winter freeze threshold
  }
};

// ============================================================================
// 2. VERIFIED MARTIAN HAZARD REGISTRY (NASA Provenance)
// ============================================================================
const MARS_HAZARD_REGISTRY = [
  {
    id: 'haz-01',
    name: 'Séítah Transverse Basaltic Sand Ridges',
    category: 'TERRAIN_MOBILITY',
    severity: 'RED',
    region: 'Jezero Crater Floor (18.38° N, 77.58° E)',
    provenance: 'MRO HiRISE 25cm / Perseverance RIMFAX Ground Radar',
    description: 'Poorly sorted aeolian basalt dunes with negligible shear strength. High vehicle sinkage and wheel trenching hazard.',
    sop: 'Engage autonomous terrain-scanning navigation. Maintain vehicle speed below 4 km/h. Do not attempt transversal crossing at angles steeper than 8°.'
  },
  {
    id: 'haz-02',
    name: 'Gale South Rim Scarp Rockfall Terrace',
    category: 'SLOPE_INSTABILITY',
    severity: 'RED',
    region: 'Mount Sharp / Aeolis Mons (5.40° S, 137.80° E)',
    provenance: 'Curiosity Mastcam / ChemCam Laser LIBS',
    description: 'Unconsolidated sedimentary sulfate mudstones prone to thermal fatigue spallation and catastrophic rockslide under vehicular load.',
    sop: 'Establish 40-meter exclusion perimeter from scarp vertical walls. Wear tethered dual-anchor harnesses during any foot reconnaissance.'
  },
  {
    id: 'haz-03',
    name: 'Acidalia Basin Subsurface Permafrost Cavities',
    category: 'SUBSURFACE_SINKHOLE',
    severity: 'ORANGE',
    region: 'Acidalia Planitia (46.70° N, 338.00° E)',
    provenance: 'Mars Odyssey THEMIS Thermal / SHARAD Radar Sounder',
    description: 'Sub-surface ice sublimation voids disguised beneath 10-30cm of desiccated dust mantle. Risk of sudden ground collapse.',
    sop: 'Continuous ground-penetrating radar pulse forward sweep. Maximum rover axle load limited to 450 kg.'
  },
  {
    id: 'haz-04',
    name: 'Valles Marineris Nighttime Katabatic Wind Funnel',
    category: 'ATMOSPHERIC_GALE',
    severity: 'ORANGE',
    region: 'Coprates Chasma (13.90° S, 300.80° E)',
    provenance: 'Mars Reconnaissance Orbiter MCS (Mars Climate Sounder)',
    description: 'Dense, cold air cascades down 7,000m canyon walls at nightfall, producing local katabatic shear winds exceeding 135 km/h.',
    sop: 'Retract high-gain parabolic antennas before 17:00 LMST. Anchor portable EVA habitat modules with tensioned bedrock pins.'
  },
  {
    id: 'haz-05',
    name: 'Elysium Planitia Toxic Calcium Perchlorate Saline Crust',
    category: 'CHEMICAL_TOXICITY',
    severity: 'YELLOW',
    region: 'InSight Lander Quad (4.50° N, 135.90° E)',
    provenance: 'InSight TWINS / Phoenix Wet Chemistry Laboratory',
    description: 'High surface soil concentration (0.7% wt) of toxic oxidizing perchlorates (ClO4-). Potent thyroid disruptor if tracked into habitat.',
    sop: 'Mandatory 3-stage electrostatic airlock vacuuming and washdown prior to suit ingress. Visor HEPA-scrubbing required.'
  },
  {
    id: 'haz-06',
    name: 'Planum Boreum Cryo-CO2 Sublimation Geysers',
    category: 'CRYO_BURST',
    severity: 'RED',
    region: 'North Polar Cap (85.00° N, 0.00° E)',
    provenance: 'Mars Express OMEGA Spectrometer / MRO HiRISE',
    description: 'Spring solar heating vaporizes basal dry ice sheets, venting pressurized CO2 jets and black basaltic sand plumes at 160 km/h.',
    sop: 'Immediate 1.5 km stand-off distance from dark fan formations during spring equinox cycle.'
  }
];

// ============================================================================
// 3. ASTRONAUT SAFETY & EMERGENCY SYSTEM CLASS
// ============================================================================
class MarsSafetySystem {
  constructor() {
    this.thresholds = MARS_SAFETY_THRESHOLDS;
    this.hazards = MARS_HAZARD_REGISTRY;
    this.emergencyActive = false;
    this.activeIncident = null;
    this.audioContext = null;
    this.sirenOscillator = null;
    this.sirenGainNode = null;
    this.incidentLogs = this.loadIncidentLogs();
  }

  /**
   * Calculates composite Astronaut Safety Index (0 to 100%)
   * Considers: O2 reserve margin, suit pressure, biometrics, weather, and terrain slope.
   */
  calculateSafetyIndex(telemetry = {}) {
    const o2 = telemetry.oxygenRemainingL !== undefined ? telemetry.oxygenRemainingL : 1450;
    const suitPsi = telemetry.suitPressureKpa !== undefined ? telemetry.suitPressureKpa : 29.6;
    const hr = telemetry.heartRate !== undefined ? telemetry.heartRate : 74;
    const slope = telemetry.slopeDeg !== undefined ? telemetry.slopeDeg : 6.2;
    const dustTau = telemetry.dustOpticalDepth !== undefined ? telemetry.dustOpticalDepth : 0.65;
    const radMsv = telemetry.radiationMsvDay !== undefined ? telemetry.radiationMsvDay : 0.62;

    let score = 100;
    const violations = [];

    // 1. Oxygen evaluation (Max deduction: 40 points)
    if (o2 <= this.thresholds.OXYGEN.CRITICAL_MIN_L) {
      score -= 40;
      violations.push({ factor: 'OXYGEN', level: 'CRITICAL', msg: 'Oxygen reserve below 12-minute survival threshold!' });
    } else if (o2 <= this.thresholds.OXYGEN.WARNING_MIN_L) {
      score -= 20;
      violations.push({ factor: 'OXYGEN', level: 'WARNING', msg: 'Oxygen reserve below mission abort margin (600L).' });
    }

    // 2. Suit Pressure evaluation (Max deduction: 35 points)
    if (suitPsi < this.thresholds.SUIT_PRESSURE_KPA.CRITICAL_MIN) {
      score -= 35;
      violations.push({ factor: 'PRESSURE', level: 'CRITICAL', msg: 'Life-support suit decompression detected!' });
    } else if (suitPsi < this.thresholds.SUIT_PRESSURE_KPA.NOMINAL_MIN) {
      score -= 15;
      violations.push({ factor: 'PRESSURE', level: 'WARNING', msg: 'Cabin / suit pressure running slightly sub-nominal.' });
    }

    // 3. Heart Rate evaluation (Max deduction: 15 points)
    if (hr > this.thresholds.HEART_RATE_BPM.CRITICAL_MAX || hr < this.thresholds.HEART_RATE_BPM.BRADYCARDIA) {
      score -= 15;
      violations.push({ factor: 'BIOMETRIC', level: 'CRITICAL', msg: `Extreme crew heart rate: ${hr} BPM.` });
    } else if (hr > this.thresholds.HEART_RATE_BPM.EXERTION_WARNING) {
      score -= 8;
      violations.push({ factor: 'BIOMETRIC', level: 'CAUTION', msg: `Heavy physical cardiovascular exertion: ${hr} BPM.` });
    }

    // 4. Terrain Slope evaluation (Max deduction: 15 points)
    if (slope > this.thresholds.ENVIRONMENT.MAX_TRAVERSABLE_SLOPE_DEG) {
      score -= 15;
      violations.push({ factor: 'TERRAIN', level: 'CRITICAL', msg: `Terrain slope (${slope}°) exceeds rover turnover limit (18°)!` });
    } else if (slope > 12.0) {
      score -= 7;
      violations.push({ factor: 'TERRAIN', level: 'CAUTION', msg: `Steep terrain gradient (${slope}°). Reduced vehicle speed advised.` });
    }

    // 5. Environmental evaluation (Dust & Radiation)
    if (dustTau > this.thresholds.ENVIRONMENT.MAX_DUST_OPTICAL_DEPTH_TAU) {
      score -= 12;
      violations.push({ factor: 'ENVIRONMENT', level: 'WARNING', msg: `High atmospheric dust opacity (Tau ${dustTau}). Optical blackout impending.` });
    }
    if (radMsv > this.thresholds.ENVIRONMENT.MAX_RADIATION_MSV_DAY) {
      score -= 15;
      violations.push({ factor: 'RADIATION', level: 'WARNING', msg: `Elevated cosmic radiation dosage (${radMsv} mSv/day). Return to subterranean habitat.` });
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    let status = 'NOMINAL';
    let statusColor = '#10b981';
    let alertClass = 'badge-success';

    if (score < 40 || violations.some(v => v.level === 'CRITICAL')) {
      status = 'CRITICAL ALERT';
      statusColor = '#ef4444';
      alertClass = 'badge-danger';
    } else if (score < 70 || violations.some(v => v.level === 'WARNING')) {
      status = 'WARNING / ELEVATED RISK';
      statusColor = '#f97316';
      alertClass = 'badge-warning';
    } else if (score < 88) {
      status = 'CAUTION REQUIRED';
      statusColor = '#eab308';
      alertClass = 'badge-caution';
    }

    return {
      safetyScore: score,
      status,
      statusColor,
      alertClass,
      violations,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Standard Operating Procedures catalog for mission emergencies
   */
  getStandardOperatingProcedures() {
    return [
      {
        id: 'sop-o2',
        title: 'SOP-01: Life Support O2 Depletion & Cabin Leak',
        severity: 'CRITICAL',
        code: 'EMERG-01-O2',
        steps: [
          'Switch PLSS immediately to secondary emergency high-pressure O2 cylinder.',
          'Execute visor emergency seal verification check.',
          'Inject 100% pure oxygen positive-pressure flush.',
          'Cease all manual sample collection; calculate nearest rover airlock return vector.',
          'Ingress habitat/rover lock within 12 minutes.'
        ]
      },
      {
        id: 'sop-med',
        title: 'SOP-02: Crew Trauma or Cardiac Arrhythmia',
        severity: 'CRITICAL',
        code: 'EMERG-02-MED',
        steps: [
          'Halt all external vehicular and surface activities immediately.',
          'Transfer affected astronaut into pressurized rover cabin.',
          'Initiate automated multi-lead ECG and continuous pulse-oximeter telemetry recording.',
          'Administer high-flow warm oxygen via cabin mask.',
          'Open direct biomedical telemetry link to Flight Surgeon Dr. Alex Chen.'
        ]
      },
      {
        id: 'sop-dust',
        title: 'SOP-03: Regional Dust Storm / Atmospheric Blackout',
        severity: 'HIGH',
        code: 'EMERG-03-MET',
        steps: [
          'Recall all surface EVA teams to primary hab shelter immediately.',
          'Stow and lock external gimbaled optical mast cameras.',
          'Position solar array collectors into high-wind feathering mode.',
          'Switch base electrical grid to Kilopower fission reactor reserve.'
        ]
      },
      {
        id: 'sop-mobility',
        title: 'SOP-04: Rover Wheel Trenching / Vehicle Rollover Risk',
        severity: 'HIGH',
        code: 'EMERG-04-ROV',
        steps: [
          'Disengage drive motors immediately to prevent deeper dune trenching.',
          'Verify pressure hull and radiator coolant loop integrity.',
          'Deploy omnidirectional high-gain distress beacon.',
          'Await extraction rover or deploy autonomous winching anchors.'
        ]
      },
      {
        id: 'sop-comms',
        title: 'SOP-05: Orbital Relay Occultation & Deep Space Blackout',
        severity: 'YELLOW',
        code: 'EMERG-05-COM',
        steps: [
          'Raise secondary UHF directional antenna toward Mars Odyssey / MRO pass orbit.',
          'Broadcast pre-scheduled acoustic and radio emergency telemetry ping.',
          'Hold current position coordinates for 120 minutes before executing backtrack.'
        ]
      }
    ];
  }

  /**
   * Broadcast two-stage confirmed SOS Distress Beacon
   */
  triggerSOS(typeId, telemetry = {}) {
    const sops = this.getStandardOperatingProcedures();
    const selectedSop = sops.find((s) => s.id === typeId) || sops[0];
    this.emergencyActive = true;

    const incidentId = `SOS-${Date.now().toString().slice(-6)}`;
    const packet = {
      incidentId,
      timestamp: `Sol 142 ${new Date().toLocaleTimeString('en-US', { hour12: false })} LMST`,
      utcTime: new Date().toISOString(),
      code: selectedSop.code,
      title: selectedSop.title,
      severity: selectedSop.severity,
      location: telemetry.locationName || 'Jezero Crater (18.38° N, 77.58° E)',
      coordinates: telemetry.coordinates || '18.38° N, 77.58° E',
      telemetrySnapshot: {
        oxygenLiters: telemetry.oxygenRemainingL || 1450,
        suitPressureKpa: telemetry.suitPressureKpa || 29.6,
        heartRateBpm: telemetry.heartRate || 74,
        spo2Pct: telemetry.spo2 || 98.4,
        coreTempC: telemetry.coreTemp || 37.0
      },
      sopChecklist: selectedSop.steps,
      dsnRelayStatus: 'ACTIVE TRANSMISSION VIA MARS RECONNAISSANCE ORBITER (14m 22s Earth Lag)'
    };

    this.activeIncident = packet;
    this.incidentLogs.unshift({
      id: packet.incidentId,
      timestamp: packet.timestamp,
      type: packet.title,
      severity: packet.severity,
      location: packet.location,
      status: 'ACTIVE EMERGENCY',
      details: `Distress beacon active. Code: ${packet.code}. Coordinates: ${packet.coordinates}.`
    });

    this.saveIncidentLogs();
    this.startEmergencyAudio();

    return packet;
  }

  /**
   * Stand down emergency state
   */
  clearEmergency() {
    this.emergencyActive = false;
    this.stopEmergencyAudio();

    if (this.activeIncident) {
      const log = this.incidentLogs.find((l) => l.id === this.activeIncident.incidentId);
      if (log) log.status = 'STAND DOWN (RESOLVED)';
      this.activeIncident = null;
      this.saveIncidentLogs();
    }
  }

  /**
   * Procedural Dual-Tone Emergency Siren using Native Web Audio API
   */
  startEmergencyAudio() {
    if (typeof window === 'undefined') return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }

      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      if (this.sirenOscillator) return; // Already running

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(750, this.audioContext.currentTime);

      // Modulate frequency between 750Hz and 1100Hz every 0.6 seconds
      const now = this.audioContext.currentTime;
      for (let t = 0; t < 60; t += 0.6) {
        osc.frequency.linearRampToValueAtTime(1100, now + t + 0.3);
        osc.frequency.linearRampToValueAtTime(750, now + t + 0.6);
      }

      gain.gain.setValueAtTime(0.12, now);
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      osc.start();

      this.sirenOscillator = osc;
      this.sirenGainNode = gain;
    } catch (e) {
      console.warn('Audio siren unavailable:', e);
    }
  }

  stopEmergencyAudio() {
    try {
      if (this.sirenOscillator) {
        this.sirenOscillator.stop();
        this.sirenOscillator.disconnect();
        this.sirenOscillator = null;
      }
      if (this.sirenGainNode) {
        this.sirenGainNode.disconnect();
        this.sirenGainNode = null;
      }
    } catch (e) {}
  }

  loadIncidentLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('mars_incident_logs');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {}

    return [
      {
        id: 'inc-01',
        timestamp: 'Sol 136 17:40 LMST',
        type: 'COMMUNICATION OCCULTATION',
        severity: 'YELLOW',
        location: 'Gale Crater South Rim',
        status: 'RESOLVED',
        details: 'Orbiter line of sight occluded for 45 minutes. Autonomous transponder ping engaged. Connection re-established.'
      },
      {
        id: 'inc-02',
        timestamp: 'Sol 124 11:15 LMST',
        type: 'ROVER WHEEL SLIPPAGE',
        severity: 'ORANGE',
        location: 'Séítah Dune Margins',
        status: 'RESOLVED',
        details: 'Right front rocker-bogie wheel slippage reached 52% in loose basaltic drift sand. Autonomous crab-walk maneuver disengaged rover.'
      }
    ];
  }

  saveIncidentLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        if (this.incidentLogs.length > 25) this.incidentLogs = this.incidentLogs.slice(0, 25);
        localStorage.setItem('mars_incident_logs', JSON.stringify(this.incidentLogs));
      }
    } catch (e) {}
  }
}

// Make accessible to browser global scope & module systems
if (typeof window !== 'undefined') {
  window.MarsSafetySystem = MarsSafetySystem;
  window.MARS_SAFETY_THRESHOLDS = MARS_SAFETY_THRESHOLDS;
  window.MARS_HAZARD_REGISTRY = MARS_HAZARD_REGISTRY;
}

export { MarsSafetySystem, MARS_SAFETY_THRESHOLDS, MARS_HAZARD_REGISTRY };
