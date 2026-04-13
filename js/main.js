import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { Starfield, StarfieldCell } from "./starfield.js";
import { CelestialBody } from "./celestialBody.js";
import { SCENARIOS, cloneScenarioBodies } from "./scenarios.js";
import { PHYSICS_CONFIG } from "./physicsConfig.js";
import * as BodyEditor from "./bodyEditor.js";

const $ = (selector) => document.querySelector(selector);

const canvas = $("#canvas");
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Bodies configuration and instances
let bodiesConfig = []; // Array of {posX, posY, velX, velY, mass, color}
let bodies = []; // Array of CelestialBody instances
let activeBodiesConfig = []; // Currently active scenario
let pendingBodiesConfig = []; // Being edited in UI (not yet applied)
let velocityArrows = [];
let bodyTrails = [];
let activeCameraMode = "firstBody";

const TRAIL_MAX_POINTS = 100;
const TRAIL_OPACITY = 0.35;

/**
 * Destroy all bodies from the scene
 */
function destroyBodies() {
  bodies.forEach((body) => {
    body.dispose();
  });
  bodies = [];
}

function getCenterOfMass(config) {
  if (config.length === 0) {
    return { x: 0, y: 0 };
  }

  const totals = config.reduce(
    (accumulator, body) => {
      const mass = Number.isFinite(body.mass) ? body.mass : 0;
      accumulator.mass += mass;
      accumulator.x += body.posX * mass;
      accumulator.y += body.posY * mass;
      return accumulator;
    },
    { mass: 0, x: 0, y: 0 },
  );

  if (totals.mass <= 0) {
    return { x: config[0].posX, y: config[0].posY };
  }

  return {
    x: totals.x / totals.mass,
    y: totals.y / totals.mass,
  };
}

function getCameraAnchor(config, cameraMode = activeCameraMode) {
  if (config.length === 0) {
    return { x: 0, y: 0 };
  }

  if (cameraMode === "centerOfMass") {
    return getCenterOfMass(config);
  }

  return { x: config[0].posX, y: config[0].posY };
}

/**
 * Initialize bodies from configuration
 * @param {Array} config - Array of body configurations
 */
function initializeBodies(config, options = {}) {
  const { cameraMode = activeCameraMode } = options;

  destroyBodies();
  clearVelocityArrows();
  clearBodyTrails();
  activeCameraMode = cameraMode;
  bodiesConfig = config.map((c) => ({ ...c })); // Deep copy
  activeBodiesConfig = config.map((c) => ({ ...c })); // Store active config
  pendingBodiesConfig = config.map((c) => ({ ...c })); // Update pending config

  // Create CelestialBody instances from config
  bodies = bodiesConfig.map((bodyConfig) => {
    const pos = new THREE.Vector2(bodyConfig.posX, bodyConfig.posY);
    const vel = new THREE.Vector2(bodyConfig.velX, bodyConfig.velY);
    return new CelestialBody(pos, vel, bodyConfig.mass, bodyConfig.color, scene);
  });

  // Reset camera to either the first body or the center of mass, depending on the scenario.
  if (bodies.length > 0) {
    const cameraAnchor = getCameraAnchor(bodiesConfig, activeCameraMode);
    camera.position.set(cameraAnchor.x, cameraAnchor.y, 100);
    selectedBodyIndex = activeCameraMode === "centerOfMass" ? -1 : 0;
    cameraTarget.set(cameraAnchor.x, cameraAnchor.y, 100);
    transitionInProgress = false;
  }

  // Keep starfield centered with any camera jump (initial load, scenario swap, reset).
  starField.update(camera);

  // Render body cards in UI (only if DOM is ready)
  const container = document.getElementById("bodiesContainer");
  if (container) {
    BodyEditor.renderAndAttachListeners("bodiesContainer", pendingBodiesConfig, renderBodyCards);
    BodyEditor.setBodyInputsDisabled("bodiesContainer", paused === false);
  }
  setEditorControlsDisabled(paused === false);

  updateVelocityArrows();
  createBodyTrails();
  updateBodyTrails();
}

// Load default scenario (Lagrange Triangle) - will be called in DOMContentLoaded
let initialScenarioLoaded = false;

