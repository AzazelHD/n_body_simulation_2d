# N Body Problem (2D)

Interactive 2D N-Body gravitational simulation built with [Three.js](https://threejs.org/). Features multiple physics integrators, 13 preset scenarios (including choreographic orbits), real-time body editing, and a procedural starfield background.

![Three.js](https://img.shields.io/badge/Three.js-0.160.0-black?logo=three.js)

## Getting Started

No install step is required.

Open [index.html](index.html) directly in your browser, or run a simple local static server:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Features

### Simulation & Physics

- **Three integrators** — Euler, Velocity Verlet (default), RK4 — switchable via slider
- Fixed timestep (0.005) for numerical stability, up to 1500 steps/frame
- Adjustable speed multiplier (1–10×)
- Softening parameter to prevent close-encounter singularities
- Pause / Resume / Restart controls

### Camera

- **First Body** mode (follows body 1) or **Center of Mass** mode (tracks system barycenter)
- Smooth transitions between modes
- Orthographic projection

### Body Visualization

- Circular meshes sized by mass
- Configurable colors via hue slider
- 100-point trails with 0.35 opacity
- Debug velocity arrows (toggle with keyboard)

### Body Editor

- Expandable cards per body: position, velocity, mass, color
- Add / remove bodies dynamically (minimum 1)
- Reset to current scenario defaults
- Editor locks during simulation (color changes still allowed)

### Scenarios

13 curated presets accessible via dropdown:

| #   | Scenario                    | Description                                     |
| --- | --------------------------- | ----------------------------------------------- |
| 1   | Long-Lived Lagrange (L4/L5) | Massive primary + two Lagrange-point companions |
| 2   | Lagrange L4/L5 Triangle     | Three equal masses in equilateral triangle      |
| 3   | Pulsating Triangle          | Breathing oscillation of three equal masses     |
| 4   | Orbiting Planets            | Heavy star with two orbiting planets            |
| 5   | Central Giant System        | Massive center + three varied-orbit planets     |
| 6   | Figure-8 Orbit              | Classic three-body figure-8 choreography        |
| 7   | Butterfly I                 | Collinear periodic choreography                 |
| 8   | Butterfly II                | Second butterfly-family solution                |
| 9   | Bumblebee                   | Bumblebee-class periodic orbit                  |
| 10  | Moth I                      | Moth-family periodic solution                   |
| 11  | Dragonfly                   | Dragonfly-class periodic orbit                  |
| 12  | Binary System               | Two equal primaries + lighter third body        |
| 13  | Chaotic Dance               | Asymmetric chaotic configuration                |

### Starfield

- Procedurally generated 3×3 grid (~27 000 stars)
- Three size layers with subtle color tints
- Dynamic cell regeneration as camera moves

## Project Structure

```
index.html              Entry point — canvas + control sidebar
js/
  main.js               Scene setup, sim loop, camera, UI wiring
  celestialBody.js      Body physics, mesh lifecycle, integrators
  starfield.js          Procedural starfield, cell lifecycle
  bodyEditor.js         Body editor UI, validation, DOM listeners
  scenarios.js          13 preset configurations
  enums.js              ScenarioId, CameraMode, Integrator enums
  physicsConfig.js      G constant, orbit velocity helper
css/
  styles.css            Dark-theme UI styles
```

## Notes

- Three.js is imported directly from CDN in source files
- ES Modules throughout — no build-time bundling of Three.js
- This project is static and can be deployed directly to GitHub Pages
- No automated test suite; validate manually after behavior changes
