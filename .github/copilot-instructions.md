# Project Guidelines

## Code Style

- Use ES modules with explicit named imports/exports, matching files in `js/`.
- Keep naming in `camelCase` and preserve existing concise helpers like `const $ = (...) => ...` in `js/main.js`.
- Prefer small, focused functions and avoid introducing heavy abstractions for simple UI or simulation logic.
- Add comments only for non-obvious behavior (state transitions, physics assumptions, rendering constraints).

## Architecture

- Entry point is `index.html`, which loads `js/main.js`.
- `js/main.js` orchestrates scene setup, simulation loop, body lifecycle, camera control, and UI wiring.
- `js/celestialBody.js` owns body physics and mesh lifecycle.
- `js/starfield.js` owns procedural star background and grid-cell lifecycle.
- `js/bodyEditor.js` owns body editor UI rendering, validation, and DOM listeners.
- `js/scenarios.js` provides scenario presets and cloning helpers.

## Build And Test

- Install dependencies: `pnpm install`
- Run local dev server: `pnpm dev`
- No automated test suite is currently configured. For behavior changes, manually validate simulation controls, scenario switching, body editing, and rendering.

## Conventions

- Body configs are plain objects with shape `{ posX, posY, velX, velY, mass, color }`.
- Preserve the active/pending configuration flow in `js/main.js`:
  - `activeBodiesConfig`: currently applied scenario
  - `pendingBodiesConfig`: editable UI state not yet applied
- Use existing pause/resume and input-disable behavior when changing editor or simulation interactions.
- Keep Three.js import sources consistent: runtime imports use CDN module URLs in source files, while `package.json` tracks dependency versions.

## Docs

- Project setup and quick start: `README.md`
- Body editor behavior and UX rules: `BODY_EDITOR_GUIDE.md`
- Implementation verification checklist: `IMPLEMENTATION_VERIFICATION.txt`