function loadInitialScenario() {
  if (!initialScenarioLoaded) {
    initializeBodies(cloneScenarioBodies("lagrangeTriangle"), {
      cameraMode: SCENARIOS.lagrangeTriangle?.cameraMode || "firstBody",
    });
    initialScenarioLoaded = true;
  }
}

/**
 * Disable or enable structural body-editor controls.
 * Preset switching stays enabled so scenarios can be swapped while the sim is running.
 */
function setEditorControlsDisabled(disabled) {
  const addBodyBtn = $("#addBodyBtn");

  if (addBodyBtn) addBodyBtn.disabled = disabled;
}

// Camera setup
const frustum = 1000;
let aspectRatio = canvas.width / canvas.height;
const camera = new THREE.OrthographicCamera(
  (-aspectRatio * frustum) / 2,
  (aspectRatio * frustum) / 2,
  frustum / 2,
  -frustum / 2,
  1,
  1000,
);
// Camera will be positioned by initializeBodies()

// Simulation parameters

let paused = false;
let integrator = 2;
let G = PHYSICS_CONFIG.gravitationalConstant;

// Fixed physics step for accuracy
const FIXED_DT = 0.005;
const SPEED_UI_TO_INTERNAL_MULTIPLIER = 100; // UI 3 => internal 300 (old normal)
const DEFAULT_SPEED_UI = 3;
const MAX_FRAME_DELTA_SECONDS = 0.05;
const MAX_FIXED_STEPS_PER_FRAME = 1500;
let speedMultiplier = DEFAULT_SPEED_UI * SPEED_UI_TO_INTERNAL_MULTIPLIER;
let accumulatedTime = 0;

// Planet navigation and camera transitions
let selectedBodyIndex = 0; // Track which body/planet is currently selected
let cameraTarget = new THREE.Vector3();
let transitionInProgress = false;
const baseTransitionSpeed = 0.08; // Adjust for smoothness (0-1)

const dtInput = $("#dtInput");
const dtValue = $("#dtValue");
const integratorInput = $("#integratorInput");
const integratorValue = $("#integratorValue");

// Use existing speed slider under simulation options
dtInput.min = "1";
dtInput.max = "10";
dtInput.step = "0.1";
dtInput.value = DEFAULT_SPEED_UI;
dtValue.textContent = Number.parseFloat(dtInput.value).toFixed(1);
integratorInput.value = integrator;
updateIntegratorLabel(integrator);

// Starfield configuration - 3x3 grid with 3000 stars per cell
const starfieldConfig = {
  gridSize: 3,
  starsPerCell: 3000,
  normalZoom: 0.25,
  debugZoom: 0.05,
  paddingFactor: 1.0,
};

// Using camera frustum and zoom constants from main.js for explicit cell sizing
const baseCellWidth =
  ((camera.right - camera.left) / starfieldConfig.normalZoom) * starfieldConfig.paddingFactor;
const baseCellHeight =
  ((camera.top - camera.bottom) / starfieldConfig.normalZoom) * starfieldConfig.paddingFactor;

const initialCells = [];
const totalCells = starfieldConfig.gridSize * starfieldConfig.gridSize;
for (let i = 0; i < totalCells; i++) {
  initialCells.push(
    new StarfieldCell(starfieldConfig.starsPerCell, baseCellWidth, baseCellHeight, {
      color: 0xffffff,
      size: 2,
      brightness: 1.0,
    }),
  );
}

starfieldConfig.initialCells = initialCells;

const starField = new Starfield(scene, camera, starfieldConfig);

function disposeArrow(arrow) {
  arrow.traverse((obj) => {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((material) => material.dispose());
      } else {
        obj.material.dispose();
      }
    }
  });
}

function clearVelocityArrows() {
  velocityArrows.forEach((arrow) => {
    scene.remove(arrow);
    disposeArrow(arrow);
  });
  velocityArrows = [];
}

function getBodyColorHex(body) {
  if (typeof body.initialState.color === "string") {
    return Number.parseInt(body.initialState.color.replace("#", ""), 16);
  }
  return 0xffffff;
}

