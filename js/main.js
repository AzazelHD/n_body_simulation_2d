import * as THREE from "three";
import { CelestialBody } from "./celestialBody.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const canvas = $("#canvas");

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Simulation parameters
const aspectRatio = canvas.width / canvas.height;
const camera = new THREE.OrthographicCamera(
  -aspectRatio * 500,
  aspectRatio * 500,
  500,
  -500,
  1,
  1000
);
camera.position.z = 10;

const pos1 = new THREE.Vector2(0, 0);
const pos2 = new THREE.Vector2(0, -200);
const pos3 = new THREE.Vector2(0, 200);

const vel1 = new THREE.Vector2(0, 0);
const vel2 = new THREE.Vector2(-5, 0);
const vel3 = new THREE.Vector2(2, 0);

const bodies = [
  new CelestialBody(pos1, vel1, 4000, "white", scene),
  new CelestialBody(pos2, vel2, 100, "red", scene),
  // new CelestialBody(pos3, vel3, 500, "teal", scene),
];

let steps = 10;
let dt = 1;
let G = 1;

function simulate(dt, G = 1) {
  // Apply gravitational forces
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      bodies[i].applyGravity(bodies[j], 0);
      bodies[j].applyGravity(bodies[i], G);
    }
  }

  // Update and draw bodies
  bodies.forEach((body) => {
    body.updateVelocity(dt);
    body.updatePosition(dt);
    body.draw();
  });

  renderer.render(scene, camera);
  // requestAnimationFrame(() => simulate(dt, G));
}

document.body.onkeydown = function (e) {
  if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
    simulate(dt, G);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  for (let i = 0; i < steps; i++) {
    // simulate(1 / steps, G);
  }
});
