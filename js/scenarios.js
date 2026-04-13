/**
 * Predefined N-Body scenarios
 * Each scenario defines initial conditions for bodies
 */

import { getCircularOrbitVelocity } from "./physicsConfig.js";

const TRIANGLE_SIDE_LENGTH = 200;
const CHOREOGRAPHY_POSITION_SCALE = 120;

function scaleNormalizedScenarioBodies(bodies, options = {}) {
  const { positionScale = CHOREOGRAPHY_POSITION_SCALE, mass = 10 } = options;
  const velocityScale = Math.sqrt(mass / positionScale);

  return bodies.map((body) => ({
    posX: body.posX * positionScale,
    posY: body.posY * positionScale,
    velX: body.velX * velocityScale,
    velY: body.velY * velocityScale,
    mass,
    color: body.color,
  }));
}

function createBinarySystemBodies() {
  const primaryMass = 120;
  const observerMass = 6;
  const binaryRadius = 120;
  const observerRadius = 360;

  const binarySpeed = Math.sqrt(primaryMass / (4 * binaryRadius));
  const observerSpeed = getCircularOrbitVelocity(primaryMass * 2, observerRadius);
  const observerMomentum = observerMass * observerSpeed;
  const primaryVelocityOffset = observerMomentum / (primaryMass * 2);

  return [
    {
      posX: -binaryRadius,
      posY: 0,
      velX: 0,
      velY: -binarySpeed - primaryVelocityOffset,
      mass: primaryMass,
      color: "#ffffff",
    },
    {
      posX: binaryRadius,
      posY: 0,
      velX: 0,
      velY: binarySpeed - primaryVelocityOffset,
      mass: primaryMass,
      color: "#ff4444",
    },
    {
      posX: 0,
      posY: observerRadius,
      velX: observerSpeed,
      velY: 0,
      mass: observerMass,
      color: "#44ffff",
    },
  ];
}

function createChaoticDanceBodies() {
  const masses = [18, 14, 22];
  const positions = [
    { x: -180, y: -30 },
    { x: 140, y: 90 },
    { x: 20, y: -170 },
  ];
  const velocities = [
    { x: 0.6, y: 0.85 },
    { x: -1.1, y: 0.35 },
  ];

  const thirdVelocity = {
    x: -(masses[0] * velocities[0].x + masses[1] * velocities[1].x) / masses[2],
    y: -(masses[0] * velocities[0].y + masses[1] * velocities[1].y) / masses[2],
  };

  return [
    {
      posX: positions[0].x,
      posY: positions[0].y,
      velX: velocities[0].x,
      velY: velocities[0].y,
      mass: masses[0],
      color: "#ff6b6b",
    },
    {
      posX: positions[1].x,
      posY: positions[1].y,
      velX: velocities[1].x,
      velY: velocities[1].y,
      mass: masses[1],
      color: "#ffd93d",
    },
    {
      posX: positions[2].x,
      posY: positions[2].y,
      velX: thirdVelocity.x,
      velY: thirdVelocity.y,
      mass: masses[2],
      color: "#6bcf7f",
    },
  ];
}

function createIsoscelesCollinearChoreography(vx, vy, options = {}) {
  const {
    positionScale = CHOREOGRAPHY_POSITION_SCALE,
    mass = 10,
    colors = ["#ffffff", "#ff4444", "#44ffff"],
  } = options;

  // Many cataloged equal-mass periodic solutions use x = (-1, 0), (1, 0), (0, 0)
  // and v1 = v2 = (vx, vy), v3 = (-2vx, -2vy). We scale positions/velocities
  // for this simulator while preserving the symmetric setup.
  const velocityScale = Math.sqrt(mass / positionScale);

  return [
    {
      posX: -positionScale,
      posY: 0,
      velX: vx * velocityScale,
      velY: vy * velocityScale,
      mass,
      color: colors[0],
    },
    {
      posX: positionScale,
      posY: 0,
      velX: vx * velocityScale,
      velY: vy * velocityScale,
      mass,
      color: colors[1],
    },
    {
      posX: 0,
      posY: 0,
      velX: -2 * vx * velocityScale,
      velY: -2 * vy * velocityScale,
      mass,
      color: colors[2],
    },
  ];
}

