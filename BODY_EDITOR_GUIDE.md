# Body Configuration System Guide

## Overview
The Body Configuration panel allows you to customize the initial conditions of your N-body simulation. You can load predefined scenarios, add/remove bodies, and adjust each body's properties before running the simulation.

## Features

### 1. Load a Predefined Scenario
The **Load Preset** dropdown contains 5 ready-made configurations:
- **Lagrange L4/L5 Triangle** - Very stable triangular configuration with equal masses
- **Orbiting Planets** - Heavy central body with two light planets orbiting
- **Figure-8 Orbit** - Three bodies in a chaotic figure-8 pattern
- **Binary System** - Two equal bodies orbiting each other with a third observer
- **Chaotic Dance** - Random initial conditions for emergent chaos

**How to use:**
1. Select a scenario from the dropdown
2. The body cards will update to show that scenario's configuration
3. Click "Apply Changes" to load the scenario into the simulation

### 2. Add a New Body
Click the **+ Add Body** button to add a new body to your configuration.
- The new body starts at position (0, 0) with zero velocity and mass 10
- Edit its properties and then click "Apply Changes"
- You can add up to 10 bodies (limit can be increased if needed)

### 3. Remove a Body
Each body card has a **Remove Body** button (at the bottom, in red).
- Click to remove that body from the configuration
- You cannot remove the last body (the button will be disabled)
- Changes take effect when you click "Apply Changes"

### 4. Edit Body Properties
Each body card has editable fields for:
- **Position X** - Horizontal position (in simulation units)
- **Position Y** - Vertical position (in simulation units)
- **Velocity X** - Horizontal velocity component
- **Velocity Y** - Vertical velocity component
- **Mass** - Body's mass (must be > 0)
- **Color** - Visual color of the body (click color picker to choose)

**Important:**
- Changes are shown immediately in the body cards
- The simulation continues with the OLD configuration until you click "Apply Changes"
- This allows you to preview your changes before committing

### 5. Apply Changes
Click **Apply Changes** to load your configuration into the simulation:
1. The system validates all bodies have mass > 0
2. The simulation pauses
3. All old bodies are destroyed
4. New bodies are created with your configuration
5. The scene re-renders to show the new setup
6. Click "Resume" to start the simulation

### 6. Reset to Scenario
Click **Reset to Scenario** to undo all your pending edits:
- Returns all body cards to the last "Apply Changes" configuration
- Useful if you make mistakes and want to start over
- Does NOT reset the simulation, just the body editor UI

## Input Lock During Simulation
When the simulation is **running** (paused button shows "Pause"):
- All body property fields are **disabled** (greyed out)
- You cannot edit bodies while the simulation runs
- This prevents numerical instability

To edit bodies while a simulation is running:
1. Click "Pause" to pause the simulation
2. Body property fields become enabled
3. Make your edits
4. Click "Apply Changes" to load the new configuration

## Workflow Examples

### Example 1: Run Orbiting Planets
1. Simulation starts with Lagrange Triangle (default)
2. Open the Bodies Configuration panel
3. Select "Orbiting Planets" from dropdown
4. See 3 bodies with different masses appear in cards
5. Click "Apply Changes"
6. Simulation pauses, destroys triangles, creates planets
7. Click "Resume" to see heavy central body with 2 planets orbiting

### Example 2: Create Custom Configuration
1. Click "+ Add Body" 3 times to create 3 empty bodies
2. Edit Body 1: mass=100, pos=(0,0), vel=(0,0)
3. Edit Body 2: mass=10, pos=(100,0), vel=(0,2)
4. Edit Body 3: mass=10, pos=(-100,0), vel=(0,-2)
5. Click "Apply Changes"
6. Click "Resume" to start with your custom configuration

### Example 3: Modify Running Simulation
1. Simulation is running the Lagrange Triangle
2. Click "Pause"
3. Edit a body's mass from 10 to 50
4. Click "Apply Changes"
5. Simulation resets with your new mass configuration
6. Click "Resume" to see the effect

## Technical Details

### State Management
- **pendingBodiesConfig** - The configuration shown in the editor (what you're editing)
- **activeBodiesConfig** - The configuration currently running in simulation
- When you click "Apply Changes", pending becomes active

### Validation
The system prevents invalid configurations:
- Each body must have mass > 0
- At least 1 body must exist
- Error messages appear if validation fails

### Camera Behavior
After applying changes, the camera automatically positions at the first body's location.

## Keyboard/Mouse Shortcuts
- Mouse wheel to zoom in/out (works while paused)
- HOME key to toggle debug starfield mode
- Drag not supported (use keyboard for pan)

## Limitations
- Maximum 10 bodies (soft limit, can be increased)
- No save/load of custom scenarios (future enhancement)
- No physics validation (e.g., won't warn about impossible orbits)
- No undo/redo (reset only reverts to last applied scenario)

## Troubleshooting

**Q: I edited a body but don't see the change in the simulation**
A: You need to click "Apply Changes" to load your edits into the simulation.

**Q: I can't edit a body's properties**
A: The inputs are disabled during simulation. Click "Pause" first.

**Q: I removed all bodies but the button is still greyed out**
A: The system enforces minimum 1 body. Click "Reset to Scenario" to restore a body.

**Q: The simulation doesn't look like what I configured**
A: Check that you clicked "Apply Changes" and that all your mass values are > 0.

## Future Enhancements
- Save/load custom scenarios to browser storage
- Physics validation (warn about unstable configurations)
- Undo/redo for configuration changes
- Import/export configurations as JSON
- More predefined scenarios
- Position/velocity presets based on orbital mechanics equations
