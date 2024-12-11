import * as THREE from "three";

export class CelestialBody {
  constructor(pos, vel, mass, color, scene) {
    this.mass = mass;
    this.position = pos;
    this.velocity = vel;
    this.acceleration = new THREE.Vector2();
    this.color = color;

    const geometry = new THREE.CircleGeometry(Math.sqrt(this.mass), 32);
    const material = new THREE.MeshBasicMaterial({ color: this.color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(this.position.x, this.position.y);
    scene.add(this.mesh);
  }

  applyGravity(other, G = 6.6743e-11) {
    const r = other.position.clone().sub(this.position);
    const distanceSq = r.lengthSq();
    const force = (G * this.mass * other.mass) / distanceSq;

    const direction = r.normalize();
    this.acceleration = direction.multiplyScalar(force / this.mass);
  }

  updateVelocity(dt = 1) {
    this.velocity.add(this.acceleration.clone().multiplyScalar(dt));
  }

  updatePosition(dt = 1) {
    this.position.add(this.velocity.clone().multiplyScalar(dt));
    this.mesh.position.set(this.position.x, this.position.y, 0);
  }

  draw() {
    this.mesh.position.set(this.position.x, this.position.y, 0);
  }
}
