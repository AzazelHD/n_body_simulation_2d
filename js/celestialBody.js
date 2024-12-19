import * as THREE from "three";

export class CelestialBody {
  #scene;
  #geometry;
  #material;
  #mesh;

  constructor(initialPos, initialVel, mass, color, scene) {
    this.initialState = {
      position: initialPos.clone(),
      velocity: initialVel.clone(),
      mass,
      color,
    };

    this.state = {
      position: initialPos.clone(),
      velocity: initialVel.clone(),
      acceleration: new THREE.Vector2(0, 0),
    };

    this.#geometry = new THREE.CircleGeometry(2 * Math.sqrt(mass), 32);
    this.#material = new THREE.MeshBasicMaterial({ color });
    this.#mesh = new THREE.Mesh(this.#geometry, this.#material);

    this.#scene = scene;
    this.updateMeshPosition();
    this.#scene.add(this.#mesh);
  }

  applyGravity(other, G = 6.6743e-11) {
    const r = other.state.position.clone().sub(this.state.position);
    const distanceSq = r.lengthSq();
    const force = (G * this.initialState.mass * other.initialState.mass) / distanceSq;
    this.state.acceleration.add(r.normalize().multiplyScalar(force / this.initialState.mass));
  }

  updateVelocity(dt = 1) {
    this.state.velocity.add(this.state.acceleration.clone().multiplyScalar(dt));
    this.state.acceleration.set(0, 0);
  }

  updatePosition(dt = 1) {
    this.state.position.add(this.state.velocity.clone().multiplyScalar(dt));
    this.updateMeshPosition();
  }

  updateMeshPosition() {
    this.#mesh.position.set(...this.state.position);
  }

  reset() {
    this.state.position.copy(this.initialState.position);
    this.state.velocity.copy(this.initialState.velocity);
    this.state.acceleration.set(0, 0);

    this.updateMeshPosition();
  }

  dispose() {
    this.#scene.remove(this.#mesh);
    this.#geometry.dispose();
    this.#material.dispose();
  }
}