function createBodyTrails() {
  bodyTrails = bodies.map((body) => {
    const geometry = new THREE.BufferGeometry();
    const points = new Float32Array(TRAIL_MAX_POINTS * 3);
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));
    geometry.setDrawRange(0, 0);

    const material = new THREE.LineBasicMaterial({
      color: getBodyColorHex(body),
      transparent: true,
      opacity: TRAIL_OPACITY,
    });

    const line = new THREE.Line(geometry, material);
    line.frustumCulled = false;
    scene.add(line);

    return {
      line,
      points,
      count: 0,
    };
  });
}

function clearBodyTrails() {
  bodyTrails.forEach((trail) => {
    scene.remove(trail.line);
    trail.line.geometry.dispose();
    trail.line.material.dispose();
  });
  bodyTrails = [];
}

function appendTrailPoint(trail, x, y) {
  if (trail.count < TRAIL_MAX_POINTS) {
    const index = trail.count * 3;
    trail.points[index] = x;
    trail.points[index + 1] = y;
    trail.points[index + 2] = 0;
    trail.count += 1;
  } else {
    trail.points.copyWithin(0, 3);
    const index = (TRAIL_MAX_POINTS - 1) * 3;
    trail.points[index] = x;
    trail.points[index + 1] = y;
    trail.points[index + 2] = 0;
  }

  const positions = trail.line.geometry.attributes.position;
  positions.needsUpdate = true;
  trail.line.geometry.setDrawRange(0, trail.count);
}

function updateBodyTrails() {
  const total = Math.min(bodies.length, bodyTrails.length);

  for (let i = 0; i < total; i++) {
    const body = bodies[i];
    const trail = bodyTrails[i];
    appendTrailPoint(trail, body.state.position.x, body.state.position.y);
  }
}

function updateVelocityArrows() {
  clearVelocityArrows();

  if (!starField.isDebugMode()) return;

  bodies.forEach((body) => {
    const velocity = body.state.velocity;
    const speed = velocity.length();
    if (speed < 1e-6) return;

    const direction = new THREE.Vector3(velocity.x, velocity.y, 0).normalize();
    const origin = new THREE.Vector3(body.state.position.x, body.state.position.y, 1);
    const arrowLength = Math.max(8, Math.min(80, speed * 18));

    const arrowColor = getBodyColorHex(body);

    const arrow = new THREE.ArrowHelper(direction, origin, arrowLength, arrowColor, 6, 4);
    scene.add(arrow);
    velocityArrows.push(arrow);
  });
}

let simulationId = null;
let lastFrameTime = null;

function updateIntegratorLabel(value) {
  const labels = {
    1: "Euler",
    2: "Verlet",
    3: "RK4",
  };
  integratorValue.textContent = labels[value] || "Unknown";
}

function renderBodyCards() {
  BodyEditor.renderAndAttachListeners("bodiesContainer", pendingBodiesConfig, renderBodyCards);
  BodyEditor.setBodyInputsDisabled("bodiesContainer", !paused);
}

/**
 * Dynamically populate scenario dropdown from SCENARIOS object
 */
function populateScenarioDropdown() {
  const scenarioSelect = $("#scenarioSelect");
  if (!scenarioSelect) return;

  // Get all scenario keys from SCENARIOS
  const scenarioKeys = Object.keys(SCENARIOS);

  // Remove all options except the first one ("Custom")
  while (scenarioSelect.options.length > 1) {
    scenarioSelect.remove(1);
  }

  // Add options for each scenario
  scenarioKeys.forEach((key) => {
    const scenario = SCENARIOS[key];
    const option = document.createElement("option");
    option.value = key;
    option.textContent = scenario.name;
    scenarioSelect.appendChild(option);
  });

  // Set first scenario as selected
  if (scenarioKeys.length > 0) {
    scenarioSelect.value = scenarioKeys[0];
  }
}

