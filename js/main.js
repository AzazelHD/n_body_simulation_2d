import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { Starfield, StarfieldCell } from "./starfield.js";
import { CelestialBody } from "./celestialBody.js";

const $ = (selector) => document.querySelector(selector);

const canvas = $("#canvas");
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// Orbiting Planets
// const pos1 = new THREE.Vector2(0, 0);
// const pos2 = new THREE.Vector2(0, -200);
// const pos3 = new THREE.Vector2(0, 200);
// const vel1 = new THREE.Vector2(0, 0);
// const vel2 = new THREE.Vector2(-2, 0);
// const vel3 = new THREE.Vector2(2, 0);
// const bodies = [
//   new CelestialBody(pos1, vel1, 1000, "white", scene),
//   new CelestialBody(pos2, vel2, 100, "red", scene),
//   new CelestialBody(pos3, vel3, 100, "teal", scene),
// ];

// Figure-8 orbit
// Lagrange L4/L5 Triangle - Very Stable
const pos1 = new THREE.Vector2(0, 0);
const pos2 = new THREE.Vector2(200, 0);
const pos3 = new THREE.Vector2(100, 100 * Math.sqrt(3));

const speed = 0.1;

const vel1 = pos2.clone().sub(pos1).normalize().multiplyScalar(speed);
const vel2 = pos3.clone().sub(pos2).normalize().multiplyScalar(speed);
const vel3 = pos1.clone().sub(pos3).normalize().multiplyScalar(speed);

const bodies = [
  new CelestialBody(pos1, vel1, 10, "white", scene), // Heavy central body
  new CelestialBody(pos2, vel2, 10, "red", scene), // Light body
  new CelestialBody(pos3, vel3, 10, "teal", scene), // Light body
];

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
camera.position.set(...pos1, 100);

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
  setupButtons();
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
      animate(dt, integrator, G);
    } else {
      paused = true;
      startButton.textContent = "Resume";
      cancelAnimationFrame(simulationId);
    }
  });

  resetButton.addEventListener("click", () => {
    dtInput.value = dt = 1;
    dtValue.textContent = dt;
    integratorInput.value = integrator = 2;
    updateIntegratorLabel(integrator);

    bodies.forEach((body) => {
      body.reset();
    });

    camera.position.set(...bodies[0].state.position, 100);

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
