export const PHYSICS_CONFIG = {
  gravitationalConstant: 1,
};

export function getCircularOrbitVelocity(centralMass, radius) {
  return Math.sqrt((PHYSICS_CONFIG.gravitationalConstant * centralMass) / radius);
}