function setupBodyEditor() {
  const scenarioSelect = $("#scenarioSelect");
  const addBodyBtn = $("#addBodyBtn");
  const resetBodiesBtn = $("#resetBodies");
  const bodiesContainer = document.getElementById("bodiesContainer");

  // Scenario dropdown handler
  scenarioSelect.addEventListener("change", (e) => {
    if (e.target.value === "") return; // Custom selected, do nothing

    const scenarioKey = e.target.value;
    const scenarioConfig = cloneScenarioBodies(scenarioKey);
    if (scenarioConfig.length > 0) {
      initializeBodies(scenarioConfig, {
        cameraMode: SCENARIOS[scenarioKey]?.cameraMode || "firstBody",
      });
      BodyEditor.clearError();

      if (paused) {
        starField.update(camera);
        renderer.render(scene, camera);
      }
    }
  });

  const commitPendingBodiesConfig = () => {
    const validation = BodyEditor.validateBodiesConfig(pendingBodiesConfig);
    if (!validation.valid) {
      BodyEditor.showError(validation.error);
      return;
    }

    initializeBodies(pendingBodiesConfig, { cameraMode: activeCameraMode });
    BodyEditor.clearError();

    if (paused) {
      starField.update(camera);
      renderer.render(scene, camera);
    }
  };

  bodiesContainer?.addEventListener("input", (e) => {
    if (!e.target.classList.contains("body-hue")) return;

    const card = e.target.closest(".body-card");
    if (!card) return;

    const index = parseInt(card.dataset.index, 10);
    if (!Number.isFinite(index) || index < 0 || index >= bodies.length) return;

    const color = pendingBodiesConfig[index]?.color;
    if (!color) return;

    bodies[index].setColor(color);
    if (activeBodiesConfig[index]) {
      activeBodiesConfig[index].color = color;
    }
    if (bodyTrails[index]) {
      bodyTrails[index].line.material.color.set(color);
    }
    updateVelocityArrows();

    if (paused) {
      starField.update(camera);
      renderer.render(scene, camera);
    }
  });

  // Commit non-color field edits when an input loses focus / commits value.
  bodiesContainer?.addEventListener("change", (e) => {
    if (!e.target.classList.contains("body-input") || e.target.classList.contains("body-hue")) {
      return;
    }

    commitPendingBodiesConfig();
  });

  // Remove-body actions are structural changes and should apply immediately.
  bodiesContainer?.addEventListener("click", (e) => {
    if (!e.target.classList.contains("remove-body-btn-x") || e.target.disabled) return;

    commitPendingBodiesConfig();
  });

  // Add Body button
  addBodyBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const newBody = {
      posX: 0,
      posY: 0,
      velX: 0,
      velY: 0,
      mass: 10,
      color: BodyEditor.getRandomBodyColor(),
    };
    pendingBodiesConfig.push(newBody);

    commitPendingBodiesConfig();
  });

  // Reset to Scenario button
  resetBodiesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    initializeBodies(activeBodiesConfig, { cameraMode: activeCameraMode });
    BodyEditor.clearError();

    if (paused) {
      starField.update(camera);
      renderer.render(scene, camera);
    }
  });
}

function stepPhysics(dt, integrator, G) {
  switch (integrator) {
    case 1: // EULER
      bodies.forEach((body) => {
        body.state.acceleration.set(0, 0);
        bodies.forEach((other) => {
          if (other !== body) {
            body.applyGravity(other, G);
          }
        });
      });
      bodies.forEach((body) => {
        body.updateEuler(dt);
      });
      break;
    case 2: // VERLET
      const oldStateVerlet = new Map();
      bodies.forEach((body) => {
        oldStateVerlet.set(body, {
          position: body.state.position.clone(),
          velocity: body.state.velocity.clone(),
        });
      });
      const oldAccelerations = new Map();
      bodies.forEach((body) => {
        const oldAcc = body.updateVerlet(dt, bodies, G, oldStateVerlet);
        oldAccelerations.set(body, oldAcc);
      });
      const currentStateVerlet = new Map(
        bodies.map((b) => [b, { position: b.state.position, velocity: b.state.velocity }]),
      );
      bodies.forEach((body) => {
        const newAcc = body.calculateAccelerationFromState(bodies, currentStateVerlet, G);
        body.updateVerletVelocity(dt, oldAccelerations.get(body), newAcc);
      });
      break;
    case 3: // RK4
      const oldStateRK4 = new Map();
      bodies.forEach((body) => {
        oldStateRK4.set(body, {
          position: body.state.position.clone(),
          velocity: body.state.velocity.clone(),
        });
      });
      bodies.forEach((body) => {
        body.updateRK4(dt, bodies, G, oldStateRK4);
      });
      break;
  }
}

function getSpeedUiValue() {
  const speedUi = Number.parseFloat(dtInput.value);
  if (!Number.isFinite(speedUi)) return DEFAULT_SPEED_UI;
  return Math.max(1, Math.min(10, speedUi));
}

