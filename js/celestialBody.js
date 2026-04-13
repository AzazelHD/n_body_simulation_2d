import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

export class CelestialBody {
  static SOFTENING = 0.01;
  static CIRCLE_SEGMENTS = 32;

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

    this.#scene = scene;
    this.#createMesh(mass, color);
    this.#updateMeshPosition();
    this.#scene.add(this.#mesh);
  }

  #createMesh(mass, color) {
    const radius = 2 * Math.sqrt(mass);
    this.#geometry = new THREE.CircleGeometry(radius, CelestialBody.CIRCLE_SEGMENTS);
    this.#material = new THREE.MeshBasicMaterial({ color, transparent: false, opacity: 1 });
    this.#mesh = new THREE.Mesh(this.#geometry, this.#material);
  }

  #updateMeshPosition() {
    this.#mesh.position.set(this.state.position.x, this.state.position.y, 0);
  }

  #calculateGravitationalForce(myPos, otherPos, otherMass, G) {
    const r = otherPos.clone().sub(myPos);
    const distanceSq = Math.max(r.lengthSq(), CelestialBody.SOFTENING);
    const forceMag = (G * this.initialState.mass * otherMass) / distanceSq;
    return r.normalize().multiplyScalar(forceMag / this.initialState.mass);
  }

  applyGravity(other, G) {
    const force = this.#calculateGravitationalForce(
      this.state.position,
      other.state.position,
      other.initialState.mass,
      G,
    );
    this.state.acceleration.add(force);
  }

  // INTEGRATOR 1: Euler (Fast, Inaccurate)
  updateEuler(dt) {
    this.state.velocity.add(this.state.acceleration.clone().multiplyScalar(dt));
    this.state.position.add(this.state.velocity.clone().multiplyScalar(dt));
    this.#updateMeshPosition();
  }

  // INTEGRATOR 2: Velocity Verlet (Balanced) - Part 1
  updateVerlet(dt, allBodies, G, bodiesOldState) {
    const oldAcceleration = this.#calculateAccelerationFromState(allBodies, bodiesOldState, G);

    // x(t+dt) = x(t) + v(t)*dt + 0.5*a(t)*dt²
    this.state.position.add(
      this.state.velocity
        .clone()
        .multiplyScalar(dt)
        .add(oldAcceleration.clone().multiplyScalar(0.5 * dt * dt)),
    );

    this.#updateMeshPosition();
    return oldAcceleration;
  }

  // INTEGRATOR 2: Velocity Verlet - Part 2
  updateVerletVelocity(dt, oldAcceleration, newAcceleration) {
    // v(t+dt) = v(t) + 0.5*(a(t) + a(t+dt))*dt
    this.state.velocity.add(oldAcceleration.add(newAcceleration).multiplyScalar(0.5 * dt));
  }

  // INTEGRATOR 3: RK4 (Most Accurate)
  updateRK4(dt, allBodies, G, bodiesOldState) {
    const { position: initialPos, velocity: initialVel } = bodiesOldState.get(this);

    // Calculate k1, k2, k3, k4
    const k1 = this.#calculateRK4Step(allBodies, bodiesOldState, G, initialVel, null, null, dt);
    const k2 = this.#calculateRK4Step(
      allBodies,
      bodiesOldState,
      G,
      initialVel,
      k1.p,
      k1.v,
      dt,
      0.5,
    );
    const k3 = this.#calculateRK4Step(
      allBodies,
      bodiesOldState,
      G,
      initialVel,
      k2.p,
      k2.v,
      dt,
      0.5,
    );
    const k4 = this.#calculateRK4Step(
      allBodies,
      bodiesOldState,
      G,
      initialVel,
      k3.p,
      k3.v,
      dt,
      1.0,
    );

    // Weighted average: (k1 + 2*k2 + 2*k3 + k4) / 6
    this.state.position.copy(initialPos).add(
      k1.p
        .add(k2.p.multiplyScalar(2))
        .add(k3.p.multiplyScalar(2))
        .add(k4.p)
        .multiplyScalar(1 / 6),
    );
    this.state.velocity.copy(initialVel).add(
      k1.v
        .add(k2.v.multiplyScalar(2))
        .add(k3.v.multiplyScalar(2))
        .add(k4.v)
        .multiplyScalar(1 / 6),
    );

    this.#updateMeshPosition();
  }

  #calculateRK4Step(allBodies, oldState, G, initialVel, deltaP, deltaV, dt, factor = null) {
    const tempState =
      factor !== null
        ? this.#createTempState(oldState, allBodies, deltaP, deltaV, factor)
        : oldState;

    const acceleration = this.#calculateAccelerationFromState(allBodies, tempState, G);
    const velocity =
      factor !== null
        ? initialVel.clone().add(deltaV.clone().multiplyScalar(factor))
        : initialVel.clone();

    return {
      v: acceleration.multiplyScalar(dt),
      p: velocity.multiplyScalar(dt),
    };
  }

  #createTempState(oldState, allBodies, deltaP, deltaV, factor) {
    const tempState = new Map();

    allBodies.forEach((body) => {
      const oldBodyState = oldState.get(body);

      if (body === this) {
        tempState.set(body, {
          position: oldBodyState.position.clone().add(deltaP.clone().multiplyScalar(factor)),
          velocity: oldBodyState.velocity.clone().add(deltaV.clone().multiplyScalar(factor)),
        });
      } else {
        tempState.set(body, {
          position: oldBodyState.position.clone(),
          velocity: oldBodyState.velocity.clone(),
        });
      }
    });

    return tempState;
  }

  #calculateAccelerationFromState(allBodies, bodiesState, G) {
    const acceleration = new THREE.Vector2(0, 0);
    const myPos = bodiesState.get(this).position;

    allBodies.forEach((other) => {
      if (other !== this) {
        const otherPos = bodiesState.get(other).position;
        const force = this.#calculateGravitationalForce(
          myPos,
          otherPos,
          other.initialState.mass,
          G,
        );
        acceleration.add(force);
      }
    });

    return acceleration;
  }

  // Public wrapper for external use (needed by main.js for Verlet)
  calculateAccelerationFromState(allBodies, bodiesState, G) {
    return this.#calculateAccelerationFromState(allBodies, bodiesState, G);
  }

  setColor(color) {
    this.initialState.color = color;
    this.#material.color.set(color);
  }

  reset() {
    this.state.position.copy(this.initialState.position);
    this.state.velocity.copy(this.initialState.velocity);
    this.state.acceleration.set(0, 0);
    this.#updateMeshPosition();
  }

  dispose() {
    this.#scene.remove(this.#mesh);
    this.#geometry.dispose();
    this.#material.dispose();
  }
}
