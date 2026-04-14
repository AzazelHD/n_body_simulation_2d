export const ScenarioId = Object.freeze({
  LONG_LIVED_LAGRANGE: "longLivedLagrange",
  LAGRANGE_TRIANGLE: "lagrangeTriangle",
  PULSATING_TRIANGLE: "pulsatingTriangle",
  ORBITING_PLANETS: "orbitingPlanets",
  CENTRAL_GIANT_SYSTEM: "centralGiantSystem",
  FIGURE_8: "figure8",
  BUTTERFLY_I: "butterflyI",
  BUTTERFLY_II: "butterflyII",
  BUMBLEBEE: "bumblebee",
  MOTH_I: "mothI",
  DRAGONFLY: "dragonfly",
  BINARY: "binary",
  CHAOTIC: "chaotic",
});

export const CameraMode = Object.freeze({
  FIRST_BODY: "firstBody",
  CENTER_OF_MASS: "centerOfMass",
});

export const Integrator = Object.freeze({
  EULER: 1,
  VERLET: 2,
  RK4: 3,
});