function updateSpeedFromUi() {
  const speedUi = getSpeedUiValue();
  speedMultiplier = speedUi * SPEED_UI_TO_INTERNAL_MULTIPLIER;
  dtValue.textContent = speedUi.toFixed(1);
}

function resetSimulationClock() {
  accumulatedTime = 0;
  lastFrameTime = null;
}

function animateLoop(now) {
  if (paused) return;
  if (!lastFrameTime) lastFrameTime = now;
  let elapsed = (now - lastFrameTime) / 1000; // seconds
  lastFrameTime = now;

  // Cap elapsed to avoid spiral-of-death if a frame takes too long
  elapsed = Math.min(elapsed, MAX_FRAME_DELTA_SECONDS);

  // Scale elapsed time by speed multiplier
  elapsed *= speedMultiplier;
  accumulatedTime += elapsed;

  // Run fixed-size physics steps up to the per-frame cap.
  // FIXED_DT=0.005 is already precise enough; no substep multiplier needed.
  let steps = 0;
  while (accumulatedTime >= FIXED_DT && steps < MAX_FIXED_STEPS_PER_FRAME) {
    stepPhysics(FIXED_DT, integrator, G);
    accumulatedTime -= FIXED_DT;
    steps++;
  }

  // Avoid carrying huge debt if we hit the frame-step cap.
  if (steps === MAX_FIXED_STEPS_PER_FRAME) {
    accumulatedTime = Math.min(accumulatedTime, FIXED_DT);
  }

  // Update camera and render
  updateCameraTransition();
  updateBodyTrails();
  updateVelocityArrows();
  starField.update(camera);
  renderer.render(scene, camera);
  simulationId = requestAnimationFrame(animateLoop);
}

document.addEventListener("DOMContentLoaded", () => {
  loadInitialScenario();
  populateScenarioDropdown();
  setupButtons();
  setupBodyEditor();
  updateSpeedFromUi();
  resetSimulationClock();
  simulationId = requestAnimationFrame(animateLoop);
});

function setupButtons() {
  const dtInput = $("#dtInput");
  const dtValue = $("#dtValue");
  const integratorInput = $("#integratorInput");
  const startButton = $("#resumeSimulation");
  const resetButton = $("#restartSimulation");

  // Speed slider controls simulation speed
  dtInput.addEventListener("input", function () {
    updateSpeedFromUi();
  });

  // Integrator selection
  integratorInput.addEventListener("input", function () {
    integrator = parseInt(integratorInput.value);
    updateIntegratorLabel(integrator);
  });

  startButton.addEventListener("click", () => {
    if (paused) {
      paused = false;
      startButton.textContent = "Pause";
      BodyEditor.setBodyInputsDisabled("bodiesContainer", true);
      setEditorControlsDisabled(true);
      resetSimulationClock();
      simulationId = requestAnimationFrame(animateLoop);
    } else {
      paused = true;
      startButton.textContent = "Resume";
      BodyEditor.setBodyInputsDisabled("bodiesContainer", false);
      setEditorControlsDisabled(false);
      cancelAnimationFrame(simulationId);
    }
  });

  resetButton.addEventListener("click", () => {
    const targetBodyIndex = Math.max(0, Math.min(selectedBodyIndex, activeBodiesConfig.length - 1));

    // Reinitialize bodies from active config
    initializeBodies(activeBodiesConfig, { cameraMode: activeCameraMode });

    // Keep camera centered on the body that was selected before restart.
    if (bodies.length > 0 && activeCameraMode !== "centerOfMass") {
      selectedBodyIndex = targetBodyIndex;
      const targetBody = bodies[selectedBodyIndex];
      camera.position.set(targetBody.state.position.x, targetBody.state.position.y, 100);
      cameraTarget.set(targetBody.state.position.x, targetBody.state.position.y, 100);
      transitionInProgress = false;
      camera.updateProjectionMatrix();
    }

    // Ensure inputs and controls are enabled since we're paused
    BodyEditor.setBodyInputsDisabled("bodiesContainer", false);
    setEditorControlsDisabled(false);

    // Reset can teleport camera/body positions; recenter starfield before render.
    starField.update(camera);
    renderer.render(scene, camera);
    paused = true;
    startButton.textContent = "Resume";
    resetSimulationClock();
    cancelAnimationFrame(simulationId);
  });
}

