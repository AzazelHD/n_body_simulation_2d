import * as THREE from "three";
import { CelestialBody } from "./celestialBody.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const canvas = $("#canvas");

const pos1 = new THREE.Vector2(0, 0);
const pos2 = new THREE.Vector2(0, -200);
const pos3 = new THREE.Vector2(0, 200);

const vel1 = new THREE.Vector2(0, 0);
const vel2 = new THREE.Vector2(-5, 0);
const vel3 = new THREE.Vector2(5, 0);

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Celestial Bodies initialization
const bodies = [
  new CelestialBody(pos1, vel1, 4000, "white", scene),
  new CelestialBody(pos2, vel2, 100, "red", scene),
  new CelestialBody(pos3, vel3, 100, "teal", scene),
];

let zoom = 1;

// Camera setup
const aspectRatio = canvas.width / canvas.height;
const camera = new THREE.OrthographicCamera(
  (-aspectRatio * 500) / zoom, // Left
  (aspectRatio * 500) / zoom, // Right
  500 / zoom, // Top
  -500 / zoom, // Bottom
  1, // Near
  1000 // Far
);

camera.position.set(...pos1, 100);

const dtInput = $("#dtInput");
const dtValue = $("#dtValue");
const stepsInput = $("#stepsInput");
const stepsValue = $("#stepsValue");

// Simulation parameters
let steps = 1;
let dt = 0.1;
let G = 1;

dtInput.value = dt;
dtValue.textContent = dt;
stepsInput.value = steps;
stepsValue.textContent = steps;

dtInput.addEventListener("input", function () {
  dt = dtInput.value;
  dtValue.textContent = dt;
  cancelAnimationFrame(simulationId);
  simulate(dt, steps, G);
});

stepsInput.addEventListener("input", function () {
  steps = stepsInput.value;
  stepsValue.textContent = steps;
  cancelAnimationFrame(simulationId);
  simulate(dt, steps, G);
});

let simulationId;
function simulate(dt, steps = 1, G = 1) {
  for (let i = 0; i < steps; i++) {
    // Apply gravitational forces
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        bodies[i].applyGravity(bodies[j], G);
        bodies[j].applyGravity(bodies[i], G);
      }
    }

    // Update and draw bodies
    bodies.forEach((body) => {
      body.updateVelocity(dt / steps);
      body.updatePosition(dt / steps);
    });
  }

  camera.position.set(...bodies[0].position, 100);

  renderer.render(scene, camera);
  simulationId = requestAnimationFrame(() => simulate(dt, steps, G));
}

document.body.onkeydown = function (e) {
  if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
    simulate(dt, steps, G);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  simulate(dt, steps, G);
});
