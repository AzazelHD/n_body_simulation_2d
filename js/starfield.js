import * as THREE from "three";

export class Starfield {
  #scene;
  #geometry;
  #material;
  #points;

  constructor(stars, size, boundary, scene) {
    this.stars = stars;
    this.size = size;
    this.initialBoundary = boundary;
    this.boundary = boundary;
    this.#scene = scene;
    this.#createStarfield();
    console.log("SF", this.boundary);
  }

  #createStarfield() {
    this.#geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.stars * 3);

    for (let i = 0; i < positions.length; i++) {
      positions[3 * i] = (Math.random() - 0.5) * this.boundary;
      positions[3 * i + 1] = (Math.random() - 0.5) * this.boundary;
      positions[3 * i + 2] = -10;
    }

    this.#geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    this.#material = new THREE.PointsMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      size: this.size,
    });

    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#scene.add(this.#points);
  }

  animate(offsetX, offsetY, speed) {
    const positions = this.#geometry.getAttribute("position").array;
    for (let i = 0; i < this.stars; i++) {
      positions[3 * i] += offsetX * speed;
      positions[3 * i + 1] += offsetY * speed;

      // Wrap around dynamically calculated boundary
      if (positions[3 * i] > this.boundary >> 1) positions[3 * i] -= this.boundary;
      if (positions[3 * i] < -this.boundary >> 1) positions[3 * i] += this.boundary;
      if (positions[3 * i + 1] > this.boundary >> 1) positions[3 * i + 1] -= this.boundary;
      if (positions[3 * i + 1] < -this.boundary >> 1) positions[3 * i + 1] += this.boundary;
    }

    this.#geometry.attributes.position.needsUpdate = true;
  }

  dispose() {
    this.#scene.remove(this.#points);
    this.#geometry.dispose();
    this.#material.dispose();
  }
}
