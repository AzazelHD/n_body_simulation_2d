import * as THREE from "three";
import { CelestialBody } from "./celestialBody.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const canvas = $("#canvas");

// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;

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

const dt = 0.5;
const G = 10;

// const cx = canvas.width / 2;
// const cy = canvas.height / 2;

const pos1 = new THREE.Vector2(0, 0);
const pos2 = new THREE.Vector2(0, 400);
const pos3 = new THREE.Vector2(0, 200);

const vel1 = new THREE.Vector2(0, 0);
const vel2 = new THREE.Vector2(-1, 0);
const vel3 = new THREE.Vector2(2, 0);

const bodies = [
  new CelestialBody(pos1, vel1, 100, "white", scene),
  // new CelestialBody(pos2, vel2, 200, "red", scene),
  // new CelestialBody(pos3, vel3, 500, "teal", scene),
];

function simulate(dt) {
  // // Debug: Log positions and velocities before update
  // console.log("Before update:");
  // bodies.forEach((body, index) => {
  //   console.log(
  //     `Body ${index}:`,
  //     `Pos: (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)})`,
  //     `Vel: (${body.velocity.x.toFixed(2)}, ${body.velocity.y.toFixed(2)})`,
  //     `Acc: (${body.acceleration.x.toFixed(2)}, ${body.acceleration.y.toFixed(2)})`
  //   );
  // });

  // Apply gravitational forces
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      bodies[i].applyGravity(bodies[j], G);
      bodies[j].applyGravity(bodies[i], G);
    }
  }

  // Update and draw bodies
  bodies.forEach((body) => {
    body.updateVelocity(dt);
    body.updatePosition(dt);
    body.draw();
  });

  // // Debug: Log positions and velocities after update
  // console.log("After update:");
  // bodies.forEach((body, index) => {
  //   console.log(
  //     `Body ${index}:`,
  //     `Pos: (${body.position.x.toFixed(2)}, ${body.position.y.toFixed(2)})`,
  //     `Vel: (${body.velocity.x.toFixed(2)}, ${body.velocity.y.toFixed(2)})`,
  //     `Acc: (${body.acceleration.x.toFixed(2)}, ${body.acceleration.y.toFixed(2)})`
  //   );
  // });

  renderer.render(scene, camera);
  requestAnimationFrame(() => simulate(dt));
}

document.body.onkeydown = function (e) {
  if (e.key == " " || e.code == "Space" || e.keyCode == 32) {
    simulate(dt);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  simulate(dt);
});
