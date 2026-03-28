/**
 * Predefined N-Body scenarios
 * Each scenario defines initial conditions for bodies
 */

export const SCENARIOS = {
  lagrangeTriangle: {
    name: "Lagrange L4/L5 Triangle",
    description: "Very stable triangular configuration. All bodies have equal mass.",
    bodies: [
      { posX: 0, posY: 0, velX: 0.1, velY: 0, mass: 10, color: "#ffffff" },
      { posX: 200, posY: 0, velX: 0, velY: 0.1, mass: 10, color: "#ff4444" },
      { posX: 100, posY: 100 * Math.sqrt(3), velX: -0.05, velY: -0.05, mass: 10, color: "#44ffff" },
    ],
  },

  orbitingPlanets: {
    name: "Orbiting Planets",
    description: "Heavy central body with two light planets orbiting.",
    bodies: [
      { posX: 0, posY: 0, velX: 0, velY: 0, mass: 1000, color: "#ffffff" },
      { posX: 0, posY: -200, velX: -2, velY: 0, mass: 100, color: "#ff4444" },
      { posX: 0, posY: 200, velX: 2, velY: 0, mass: 100, color: "#44ffff" },
    ],
  },

  figure8: {
    name: "Figure-8 Orbit",
    description: "Three bodies in a figure-8 chaotic pattern. Unstable over long periods.",
    bodies: [
      {
        posX: 0.97000436,
        posY: -0.24308753,
        velX: 0.466203685,
        velY: 0.43236573,
        mass: 10,
        color: "#ffffff",
      },
      { posX: 0, posY: 0, velX: -0.93240737, velY: -0.86473146, mass: 10, color: "#ff4444" },
      {
        posX: -0.97000436,
        posY: 0.24308753,
        velX: 0.466203685,
        velY: 0.43236573,
        mass: 10,
        color: "#44ffff",
      },
    ],
  },

  binary: {
    name: "Binary System",
    description: "Two bodies orbiting each other with a third observer.",
    bodies: [
      { posX: -100, posY: 0, velX: 0, velY: -1, mass: 100, color: "#ffffff" },
      { posX: 100, posY: 0, velX: 0, velY: 1, mass: 100, color: "#ff4444" },
      { posX: 0, posY: 300, velX: 1.5, velY: 0, mass: 10, color: "#44ffff" },
    ],
  },

  chaotic: {
    name: "Chaotic Dance",
    description: "Random initial conditions for emergent chaos.",
    bodies: [
      { posX: 50, posY: 80, velX: -1.2, velY: 0.8, mass: 20, color: "#ff6b6b" },
      { posX: -100, posY: 120, velX: 0.5, velY: -1.5, mass: 15, color: "#ffd93d" },
      { posX: 30, posY: -150, velX: 0.7, velY: 0.7, mass: 25, color: "#6bcf7f" },
    ],
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
 * Get all scenario keys
 * @returns {string[]} Array of scenario keys
 */
export function getScenarioKeys() {
  return Object.keys(SCENARIOS);
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