window.addEventListener("wheel", (event) => {
  // Don't zoom if scrolling over the controls panel
  if (event.target.closest("#controls")) {
    return;
  }

  const maxZoomOut = starField.isDebugMode() ? 0.05 : 0.25;

  if (event.deltaY > 0) {
    camera.zoom = Math.max(maxZoomOut, camera.zoom * 0.975);
  } else {
    camera.zoom = Math.min(3, camera.zoom * 1.025);
  }
  camera.updateProjectionMatrix();

  // Render immediately during pause so the zoom update is visible.
  if (paused) {
    renderer.render(scene, camera);
  }
});

/**
 * Smoothly transition camera to focus on a body
 * Speed scales with distance: further = faster
 * @param {number} index - Body index to focus on
 */
function focusOnBody(index) {
  if (index < 0 || index >= bodies.length) return;

  activeCameraMode = "firstBody";
  selectedBodyIndex = index;
  const bodyPos = bodiesConfig[index];

  // Set target position (with z offset)
  cameraTarget.set(bodyPos.posX, bodyPos.posY, 100);
  transitionInProgress = true;
}

/**
 * Calculate adaptive speed based on distance
 * @param {number} distance - Distance to travel
 * @returns {number} Speed factor (0-1)
 */
function calculateAdaptiveSpeed(distance) {
  // Distance influences speed: further = faster
  // Formula: clamp baseSpeed * (1 + distance/500) between 0.02 and 0.3
  const speedMultiplier = Math.min(0.3, baseTransitionSpeed * (1 + distance / 500));
  return Math.max(0.02, speedMultiplier);
}

/**
 * Update camera position during transition
 * Called each frame in the animation loop
 * Camera smoothly chases the selected body, updating target position each frame
 */
function updateCameraTransition() {
  if (activeCameraMode === "centerOfMass") {
    const centerOfMass = getCenterOfMass(
      bodies.map((body) => ({
        posX: body.state.position.x,
        posY: body.state.position.y,
        mass: body.mass,
      })),
    );
    cameraTarget.set(centerOfMass.x, centerOfMass.y, 100);
  } else {
    if (selectedBodyIndex < 0 || selectedBodyIndex >= bodies.length) return;

    // Update target to selected body's CURRENT SIMULATED position every frame
    const body = bodies[selectedBodyIndex];
    cameraTarget.set(body.state.position.x, body.state.position.y, 100);
  }

  const currentPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);
  const distance = currentPos.distanceTo(cameraTarget);

  // Always use smooth lerp when in transition mode
  if (transitionInProgress) {
    // Calculate adaptive speed based on distance during active transition
    const speed = calculateAdaptiveSpeed(distance);
    currentPos.lerp(cameraTarget, speed);
  } else {
    // When not transitioning, use gentle continuous following (slower speed)
    // This prevents jumps when switching planets
    currentPos.lerp(cameraTarget, 0.05);
  }

  camera.position.copy(currentPos);
  camera.updateProjectionMatrix();
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Home") {
    const debugEnabled = starField.toggleDebug();
    console.log(`Debug mode: ${debugEnabled ? "ON" : "OFF"}`);
    updateVelocityArrows();

    if (!debugEnabled && camera.zoom < 0.25) {
      camera.zoom = 0.25;
      camera.updateProjectionMatrix();
    }

    // Keep screen updated when hitting HOME in paused state.
    if (paused) {
      renderer.render(scene, camera);
    }
  }

  // Planet navigation with E (next) and Q (previous)
  if (event.key.toLowerCase() === "e") {
    focusOnBody((selectedBodyIndex + 1) % bodies.length);
  }
  if (event.key.toLowerCase() === "q") {
    focusOnBody((selectedBodyIndex - 1 + bodies.length) % bodies.length);
  }
});

window.addEventListener("resize", () => {
  aspectRatio = window.innerWidth / window.innerHeight;

  camera.left = -aspectRatio * frustum;
  camera.right = aspectRatio * frustum;
  camera.top = frustum;
  camera.bottom = -frustum;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

  starField.resize(camera);
});
