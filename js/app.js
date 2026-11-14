/**
 * MARS EXPLORER - MASTER APPLICATION COORDINATOR (js/app.js)
 * Unified state management, responsive view routing, multilingual i18n,
 * telemetry synchronization, modal controllers, and guided mission tour.
 */

import { MARS_CONSTANTS, MARS_LOCATIONS, MARS_HAZARDS, CREW_MEMBERS, MISSION_METRICS } from './mars-data.js';
import { LANGUAGES, TRANSLATIONS } from './translations.js';
import { MarsGlobe3D } from './mars-globe-3d.js';
import { MarsMap2D } from './mars-map-2d.js';
import { MarsNavigationSystem } from './navigation.js';
import { OxygenManagementSystem } from './oxygen.js';
import { AstronautHealthSystem } from './health.js';
import { MarsEnvironmentSystem } from './environment.js';
import { MarsHazardMatrix } from './hazards.js';
import { MarsCommsSystem } from './comms.js';
import { MarsAIAssistant } from './mars-ai.js';
import { EmergencySystem } from './emergency.js';
import { MissionReportsSystem } from './reports.js';
import { soundFx } from './audio-synth.js';

class MarsExplorerApp {
  constructor() {
    this.currentLang = 'en';
    this.currentView = 'overview';
    this.hudMode = false;
    this.largeTextMode = false;
    this.isOnline = navigator.onLine !== false;
    this.activeCrewIndex = 0;

    // Subsystems
    this.navigation = new MarsNavigationSystem();
    this.oxygen = new OxygenManagementSystem();
    this.environment = new MarsEnvironmentSystem();
    this.hazardMatrix = new MarsHazardMatrix();
    this.comms = new MarsCommsSystem(this.currentLang);
    this.ai = new MarsAIAssistant();
    this.emergency = new EmergencySystem();
    this.reports = new MissionReportsSystem();

    this.selectedLocation = MARS_LOCATIONS[0]; // Jezero Crater default
    this.mapMode = '3d'; // '3d' or '2d'

    this.init();
  }

  init() {
    this.initClocks();
    this.initLanguages();
    this.initNavigation();
    this.initMaps();
    this.initTelemetryViews();
    this.initEventListeners();
    this.initGuidedTour();
    this.updateLanguageUI(this.currentLang);

    // Initial render of environment charts
    setTimeout(() => {
      this.environment.drawDiurnalTemperatureChart('env-temp-chart');
      this.environment.drawCompositionDonut('env-donut-chart');
    }, 200);

    // Offline / Online listeners
    window.addEventListener('online', () => this.updateNetworkStatus(true));
    window.addEventListener('offline', () => this.updateNetworkStatus(false));
  }

