import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { Starfield, StarfieldCell } from "./starfield.js";
import { CelestialBody } from "./celestialBody.js";
import { cloneScenarioBodies } from "./scenarios.js";
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

/**
 * Destroy all bodies from the scene
 */
function destroyBodies() {
  bodies.forEach((body) => {
    body.dispose();
  });
  bodies = [];
}

/**
 * Initialize bodies from configuration
 * @param {Array} config - Array of body configurations
 */
function initializeBodies(config) {
  destroyBodies();
  bodiesConfig = config.map((c) => ({ ...c })); // Deep copy
  activeBodiesConfig = config.map((c) => ({ ...c })); // Store active config
  pendingBodiesConfig = config.map((c) => ({ ...c })); // Update pending config

  // Create CelestialBody instances from config
  bodies = bodiesConfig.map((bodyConfig) => {
    const pos = new THREE.Vector2(bodyConfig.posX, bodyConfig.posY);
    const vel = new THREE.Vector2(bodyConfig.velX, bodyConfig.velY);
    return new CelestialBody(pos, vel, bodyConfig.mass, bodyConfig.color, scene);
  });

  // Reset camera to body[0] if bodies exist
  if (bodies.length > 0) {
    camera.position.set(bodiesConfig[0].posX, bodiesConfig[0].posY, 100);
  }

  // Render body cards in UI (only if DOM is ready)
  const container = document.getElementById("bodiesContainer");
  if (container) {
    BodyEditor.renderAndAttachListeners("bodiesContainer", pendingBodiesConfig, renderBodyCards);
    BodyEditor.setBodyInputsDisabled("bodiesContainer", paused === false);
  }
}

// Load default scenario (Lagrange Triangle) - will be called in DOMContentLoaded
let initialScenarioLoaded = false;

function loadInitialScenario() {
  if (!initialScenarioLoaded) {
    initializeBodies(cloneScenarioBodies("lagrangeTriangle"));
    initialScenarioLoaded = true;
  }
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
let dt = 1;
let G = 1;

const dtInput = $("#dtInput");
const dtValue = $("#dtValue");
const integratorInput = $("#integratorInput");
const integratorValue = $("#integratorValue");

dtInput.value = dt;
dtValue.textContent = dt;
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

let simulationId = null;

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

function setupBodyEditor() {
  const scenarioSelect = $("#scenarioSelect");
  const addBodyBtn = $("#addBodyBtn");
  const applyChangesBtn = $("#applyChanges");
  const resetBodiesBtn = $("#resetBodies");

  // Scenario dropdown handler
  scenarioSelect.addEventListener("change", (e) => {
    if (e.target.value === "") return; // Custom selected, do nothing

    const scenarioKey = e.target.value;
    const scenarioConfig = cloneScenarioBodies(scenarioKey);
    if (scenarioConfig.length > 0) {
      pendingBodiesConfig = scenarioConfig;
      renderBodyCards();
      BodyEditor.clearError();
    }
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
      color: "#ffffff",
    };
    pendingBodiesConfig.push(newBody);
    renderBodyCards();
    BodyEditor.clearError();
  });

  // Apply Changes button
  applyChangesBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // Validate
    const validation = BodyEditor.validateBodiesConfig(pendingBodiesConfig);
    if (!validation.valid) {
      BodyEditor.showError(validation.error);
      return;
    }

    // Apply the pending changes
    initializeBodies(pendingBodiesConfig);

    // Pause simulation and update UI
    paused = true;
    const startButton = $("#resumeSimulation");
    startButton.textContent = "Resume";
    cancelAnimationFrame(simulationId);

    // Disable inputs since we're paused but will re-enable
    BodyEditor.setBodyInputsDisabled("bodiesContainer", false);
    BodyEditor.clearError();

    // Render one frame to show new configuration
    renderer.render(scene, camera);
  });

  // Reset to Scenario button
  resetBodiesBtn.addEventListener("click", (e) => {
    e.preventDefault();
    pendingBodiesConfig = activeBodiesConfig.map((c) => ({ ...c }));
    renderBodyCards();
    BodyEditor.clearError();
  });
}

function animate(dt, integrator = 2, G = 1) {
  if (paused) return;

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

      bodies.forEach((body) => {
        const newAcc = body.calculateAccelerationFromState(
          bodies,
          new Map(
            bodies.map((b) => [b, { position: b.state.position, velocity: b.state.velocity }]),
          ),
          G,
        );
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

  camera.position.set(...bodies[0].state.position, 100);
  starField.update(camera);
  renderer.render(scene, camera);
  simulationId = requestAnimationFrame(() => animate(dt, integrator, G));
}

document.addEventListener("DOMContentLoaded", () => {
  loadInitialScenario();
  setupButtons();
  setupBodyEditor();
  animate(dt, integrator, G);
});

function setupButtons() {
  const dtInput = $("#dtInput");
  const dtValue = $("#dtValue");
  const integratorInput = $("#integratorInput");
  const integratorValue = $("#integratorValue");
  const startButton = $("#resumeSimulation");
  const resetButton = $("#restartSimulation");

  dtInput.addEventListener("input", function () {
    dt = dtInput.value;
    dt = Math.pow(dt - 0.1, 2) * 1.18906;
    dtValue.textContent = dt.toFixed(2);
    cancelAnimationFrame(simulationId);
    animate(dt, integrator, G);
  });

  integratorInput.addEventListener("input", function () {
    integrator = parseInt(integratorInput.value);
    updateIntegratorLabel(integrator);
    cancelAnimationFrame(simulationId);
    animate(dt, integrator, G);
  });

  startButton.addEventListener("click", () => {
    if (paused) {
      paused = false;
      startButton.textContent = "Pause";
      BodyEditor.setBodyInputsDisabled("bodiesContainer", true);
      animate(dt, integrator, G);
    } else {
      paused = true;
      startButton.textContent = "Resume";
      BodyEditor.setBodyInputsDisabled("bodiesContainer", false);
      cancelAnimationFrame(simulationId);
    }
  });

  resetButton.addEventListener("click", () => {
    dtInput.value = dt = 1;
    dtValue.textContent = dt;
    integratorInput.value = integrator = 2;
    updateIntegratorLabel(integrator);

    // Reinitialize bodies from active config
    initializeBodies(activeBodiesConfig);

    // Ensure inputs are enabled since we're paused
    BodyEditor.setBodyInputsDisabled("bodiesContainer", false);

    renderer.render(scene, camera);
    paused = true;
    startButton.textContent = "Resume";
    cancelAnimationFrame(simulationId);
  });
}

window.addEventListener("wheel", (event) => {
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

window.addEventListener("keydown", (event) => {
  if (event.key === "Home") {
    const debugEnabled = starField.toggleDebug();
    console.log(`Debug mode: ${debugEnabled ? "ON" : "OFF"}`);

    if (!debugEnabled && camera.zoom < 0.25) {
      camera.zoom = 0.25;
      camera.updateProjectionMatrix();
    }

    // Keep screen updated when hitting HOME in paused state.
    if (paused) {
      renderer.render(scene, camera);
    }
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
