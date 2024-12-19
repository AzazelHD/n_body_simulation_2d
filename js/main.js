import * as THREE from "three";
import { Starfield } from "./starfield.js";
import { CelestialBody } from "./celestialBody.js";
// import { StarfieldShader } from "./shader.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const canvas = $("#canvas");

const pos1 = new THREE.Vector2(0, 0);
const pos2 = new THREE.Vector2(0, -200);
const pos3 = new THREE.Vector2(0, 200);

const vel1 = new THREE.Vector2(0, 0);
const vel2 = new THREE.Vector2(-2, 0);
const vel3 = new THREE.Vector2(2, 0);

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Celestial Bodies initialization
const bodies = [
  // new CelestialBody(pos1, vel1, 1000, "white", scene),
  // new CelestialBody(pos2, vel2, 100, "red", scene),
  new CelestialBody(pos3, vel3, 100, "teal", scene),
];

// Camera setup
const frustum = 1000;
let aspectRatio = canvas.width / canvas.height;
const camera = new THREE.OrthographicCamera(
  (-aspectRatio * frustum) >> 1, // Left
  (aspectRatio * frustum) >> 1, // Right
  frustum >> 1, // Top
  -frustum >> 1, // Bottom
  1, // Near
  1000 // Far
);

camera.position.set(...pos1, 100);

// Simulation parameters
let paused = false;
let steps = 1;
let dt = 1;
let G = 1;

dtInput.value = dt;
dtValue.textContent = dt;
stepsInput.value = steps;
stepsValue.textContent = steps;

const starfield = new Starfield(scene, 1000, 5);

let simulationId = 0;
const xmove = Math.random() * 2 - 1;
const ymove = Math.random() * 2 - 1;

function simulate(dt, steps = 1, G = 1) {
  for (let i = 0; i < (steps | 0); i++) {
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        bodies[i].applyGravity(bodies[j], G);
        bodies[j].applyGravity(bodies[i], G);
      }
    }

    bodies.forEach((body) => {
      body.updateVelocity(dt / steps);
      body.updatePosition(dt / steps);
    });
  }

  // camera.position.set(...bodies[1].state.position);

  starfield.update();

  renderer.render(scene, camera);
  simulationId = requestAnimationFrame(() => simulate(dt, steps, G));
}

document.addEventListener("DOMContentLoaded", () => {
  setupButtons();
  simulate(dt, steps, G);
});

function setupButtons() {
  const dtInput = $("#dtInput");
  const dtValue = $("#dtValue");
  const stepsInput = $("#stepsInput");
  const stepsValue = $("#stepsValue");
  const startButton = $("#resumeSimulation");
  const resetButton = $("#restartSimulation");

  dtInput.addEventListener("input", function () {
    dt = dtInput.value;
    dt = Math.pow(dt - 0.1, 2) * 1.18906;
    dtValue.textContent = dt.toFixed(2);
    cancelAnimationFrame(simulationId);
    simulate(dt, steps, G);
  });

  stepsInput.addEventListener("input", function () {
    steps = stepsInput.value;
    stepsValue.textContent = steps;
    cancelAnimationFrame(simulationId);
    simulate(dt, steps, G);
  });

  startButton.addEventListener("click", () => {
    if (paused) {
      paused = false;
      startButton.textContent = "Pause";
      simulate(dt, steps, G);
    } else {
      paused = true;
      startButton.textContent = "Resume";
      cancelAnimationFrame(simulationId);
    }
  });

  resetButton.addEventListener("click", () => {
    bodies.forEach((body) => {
      body.reset();
    });
    renderer.render(scene, camera);
    paused = true;
    startButton.textContent = "Resume";
    cancelAnimationFrame(simulationId);
  });
}

window.addEventListener("wheel", (event) => {
  if (event.deltaY > 0) {
    camera.zoom = Math.max(0.25, camera.zoom * 0.975);
  } else {
    camera.zoom = Math.min(3, camera.zoom * 1.025);
  }
  camera.updateProjectionMatrix();
});

window.addEventListener("resize", () => {
  aspectRatio = window.innerWidth / window.innerHeight;

  camera.left = -aspectRatio * frustum;
  camera.right = aspectRatio * frustum;
  camera.top = frustum;
  camera.bottom = -frustum;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