  // 1. Mission Elapsed Time (MET) and Martian Sol Clock
  initClocks() {
    const metEl = document.getElementById('hud-met-clock');
    const lmstEl = document.getElementById('hud-lmst-clock');
    const solEl = document.getElementById('hud-sol-counter');

    const updateTimes = () => {
      const now = Date.now();
      const elapsedMs = now - MISSION_METRICS.metStartTimestamp;

      const days = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

      if (metEl) metEl.textContent = `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
      if (solEl) solEl.textContent = `SOL ${MISSION_METRICS.currentSol}`;

      // Martian Local Solar Time (LMST) approximation
      const marsSeconds = (now / 1000) % MARS_CONSTANTS.SOL_DURATION_SECONDS;
      const mHours = Math.floor((marsSeconds / 3600) % 24);
      const mMinutes = Math.floor((marsSeconds / 60) % 60);
      const mSecs = Math.floor(marsSeconds % 60);
      if (lmstEl) lmstEl.textContent = `${String(mHours).padStart(2, '0')}:${String(mMinutes).padStart(2, '0')}:${String(mSecs).padStart(2, '0')} LMST`;
    };

    updateTimes();
    setInterval(updateTimes, 1000);
  }

  // 2. Multilingual Setup & Arabic RTL layout
  initLanguages() {
    const select = document.getElementById('global-lang-select');
    if (!select) return;

    select.innerHTML = '';
    LANGUAGES.forEach((lang) => {
      const opt = document.createElement('option');
      opt.value = lang.code;
      opt.textContent = `${lang.native} (${lang.name})`;
      if (lang.code === this.currentLang) opt.selected = true;
      select.appendChild(opt);
    });

    select.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });
  }

  switchLanguage(langCode) {
    soundFx.playClick();
    this.currentLang = langCode;
    this.comms.setLanguage(langCode);

    const langObj = LANGUAGES.find((l) => l.code === langCode);
    const isRtl = langObj ? langObj.rtl : false;

    // Toggle RTL on document root for Arabic
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = langCode;
    if (isRtl) {
      document.body.classList.add('rtl-layout');
    } else {
      document.body.classList.remove('rtl-layout');
    }

    this.updateLanguageUI(langCode);
    this.renderPhrasebook();
  }

  updateLanguageUI(langCode) {
    const dict = TRANSLATIONS[langCode] || TRANSLATIONS.en;

    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      const text = this.getNestedTranslation(dict, key);
      if (text) {
        if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
          el.placeholder = text;
        } else {
          el.textContent = text;
        }
      }
    });

    const taglineEl = document.getElementById('app-tagline-text');
    if (taglineEl) taglineEl.textContent = dict.tagline || TRANSLATIONS.en.tagline;
  }

  getNestedTranslation(obj, path) {
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
  }

  // 3. Navigation View Router
  initNavigation() {
    const navButtons = document.querySelectorAll('.nav-link[data-view]');
    navButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        soundFx.playClick();
        const view = btn.getAttribute('data-view');
        this.switchView(view);
      });
    });
  }

  switchView(viewId) {
    this.currentView = viewId;

    document.querySelectorAll('.nav-link').forEach((link) => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    document.querySelectorAll('.view-section').forEach((sec) => {
      if (sec.id === `view-${viewId}`) {
        sec.classList.remove('hidden');
        sec.classList.add('active-view');
      } else {
        sec.classList.add('hidden');
        sec.classList.remove('active-view');
      }
    });

    // Subsystem re-renders
    if (viewId === 'map') {
      setTimeout(() => {
        if (this.globe3d) this.globe3d.resize();
        if (this.map2d) this.map2d.resize();
      }, 50);
    } else if (viewId === 'environment') {
      setTimeout(() => {
        this.environment.drawDiurnalTemperatureChart('env-temp-chart');
        this.environment.drawCompositionDonut('env-donut-chart');
      }, 50);
    } else if (viewId === 'health') {
      if (this.health) this.health.initECG();
    } else if (viewId === 'comms') {
      this.renderPhrasebook();
    } else if (viewId === 'hazards') {
      this.renderHazards();
    } else if (viewId === 'navigation') {
      this.renderNavigationPlanner();
    } else if (viewId === 'lifesupport') {
      this.renderOxygenDashboard();
    }
  }

  // 4. Mars 3D Globe & 2D GIS Map
  initMaps() {
    this.globe3d = new MarsGlobe3D('mars-globe-canvas', (loc) => {
      this.onLocationSelected(loc);
    });

    this.map2d = new MarsMap2D('mars-map-canvas', (loc) => {
      this.onLocationSelected(loc);
    });

    this.health = new AstronautHealthSystem('ecg-canvas');

    this.miniGlobe = new MarsGlobe3D('mini-mars-canvas', (loc) => {
      this.onLocationSelected(loc);
    });

    const btnToggleMap = document.getElementById('btn-toggle-map-mode');
    if (btnToggleMap) {
      btnToggleMap.addEventListener('click', () => {
        soundFx.playClick();
        const container3d = document.getElementById('map-3d-wrapper');
        const container2d = document.getElementById('map-2d-wrapper');

        if (this.mapMode === '3d') {
          this.mapMode = '2d';
          container3d.classList.add('hidden');
          container2d.classList.remove('hidden');
          btnToggleMap.textContent = 'SWITCH TO 3D GLOBE';
          if (this.map2d) this.map2d.resize();
        } else {
          this.mapMode = '3d';
          container2d.classList.add('hidden');
          container3d.classList.remove('hidden');
          btnToggleMap.textContent = 'SWITCH TO 2D TOPO MAP';
          if (this.globe3d) this.globe3d.resize();
        }
      });
    }

    const btnAutoRotate = document.getElementById('btn-toggle-autorotate');
    if (btnAutoRotate) {
      btnAutoRotate.addEventListener('click', () => {
        soundFx.playClick();
        const isRotating = this.globe3d.toggleAutoRotate();
        btnAutoRotate.textContent = isRotating ? 'PAUSE ROTATION' : 'AUTO ROTATE';
      });
    }

    const btnMeasure = document.getElementById('btn-measure-tool');
    if (btnMeasure) {
      btnMeasure.addEventListener('click', () => {
        soundFx.playClick();
        const active = this.map2d.toggleMeasureTool();
        btnMeasure.classList.toggle('btn-active', active);
        btnMeasure.textContent = active ? 'CANCEL RULER' : 'MEASURE DISTANCE';
      });
    }

    const searchInput = document.getElementById('map-search-landmark');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const found = MARS_LOCATIONS.find((l) => l.name.toLowerCase().includes(query) || l.feature.toLowerCase().includes(query));
        if (found) {
          if (this.mapMode === '3d' && this.globe3d) {
            this.globe3d.focusLocationById(found.id);
          } else if (this.map2d) {
            this.map2d.panToLocation(found);
          }
        }
      });
    }
  }

  onLocationSelected(loc) {
    soundFx.playConfirm();
    this.selectedLocation = loc;
    this.navigation.destLocation = loc;

    this.renderLocationDrawer(loc);

    const ovLocationName = document.getElementById('ov-selected-location-name');
    const ovLocationCoords = document.getElementById('ov-selected-location-coords');
    const ovLocationElev = document.getElementById('ov-selected-location-elevation');

    if (ovLocationName) ovLocationName.textContent = loc.name;
    if (ovLocationCoords) ovLocationCoords.textContent = `${loc.lat >= 0 ? '+' : ''}${loc.lat}° N, ${loc.lon}° E`;
    if (ovLocationElev) ovLocationElev.textContent = `${loc.elevation >= 0 ? '+' : ''}${loc.elevation} m (MOLA)`;

    if (this.map2d) this.map2d.selectLocation(loc);
    if (this.globe3d) this.globe3d.selectedLocationId = loc.id;
  }

  renderLocationDrawer(loc) {
    const drawer = document.getElementById('location-intel-drawer');
    if (!drawer) return;

    drawer.classList.remove('hidden');

    const titleEl = document.getElementById('loc-intel-title');
    const badgeEl = document.getElementById('loc-intel-feature');
    const coordsEl = document.getElementById('loc-intel-coords');
    const elevEl = document.getElementById('loc-intel-elev');
    const missionEl = document.getElementById('loc-intel-mission');
    const descEl = document.getElementById('loc-intel-desc');
    const imgEl = document.getElementById('loc-intel-img');
    const imgCapEl = document.getElementById('loc-intel-img-caption');
    const hazardsListEl = document.getElementById('loc-intel-hazards');

    if (titleEl) titleEl.textContent = loc.name;
    if (badgeEl) badgeEl.textContent = loc.feature;
    if (coordsEl) coordsEl.textContent = `${loc.lat >= 0 ? '+' : ''}${loc.lat}° N, ${loc.lon}° E`;
    if (elevEl) elevEl.textContent = `${loc.elevation >= 0 ? '+' : ''}${loc.elevation} m MOLA`;
    if (missionEl) missionEl.textContent = loc.mission;
    if (descEl) descEl.textContent = loc.scientificImportance;

    if (imgEl && loc.images && loc.images.length > 0) {
      imgEl.src = loc.images[0].url;
      imgEl.alt = loc.images[0].title;
      if (imgCapEl) {
        imgCapEl.innerHTML = `<strong>NASA ID ${loc.images[0].nasaId}</strong>: ${loc.images[0].caption} (<em>${loc.images[0].instrument}</em>)`;
      }
    }

    if (hazardsListEl) {
      hazardsListEl.innerHTML = '';
      loc.hazards.forEach((h) => {
        const li = document.createElement('li');
        li.className = 'hazard-bullet';
        li.innerHTML = `<span class="badge ${h.severity === 'CRITICAL' ? 'badge-danger' : h.severity === 'HIGH' ? 'badge-warning' : 'badge-caution'}">${h.severity}</span> <strong>${h.type}</strong>: ${h.detail}`;
        hazardsListEl.appendChild(li);
      });
    }

    const btnSetStart = document.getElementById('btn-set-loc-start');
    const btnSetDest = document.getElementById('btn-set-loc-dest');
    const btnPlanRoute = document.getElementById('btn-route-from-intel');

    if (btnSetStart) {
      btnSetStart.onclick = () => {
        soundFx.playConfirm();
        this.navigation.startLocation = loc;
        if (this.map2d) this.map2d.setStartLocation(loc);
        alert(`Starting location set to: ${loc.name}`);
      };
    }

    if (btnSetDest) {
      btnSetDest.onclick = () => {
        soundFx.playConfirm();
        this.navigation.destLocation = loc;
        if (this.map2d) this.map2d.setDestLocation(loc);
        alert(`Destination set to: ${loc.name}`);
      };
    }

    if (btnPlanRoute) {
      btnPlanRoute.onclick = () => {
        soundFx.playConfirm();
        this.navigation.destLocation = loc;
        this.switchView('navigation');
      };
    }
  }

  // 5. Render All Telemetry Dashboards
  initTelemetryViews() {
    this.renderOxygenDashboard();
    this.renderNavigationPlanner();
    this.renderCrewHealth();
    this.renderHazards();
    this.renderPhrasebook();
    this.renderMissionReports();
    this.renderAIAssistant();
  }

  renderOxygenDashboard() {
    const budget = this.oxygen.calculateBudget();

    const tankFillEl = document.getElementById('o2-tank-fill-bar');
    const currentTankEl = document.getElementById('o2-current-tank-liters');
    const remainingAfterEl = document.getElementById('o2-remaining-after-eva');
    const requiredTotalEl = document.getElementById('o2-total-required-liters');
    const statusBadgeEl = document.getElementById('o2-safety-status-badge');
    const pointOfNoReturnEl = document.getElementById('o2-point-of-no-return');
    const hoursRemainingEl = document.getElementById('o2-hours-remaining-rate');

    if (tankFillEl) {
      tankFillEl.style.width = `${budget.tankFillPercentage}%`;
      tankFillEl.className = `progress-bar ${budget.statusClass}`;
    }
    if (currentTankEl) currentTankEl.textContent = `${budget.currentTankL} L (${budget.tankFillPercentage}%)`;
    if (remainingAfterEl) remainingAfterEl.textContent = `${budget.remainingAfterMissionL} L`;
    if (requiredTotalEl) requiredTotalEl.textContent = `${budget.totalRequiredL} L`;
    if (statusBadgeEl) {
      statusBadgeEl.textContent = budget.status;
      statusBadgeEl.className = `badge ${budget.statusClass}`;
    }
    if (pointOfNoReturnEl) pointOfNoReturnEl.textContent = `${budget.pointOfNoReturnHours} hrs`;
    if (hoursRemainingEl) hoursRemainingEl.textContent = `${budget.totalHoursRemainingAtRate} hrs`;

    const ovO2Val = document.getElementById('ov-o2-reserve-val');
    const ovO2Hours = document.getElementById('ov-o2-hours-val');
    if (ovO2Val) ovO2Val.textContent = `${budget.tankFillPercentage}%`;
    if (ovO2Hours) ovO2Hours.textContent = `${budget.totalHoursRemainingAtRate}h remain`;
  }

  renderNavigationPlanner() {
    const intel = this.navigation.calculateRouteIntel();

    const startSelect = document.getElementById('nav-start-select');
    const destSelect = document.getElementById('nav-dest-select');
    const modeSelect = document.getElementById('nav-mode-select');

    if (startSelect && startSelect.children.length === 0) {
      MARS_LOCATIONS.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.name} (${l.elevation >= 0 ? '+' : ''}${l.elevation}m)`;
        if (l.id === this.navigation.startLocation.id) opt.selected = true;
        startSelect.appendChild(opt);
      });
      startSelect.addEventListener('change', (e) => {
        soundFx.playClick();
        this.navigation.setEndpoints(e.target.value, this.navigation.destLocation.id);
        if (this.map2d) this.map2d.setStartLocation(this.navigation.startLocation);
        this.renderNavigationPlanner();
      });
    }

    if (destSelect && destSelect.children.length === 0) {
      MARS_LOCATIONS.forEach((l) => {
        const opt = document.createElement('option');
        opt.value = l.id;
        opt.textContent = `${l.name} (${l.elevation >= 0 ? '+' : ''}${l.elevation}m)`;
        if (l.id === this.navigation.destLocation.id) opt.selected = true;
        destSelect.appendChild(opt);
      });
      destSelect.addEventListener('change', (e) => {
        soundFx.playClick();
        this.navigation.setEndpoints(this.navigation.startLocation.id, e.target.value);
        if (this.map2d) this.map2d.setDestLocation(this.navigation.destLocation);
        this.renderNavigationPlanner();
      });
    }

    if (modeSelect && !modeSelect.dataset.initialized) {
      modeSelect.dataset.initialized = 'true';
      modeSelect.addEventListener('change', (e) => {
        soundFx.playClick();
        this.navigation.travelMode = e.target.value;
        this.renderNavigationPlanner();
      });
    }

    const distEl = document.getElementById('nav-traversable-dist');
    const directDistEl = document.getElementById('nav-direct-dist');
    const timeEl = document.getElementById('nav-est-time');
    const bearingEl = document.getElementById('nav-bearing');
    const slopeEl = document.getElementById('nav-avg-slope');
    const confidenceEl = document.getElementById('nav-confidence-score');

    if (distEl) distEl.textContent = `${intel.traversableDistKm} km`;
    if (directDistEl) directDistEl.textContent = `${intel.directDistKm} km (Geodesic)`;
    if (timeEl) timeEl.textContent = `${intel.travelTimeHours} hrs`;
    if (bearingEl) bearingEl.textContent = `${intel.bearingDeg}° (${intel.compassDir})`;
    if (slopeEl) slopeEl.textContent = `${intel.avgSlopeDeg}°`;
    if (confidenceEl) confidenceEl.textContent = `${intel.confidencePct}% (Verified)`;

    const wpListEl = document.getElementById('nav-waypoints-table-body');
    if (wpListEl) {
      wpListEl.innerHTML = '';
      intel.waypoints.forEach((wp) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${wp.name}</td>
          <td>${wp.lat}° N, ${wp.lon}° E</td>
          <td>${wp.elevation >= 0 ? '+' : ''}${wp.elevation} m</td>
          <td>+${wp.distFromStartKm} km</td>
        `;
        wpListEl.appendChild(tr);
      });
    }

    const compTableEl = document.getElementById('nav-comparison-table-body');
    if (compTableEl) {
      compTableEl.innerHTML = '';
      const comparisons = this.navigation.getRouteComparison();
      comparisons.forEach((c) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${c.name}</strong><div class="text-xs text-muted">${c.description}</div></td>
          <td>${c.distKm} km</td>
          <td>${c.timeHours} h</td>
          <td>${c.avgSlope}</td>
          <td><span class="badge ${c.riskBadgeClass}">${c.riskLevel}</span></td>
          <td>${c.o2EstimatedLiters} L</td>
        `;
        compTableEl.appendChild(tr);
      });
    }

    this.drawElevationProfile('nav-elev-canvas', intel.waypoints);
  }

  drawElevationProfile(canvasId, waypoints) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !waypoints || waypoints.length === 0) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width || 420;
    const h = rect.height || 140;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const elevs = waypoints.map((wp) => wp.elevation);
    const minElev = Math.min(...elevs) - 200;
    const maxElev = Math.max(...elevs) + 200;
    const range = maxElev - minElev || 1;

    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    const points = [];
    waypoints.forEach((wp, idx) => {
      const px = 30 + (idx / (waypoints.length - 1)) * (w - 60);
      const py = h - 25 - ((wp.elevation - minElev) / range) * (h - 45);
      points.push({ x: px, y: py, elev: wp.elevation });
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    ctx.lineTo(points[points.length - 1].x, h - 20);
    ctx.lineTo(points[0].x, h - 20);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0, 229, 255, 0.25)');
    grad.addColorStop(1, 'rgba(0, 229, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fill();

    points.forEach((pt) => {
      ctx.fillStyle = '#00e5ff';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '8px monospace';
    ctx.fillText(`${maxElev}m`, 4, 16);
    ctx.fillText(`${minElev}m`, 4, h - 24);
  }

  // 6. Crew Health & Vitals
  renderCrewHealth() {
    const crewSelect = document.getElementById('health-crew-select');
    if (crewSelect && crewSelect.children.length === 0) {
      CREW_MEMBERS.forEach((m, idx) => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.role})`;
        if (idx === 0) opt.selected = true;
        crewSelect.appendChild(opt);
      });

      crewSelect.addEventListener('change', (e) => {
        soundFx.playClick();
        this.health.setCrewMember(e.target.value);
        this.updateHealthLabels();
      });
    }

    this.updateHealthLabels();

    const btnExertion = document.getElementById('btn-sim-exertion');
    const btnHypoxia = document.getElementById('btn-sim-hypoxia');
    const btnResetHealth = document.getElementById('btn-sim-reset');

    if (btnExertion) {
      btnExertion.onclick = () => {
        soundFx.playWarning();
        this.health.simulateState('exertion');
        this.updateHealthLabels();
      };
    }

    if (btnHypoxia) {
      btnHypoxia.onclick = () => {
        soundFx.playWarning();
        this.health.simulateState('hypoxia');
        this.updateHealthLabels();
      };
    }

    if (btnResetHealth) {
      btnResetHealth.onclick = () => {
        soundFx.playConfirm();
        this.health.simulateState('nominal');
        this.updateHealthLabels();
      };
    }
  }

  updateHealthLabels() {
    const hrEl = document.getElementById('health-hr-val');
    const bpEl = document.getElementById('health-bp-val');
    const spo2El = document.getElementById('health-spo2-val');
    const tempEl = document.getElementById('health-temp-val');
    const statusEl = document.getElementById('health-status-badge');
    const suitPressEl = document.getElementById('health-suit-press-val');

    if (hrEl) hrEl.textContent = `${Math.round(this.health.heartRate)} BPM`;
    if (bpEl) bpEl.textContent = `${this.health.sysBP}/${this.health.diaBP} mmHg`;
    if (spo2El) spo2El.textContent = `${this.health.spo2.toFixed(1)}%`;
    if (tempEl) tempEl.textContent = `${this.health.bodyTempC.toFixed(1)}°C`;
    if (suitPressEl) suitPressEl.textContent = `${this.health.suitPressureKpa} kPa (4.3 psi)`;

    if (statusEl) {
      statusEl.textContent = this.health.healthStatus;
      statusEl.className = `badge ${this.health.healthStatus === 'CRITICAL ALERT' ? 'badge-danger' : this.health.healthStatus === 'ATTENTION REQUIRED' ? 'badge-warning' : 'badge-success'}`;
    }

    const ovHrVal = document.getElementById('ov-health-hr-val');
    const ovHealthStatus = document.getElementById('ov-health-status-val');
    if (ovHrVal) ovHrVal.textContent = `${Math.round(this.health.heartRate)} BPM`;
    if (ovHealthStatus) {
      ovHealthStatus.textContent = this.health.healthStatus;
      ovHealthStatus.className = `badge ${this.health.healthStatus === 'CRITICAL ALERT' ? 'badge-danger' : this.health.healthStatus === 'ATTENTION REQUIRED' ? 'badge-warning' : 'badge-success'}`;
    }

    const logListEl = document.getElementById('health-medical-logs-list');
    if (logListEl) {
      logListEl.innerHTML = '';
      this.health.medicalLogs.forEach((log) => {
        const div = document.createElement('div');
        div.className = 'medical-log-item';
        div.innerHTML = `
          <div class="flex-between">
            <strong>${log.type}</strong>
            <span class="text-xs text-muted">${log.timestamp}</span>
          </div>
          <div class="text-sm">${log.note}</div>
          <div class="text-xs text-muted">Crew: ${log.crew}</div>
        `;
        logListEl.appendChild(div);
      });
    }
  }

  // 7. Hazard Intelligence Matrix
  renderHazards() {
    const listEl = document.getElementById('hazards-grid-container');
    if (!listEl) return;

    listEl.innerHTML = '';
    const hazards = this.hazardMatrix.getFilteredHazards();

    hazards.forEach((h) => {
      const badge = this.hazardMatrix.getSeverityBadge(h.severity);
      const card = document.createElement('div');
      card.className = `hazard-card border-${h.severity.toLowerCase()}`;
      card.innerHTML = `
        <div class="hazard-card-header">
          <span class="badge ${badge.badgeClass}">${badge.label}</span>
          <span class="hazard-code">${h.code}</span>
        </div>
        <h4 class="hazard-name">${h.name}</h4>
        <div class="hazard-meta">
          <div><strong>Region:</strong> ${h.region}</div>
          <div><strong>Coordinates:</strong> ${h.coordinates}</div>
          <div><strong>Source:</strong> ${h.dataSource}</div>
        </div>
        <p class="hazard-desc">${h.description}</p>
        <div class="hazard-sop">
          <div class="sop-tag">REFERENCE PROCEDURE</div>
          <code>${h.sopReference}</code>
        </div>
      `;
      listEl.appendChild(card);
    });

    document.querySelectorAll('.hazard-filter-chip').forEach((chip) => {
      chip.onclick = () => {
        soundFx.playClick();
        document.querySelectorAll('.hazard-filter-chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        this.hazardMatrix.selectedSeverity = chip.getAttribute('data-severity');
        this.renderHazards();
      };
    });
  }

  // 8. International Radio Phrasebook
  renderPhrasebook() {
    const container = document.getElementById('comms-phrasebook-list');
    if (!container) return;

    container.innerHTML = '';
    const phrases = this.comms.getPhrasesForCurrentLang();

    phrases.forEach((p) => {
      const row = document.createElement('div');
      row.className = 'phrase-card';
      row.innerHTML = `
        <div class="phrase-content">
          <span class="badge badge-accent">${p.category}</span>
          <p class="phrase-text">"${p.text}"</p>
        </div>
        <button class="btn btn-sm btn-outline btn-speak-phrase" title="Listen in astronaut headset">
          🔊 AUDIO
        </button>
      `;

      const btn = row.querySelector('.btn-speak-phrase');
      btn.onclick = () => {
        soundFx.playClick();
        this.comms.speakText(p.text, this.currentLang);
      };

      container.appendChild(row);
    });
  }

  // 9. Mission Reports & CSV Export
  renderMissionReports() {
    const tableBody = document.getElementById('reports-table-body');
    if (tableBody) {
      tableBody.innerHTML = '';
      this.reports.missionLogs.forEach((l) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>SOL ${l.sol}</td>
          <td>${l.time}</td>
          <td>${l.location}</td>
          <td>${l.activity}</td>
          <td>${l.distanceTraversedKm} km</td>
          <td>${l.o2UsedL} L</td>
          <td><span class="badge badge-success">${l.crewStatus}</span></td>
        `;
        tableBody.appendChild(tr);
      });
    }

    const notesContainer = document.getElementById('reports-notes-list');
    if (notesContainer) {
      notesContainer.innerHTML = '';
      this.reports.fieldNotes.forEach((n) => {
        const div = document.createElement('div');
        div.className = 'field-note-card';
        div.innerHTML = `
          <div class="flex-between">
            <strong>${n.author}</strong>
            <span class="text-xs text-muted">SOL ${n.sol} | ${n.timestamp}</span>
          </div>
          <div class="text-xs text-cyan">${n.location}</div>
          <p class="mt-1 text-sm">${n.text}</p>
        `;
        notesContainer.appendChild(div);
      });
    }
  }

  // 10. MARS AI Assistant
  renderAIAssistant() {
    const chatContainer = document.getElementById('ai-chat-messages');
    const input = document.getElementById('ai-chat-input');
    const btnSend = document.getElementById('btn-send-ai-message');

    if (!chatContainer || !input || !btnSend) return;

    const sendMessage = (queryText) => {
      if (!queryText || !queryText.trim()) return;
      soundFx.playClick();

      const userDiv = document.createElement('div');
      userDiv.className = 'ai-msg ai-msg-user';
      userDiv.innerHTML = `<div class="msg-bubble">${queryText}</div>`;
      chatContainer.appendChild(userDiv);
      input.value = '';

      const context = {
        selectedLocation: this.selectedLocation,
        routeIntel: this.navigation.calculateRouteIntel(),
        oxygenBudget: this.oxygen.calculateBudget(),
        crew: CREW_MEMBERS[this.activeCrewIndex],
        health: this.health,
        environment: this.environment.getAtmosphericSummary()
      };

      setTimeout(() => {
        const reply = this.ai.generateResponse(queryText, context, this.currentLang);
        soundFx.playConfirm();

        const aiDiv = document.createElement('div');
        aiDiv.className = 'ai-msg ai-msg-ai';
        aiDiv.innerHTML = `
          <div class="msg-bubble">
            <div class="ai-source-badge">MARS AI TELEMETRY ENGINE</div>
            <div class="ai-text">${reply.text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</div>
            <div class="ai-provenance">Source: ${reply.source}</div>
          </div>
        `;
        chatContainer.appendChild(aiDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }, 350);
    };

    btnSend.onclick = () => sendMessage(input.value);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') sendMessage(input.value);
    };

    document.querySelectorAll('.ai-prompt-chip').forEach((chip) => {
      chip.onclick = () => {
        const prompt = chip.getAttribute('data-prompt');
        input.value = prompt;
        sendMessage(prompt);
      };
    });
  }

  // 11. Event Listeners & Emergency Controls
  initEventListeners() {
    const tankSlider = document.getElementById('input-o2-tank');
    const rateSlider = document.getElementById('input-o2-burn-rate');
    const durationInput = document.getElementById('input-o2-duration');
    const returnInput = document.getElementById('input-o2-return');
    const reserveSlider = document.getElementById('input-o2-reserve-pct');

    const handleO2Change = () => {
      this.oxygen.updateParameters({
        currentTankL: tankSlider ? tankSlider.value : undefined,
        consumptionRateLMin: rateSlider ? rateSlider.value : undefined,
        plannedActivityHours: durationInput ? durationInput.value : undefined,
        returnDurationHours: returnInput ? returnInput.value : undefined,
        safetyReservePct: reserveSlider ? reserveSlider.value : undefined
      });
      this.renderOxygenDashboard();
    };

    if (tankSlider) tankSlider.addEventListener('input', handleO2Change);
    if (rateSlider) rateSlider.addEventListener('change', handleO2Change);
    if (durationInput) durationInput.addEventListener('input', handleO2Change);
    if (returnInput) returnInput.addEventListener('input', handleO2Change);
    if (reserveSlider) reserveSlider.addEventListener('input', handleO2Change);

    const btnStartSim = document.getElementById('btn-o2-sim-start');
    const btnPauseSim = document.getElementById('btn-o2-sim-pause');
    const btnResetTank = document.getElementById('btn-o2-sim-reset');
    const speedSelect = document.getElementById('select-o2-sim-speed');

    if (btnStartSim) {
      btnStartSim.onclick = () => {
        soundFx.playConfirm();
        this.oxygen.startSimulation((b) => this.renderOxygenDashboard());
      };
    }
    if (btnPauseSim) {
      btnPauseSim.onclick = () => {
        soundFx.playClick();
        this.oxygen.pauseSimulation();
      };
    }
    if (btnResetTank) {
      btnResetTank.onclick = () => {
        soundFx.playConfirm();
        this.oxygen.resetTank();
        if (tankSlider) tankSlider.value = 1450;
        this.renderOxygenDashboard();
      };
    }
    if (speedSelect) {
      speedSelect.onchange = (e) => {
        this.oxygen.setSimulationSpeed(Number(e.target.value));
      };
    }

    const btnTriggerSos = document.getElementById('btn-global-trigger-sos');
    const modalConfirmSos = document.getElementById('modal-sos-confirm');
    const btnConfirmSosFinal = document.getElementById('btn-sos-confirm-final');
    const btnCancelSos = document.getElementById('btn-sos-cancel');
    const btnClearEmergency = document.getElementById('btn-clear-active-emergency');

    if (btnTriggerSos && modalConfirmSos) {
      btnTriggerSos.onclick = () => {
        soundFx.playWarning();
        modalConfirmSos.classList.remove('hidden');
      };
    }

    if (btnCancelSos && modalConfirmSos) {
      btnCancelSos.onclick = () => {
        soundFx.playClick();
        modalConfirmSos.classList.add('hidden');
      };
    }

    if (btnConfirmSosFinal && modalConfirmSos) {
      btnConfirmSosFinal.onclick = () => {
        modalConfirmSos.classList.add('hidden');
        const telemetry = {
          locationName: this.selectedLocation.name,
          coordinates: `${this.selectedLocation.lat}° N, ${this.selectedLocation.lon}° E`,
          oxygenRemainingL: this.oxygen.currentTankL,
          heartRate: this.health.heartRate,
          spo2: this.health.spo2,
          suitPressureKpa: this.health.suitPressureKpa
        };

        const incident = this.emergency.triggerSOS('life_support', telemetry);
        this.renderActiveEmergencyBanner(incident);
        this.switchView('emergency');
      };
    }

    if (btnClearEmergency) {
      btnClearEmergency.onclick = () => {
        soundFx.playConfirm();
        this.emergency.clearEmergency();
        const banner = document.getElementById('active-emergency-banner');
        if (banner) banner.classList.add('hidden');
      };
    }

    const btnSaveRoute = document.getElementById('btn-save-current-route');
    if (btnSaveRoute) {
      btnSaveRoute.onclick = () => {
        soundFx.playConfirm();
        this.navigation.saveCurrentRoute();
        alert('Mission traverse route successfully saved to onboard storage.');
      };
    }

    const btnExportCsv = document.getElementById('btn-export-csv-log');
    const btnPrintReport = document.getElementById('btn-print-report');
    if (btnExportCsv) {
      btnExportCsv.onclick = () => {
        soundFx.playConfirm();
        this.reports.exportCSV({});
      };
    }
    if (btnPrintReport) {
      btnPrintReport.onclick = () => {
        soundFx.playConfirm();
        this.reports.printReport({});
      };
    }

    const btnAddNote = document.getElementById('btn-add-field-note');
    const inputNote = document.getElementById('input-field-note-text');
    if (btnAddNote && inputNote) {
      btnAddNote.onclick = () => {
        if (!inputNote.value.trim()) return;
        soundFx.playConfirm();
        this.reports.saveNote(CREW_MEMBERS[this.activeCrewIndex].name, this.selectedLocation.name, inputNote.value);
        inputNote.value = '';
        this.renderMissionReports();
      };
    }

    const btnToggleHud = document.getElementById('btn-toggle-hud-mode');
    if (btnToggleHud) {
      btnToggleHud.onclick = () => {
        soundFx.playClick();
        this.hudMode = !this.hudMode;
        document.body.classList.toggle('hud-mode', this.hudMode);
        btnToggleHud.classList.toggle('btn-active', this.hudMode);
      };
    }

    const btnToggleSound = document.getElementById('btn-toggle-sound');
    if (btnToggleSound) {
      btnToggleSound.onclick = () => {
        const enabled = soundFx.toggleSound();
        btnToggleSound.textContent = enabled ? '🔊 AUDIO ON' : '🔇 AUDIO MUTED';
      };
    }

    const btnCloseDrawer = document.getElementById('btn-close-location-drawer');
    if (btnCloseDrawer) {
      btnCloseDrawer.onclick = () => {
        document.getElementById('location-intel-drawer').classList.add('hidden');
      };
    }
  }

  renderActiveEmergencyBanner(incident) {
    const banner = document.getElementById('active-emergency-banner');
    if (!banner) return;

    banner.classList.remove('hidden');
    const codeEl = document.getElementById('emergency-banner-code');
    const typeEl = document.getElementById('emergency-banner-type');
    const locEl = document.getElementById('emergency-banner-loc');

    if (codeEl) codeEl.textContent = incident.code;
    if (typeEl) typeEl.textContent = incident.type;
    if (locEl) locEl.textContent = `${incident.location} | ${incident.coordinates}`;
  }

  updateNetworkStatus(isOnline) {
    this.isOnline = isOnline;
    const badge = document.getElementById('global-network-badge');
    if (badge) {
      if (isOnline) {
        badge.textContent = 'ONLINE';
        badge.className = 'status-pill status-online';
      } else {
        badge.textContent = 'OFFLINE MODE (CACHED)';
        badge.className = 'status-pill status-offline';
      }
    }
  }

  // 12. 8-Step Guided Mission Tour Walkthrough
  initGuidedTour() {
    const btnStartTour = document.getElementById('btn-start-guided-tour');
    const tourModal = document.getElementById('modal-guided-tour');
    const tourStepTitle = document.getElementById('tour-step-title');
    const tourStepDesc = document.getElementById('tour-step-desc');
    const tourStepNum = document.getElementById('tour-step-number');
    const btnNextStep = document.getElementById('btn-tour-next');
    const btnCloseTour = document.getElementById('btn-tour-close');

    if (!btnStartTour || !tourModal) return;

    let currentStep = 0;
    const steps = [
      {
        num: '1 / 8',
        title: 'Open Mars 3D Planetary Map',
        desc: 'Opening the interactive 3D Mars globe with MOLA topography, day/night lighting, and orbital reticles.',
        action: () => {
          this.switchView('map');
          if (this.mapMode !== '3d') {
            document.getElementById('btn-toggle-map-mode').click();
          }
        }
      },
      {
        num: '2 / 8',
        title: 'Select Jezero Crater (Landing Site)',
        desc: 'Focusing on Jezero Crater (18.38° N, 77.58° E, Elev: -2,500m), home to the NASA Perseverance rover and ancient river delta.',
        action: () => {
          this.switchView('map');
          const jezero = MARS_LOCATIONS.find((l) => l.id === 'jezero');
          if (jezero) {
            this.globe3d.focusLocationById('jezero');
            this.onLocationSelected(jezero);
          }
        }
      },
      {
        num: '3 / 8',
        title: 'View NASA Imagery & Location Intel',
        desc: 'Inspecting verified NASA HiRISE and Mastcam-Z imagery, delta escarpment characteristics, and mission scientific significance.',
        action: () => {
          this.switchView('map');
          const jezero = MARS_LOCATIONS.find((l) => l.id === 'jezero');
          this.renderLocationDrawer(jezero);
        }
      },
      {
        num: '4 / 8',
        title: 'Select Exploration Destination',
        desc: 'Setting destination to Gale Crater (Mount Sharp / Curiosity site) to initiate automated route planning.',
        action: () => {
          this.switchView('navigation');
          const gale = MARS_LOCATIONS.find((l) => l.id === 'gale');
          this.navigation.destLocation = gale;
          this.renderNavigationPlanner();
        }
      },
      {
        num: '5 / 8',
        title: 'Calculate Distance & Oxygen Requirements',
        desc: 'Calculating great-circle distance, elevation slope profiles, and life-support oxygen budget for the mission.',
        action: () => {
          this.switchView('lifesupport');
          this.oxygen.plannedActivityHours = 4.5;
          this.renderOxygenDashboard();
        }
      },
      {
        num: '6 / 8',
        title: 'Inspect Environmental Hazards',
        desc: 'Reviewing the Martian hazard intelligence matrix: regional dust storm fronts, cryogenic cold, toxic perchlorates, and solar radiation.',
        action: () => {
          this.switchView('hazards');
        }
      },
      {
        num: '7 / 8',
        title: 'Switch Interface Language to Hindi / International',
        desc: 'Dynamically switching navigation labels, telemetry indicators, and safety procedures from English to Hindi (or any of the 14 supported languages).',
        action: () => {
          const select = document.getElementById('global-lang-select');
          if (select) {
            select.value = 'hi';
            this.switchLanguage('hi');
          }
        }
      },
      {
        num: '8 / 8',
        title: 'Demonstrate Crew Health & Emergency SOS',
        desc: 'Viewing live astronaut ECG waveform telemetry, simulating high exertion, and opening the emergency assistance center.',
        action: () => {
          this.switchView('health');
          this.health.simulateState('exertion');
          setTimeout(() => {
            this.switchView('emergency');
          }, 2000);
        }
      }
    ];

    const runStep = (idx) => {
      const step = steps[idx];
      if (tourStepNum) tourStepNum.textContent = step.num;
      if (tourStepTitle) tourStepTitle.textContent = step.title;
      if (tourStepDesc) tourStepDesc.textContent = step.desc;
      soundFx.playConfirm();
      step.action();

      if (idx === steps.length - 1) {
        if (btnNextStep) btnNextStep.textContent = 'FINISH TOUR';
      } else {
        if (btnNextStep) btnNextStep.textContent = 'NEXT STEP ▶';
      }
    };

    btnStartTour.onclick = () => {
      currentStep = 0;
      tourModal.classList.remove('hidden');
      runStep(0);
    };

    if (btnNextStep) {
      btnNextStep.onclick = () => {
        currentStep++;
        if (currentStep < steps.length) {
          runStep(currentStep);
        } else {
          tourModal.classList.add('hidden');
        }
      };
    }

    if (btnCloseTour) {
      btnCloseTour.onclick = () => {
        tourModal.classList.add('hidden');
      };
    }
  }
}

// Initialize on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  if (!window.app) {
    window.app = new MarsExplorerApp();
  }
});