export const SCENARIOS = {
  longLivedLagrange: {
    name: "Long-Lived Lagrange (L4/L5)",
    description:
      "Dominant primary with two light companions in near-L4/L5-like orbits for long-lived stability.",
    bodies: (() => {
      const primaryMass = 2000;
      const companionMassA = 1;
      const companionMassB = 1;
      const orbitRadius = 260;

      // Companion A at +60 deg, Companion B at -60 deg around the primary.
      const angleA = Math.PI / 3;
      const angleB = -Math.PI / 3;

      const posA = {
        x: orbitRadius * Math.cos(angleA),
        y: orbitRadius * Math.sin(angleA),
      };
      const posB = {
        x: orbitRadius * Math.cos(angleB),
        y: orbitRadius * Math.sin(angleB),
      };

      // Tangential circular speed around dominant primary.
      const v = getCircularOrbitVelocity(primaryMass, orbitRadius);

      // CCW tangential unit vectors: (-sin(theta), cos(theta)).
      const velA = {
        x: -Math.sin(angleA) * v,
        y: Math.cos(angleA) * v,
      };
      const velB = {
        x: -Math.sin(angleB) * v,
        y: Math.cos(angleB) * v,
      };

      // Set primary position/velocity to make COM and total momentum exactly zero.
      const primaryPos = {
        x: -(companionMassA * posA.x + companionMassB * posB.x) / primaryMass,
        y: -(companionMassA * posA.y + companionMassB * posB.y) / primaryMass,
      };
      const primaryVel = {
        x: -(companionMassA * velA.x + companionMassB * velB.x) / primaryMass,
        y: -(companionMassA * velA.y + companionMassB * velB.y) / primaryMass,
      };

      return [
        {
          posX: primaryPos.x,
          posY: primaryPos.y,
          velX: primaryVel.x,
          velY: primaryVel.y,
          mass: primaryMass,
          color: "#fff4cc",
        },
        {
          posX: posA.x,
          posY: posA.y,
          velX: velA.x,
          velY: velA.y,
          mass: companionMassA,
          color: "#ff7f50",
        },
        {
          posX: posB.x,
          posY: posB.y,
          velX: velB.x,
          velY: velB.y,
          mass: companionMassB,
          color: "#66d9ef",
        },
      ];
    })(),
  },

  lagrangeTriangle: {
    name: "Lagrange L4/L5 Triangle",
    description: "Very stable triangular configuration. All bodies have equal mass.",
    bodies: (() => {
      const bodyMass = 10;

      // Derived orbital velocity for stable equilateral triangle: v = sqrt(G*m/a)
      const v = getCircularOrbitVelocity(bodyMass, TRIANGLE_SIDE_LENGTH);
      const vx = v / 2;
      const vy = (v * Math.sqrt(3)) / 2;

      return [
        {
          posX: 0,
          posY: 0,
          velX: vx,
          velY: -vy,
          mass: bodyMass,
          color: "#ffffff",
        },
        {
          posX: TRIANGLE_SIDE_LENGTH,
          posY: 0,
          velX: vx,
          velY: vy,
          mass: bodyMass,
          color: "#ff4444",
        },
        {
          posX: TRIANGLE_SIDE_LENGTH / 2,
          posY: (TRIANGLE_SIDE_LENGTH / 2) * Math.sqrt(3),
          velX: -2 * vx,
          velY: 0,
          mass: bodyMass,
          color: "#44ffff",
        },
      ];
    })(),
  },

  pulsatingTriangle: {
    name: "Pulsating Triangle",
    description:
      "Three equal bodies oscillating in and out, forming a breathing equilateral triangle.",
    bodies: (() => {
      const bodyMass = 10; // Equal mass for all 3 bodies.

      // Circular speed for this mass and side length.
      const vCircular = getCircularOrbitVelocity(bodyMass, TRIANGLE_SIDE_LENGTH);
      // Fraction of circular speed: lower => deeper inward collapse.
      const v = vCircular * 0.49;
      // Velocity components for symmetric 120-degree tangential motion.
      const vx = v / 2;
      const vy = (v * Math.sqrt(3)) / 2;

      return [
        {
          posX: 0,
          posY: 0,
          velX: vx,
          velY: -vy,
          mass: bodyMass,
          color: "#ffffff",
        },
        {
          posX: TRIANGLE_SIDE_LENGTH,
          posY: 0,
          velX: vx,
          velY: vy,
          mass: bodyMass,
          color: "#ff4444",
        },
        {
          posX: TRIANGLE_SIDE_LENGTH / 2,
          posY: (TRIANGLE_SIDE_LENGTH / 2) * Math.sqrt(3),
          velX: -2 * vx,
          velY: 0,
          mass: bodyMass,
          color: "#44ffff",
        },
      ];
    })(),
  },

  orbitingPlanets: {
    name: "Orbiting Planets",
    description: "Heavy central body with two light planets orbiting.",
    bodies: (() => {
      const centralMass = 1000;
      const planetMass = 100;

      return [
        {
          posX: 0,
          posY: 0,
          velX: 0,
          velY: 0,
          mass: centralMass,
          color: "#ffffff",
        },
        {
          posX: 0,
          posY: -200,
          velX: -2,
          velY: 0,
          mass: planetMass,
          color: "#ff4444",
        },
        {
          posX: 0,
          posY: 200,
          velX: 2,
          velY: 0,
          mass: planetMass,
          color: "#44ffff",
        },
      ];
    })(),
  },

  centralGiantSystem: {
    name: "Central Giant System",
    description: "A massive center body with lighter planets in near-circular stable orbits.",
    bodies: (() => {
      const centralMass = 700;
      const planetMass = 4;

      const r1 = 170;
      const r2 = 250;
      const r3 = 340;

      const v1 = getCircularOrbitVelocity(centralMass, r1);
      const v2 = getCircularOrbitVelocity(centralMass, r2);
      const v3 = getCircularOrbitVelocity(centralMass, r3);

      return [
        { posX: 0, posY: 0, velX: 0, velY: 0, mass: centralMass, color: "#fff4cc" },
        { posX: r1, posY: 0, velX: 0, velY: v1, mass: planetMass, color: "#ff7f50" },
        { posX: 0, posY: r2, velX: -v2, velY: 0, mass: planetMass, color: "#66d9ef" },
        { posX: -r3, posY: 0, velX: 0, velY: -v3, mass: planetMass, color: "#a6e22e" },
      ];
    })(),
  },

  figure8: {
    name: "Figure-8 Orbit",
    description:
      "Three equal masses tracing the classic figure-8 choreography in the center-of-mass frame.",
    cameraMode: "centerOfMass",
    bodies: scaleNormalizedScenarioBodies([
      {
        posX: 0.97000436,
        posY: -0.24308753,
        velX: 0.466203685,
        velY: 0.43236573,
        color: "#ffffff",
      },
      {
        posX: 0,
        posY: 0,
        velX: -0.93240737,
        velY: -0.86473146,
        color: "#ff4444",
      },
      {
        posX: -0.97000436,
        posY: 0.24308753,
        velX: 0.466203685,
        velY: 0.43236573,
        color: "#44ffff",
      },
    ]),
  },

  butterflyI: {
    name: "Butterfly I (Choreography)",
    description:
      "Popular equal-mass periodic choreography from the three-body literature (isosceles-collinear form).",
    cameraMode: "centerOfMass",
    bodies: createIsoscelesCollinearChoreography(0.30689, 0.12551),
  },

  butterflyII: {
    name: "Butterfly II (Choreography)",
    description:
      "A second butterfly-family periodic choreography using symmetric collinear initial positions.",
    cameraMode: "centerOfMass",
    bodies: createIsoscelesCollinearChoreography(0.39295, 0.09758),
  },

  bumblebee: {
    name: "Bumblebee (Choreography)",
    description:
      "Bumblebee-class equal-mass periodic choreography; symmetric initial state with zero net momentum.",
    cameraMode: "centerOfMass",
    bodies: createIsoscelesCollinearChoreography(0.18428, 0.58719),
  },

  mothI: {
    name: "Moth I (Choreography)",
    description:
      "Moth-family periodic orbit with equal masses and standard symmetric collinear setup.",
    cameraMode: "centerOfMass",
    bodies: createIsoscelesCollinearChoreography(0.46444, 0.39606),
  },

  dragonfly: {
    name: "Dragonfly (Choreography)",
    description:
      "Dragonfly-family periodic choreography from the equal-mass zero-angular-momentum catalog.",
    cameraMode: "centerOfMass",
    bodies: createIsoscelesCollinearChoreography(0.08058, 0.58884),
  },

  binary: {
    name: "Binary System",
    description:
      "Two equal primaries orbiting their barycenter with a lighter third body farther out.",
    cameraMode: "centerOfMass",
    bodies: createBinarySystemBodies(),
  },

  chaotic: {
    name: "Chaotic Dance",
    description:
      "A balanced three-body setup with enough asymmetry to stay chaotic without immediately flying apart.",
    cameraMode: "centerOfMass",
    bodies: createChaoticDanceBodies(),
  },
};

/**
 * Get scenario by key
 * @param {string} key - Scenario identifier
 * @returns {Object|null} Scenario object or null if not found
 */
export function getScenario(key) {
  return SCENARIOS[key] || null;
}

/**
 * Deep clone a scenario's body configuration
 * @param {string} key - Scenario identifier
 * @returns {Array} Cloned bodies array or empty array if not found
 */
export function cloneScenarioBodies(key) {
  const scenario = getScenario(key);
  if (!scenario) return [];
  return scenario.bodies.map((body) => ({ ...body }));
}
