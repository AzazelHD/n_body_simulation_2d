import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

// Individual starfield cell
export class StarfieldCell {
  constructor(starCount, cellWidth, cellHeight, options = {}) {
    this.starCount = starCount;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
    this.gridX = 0;
    this.gridY = 0;

    // Optional customization
    this.color = options.color || 0xffffff;
    this.size = options.size || 2;
    this.brightness = options.brightness || 1.0;

    // Create star layers with varying sizes
    this.starLayers = this.#createStarLayers();
    this.debugBorder = this.#createDebugBorder();
  }

  #createStarLayers() {
    // Create 3 layers of stars with different sizes + subtle red/blue tint
    const layerConfigs = [
      { sizeMultiplier: 0.6, countRatio: 0.2, color: 0xffbbbb }, // small red-tinged stars
      { sizeMultiplier: 1.0, countRatio: 0.6, color: 0xffffff }, // neutral stars
      { sizeMultiplier: 1.4, countRatio: 0.2, color: 0xbbbfff }, // small blue-tinged stars
    ];

    const layers = [];
    let remainingStars = this.starCount;

    for (let i = 0; i < layerConfigs.length; i++) {
      const config = layerConfigs[i];
      const count =
        i === layerConfigs.length - 1
          ? remainingStars
          : Math.floor(this.starCount * config.countRatio);
      remainingStars -= count;

      const geometry = this.#createGeometry(count);
      const material = this.#createMaterial(config.sizeMultiplier * this.size, config.color);
      const points = new THREE.Points(geometry, material);

      layers.push({ geometry, material, points, count });
    }

    return layers;
  }

  #createGeometry(count) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * this.cellWidth;
      positions[i3 + 1] = (Math.random() - 0.5) * this.cellHeight;
      positions[i3 + 2] = -10;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }

  #createMaterial(size, color) {
    return new THREE.PointsMaterial({
      color: color ?? this.color,
      size: size,
      transparent: true,
      opacity: this.brightness,
    });
  }

  #createDebugBorder() {
    const hw = this.cellWidth / 2;
    const hh = this.cellHeight / 2;

    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hh);
    shape.lineTo(hw, -hh);
    shape.lineTo(hw, hh);
    shape.lineTo(-hw, hh);
    shape.closePath();

    const geometry = new THREE.BufferGeometry().setFromPoints(shape.getPoints());
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const border = new THREE.Line(geometry, material);
    border.position.z = -1;
    border.visible = false;

    return border;
  }

  regenerateStars() {
    this.starLayers.forEach((layer) => {
      // Dispose old geometry
      layer.geometry.dispose();

      // Create new geometry with fresh stars
      layer.geometry = this.#createGeometry(layer.count);
      layer.points.geometry = layer.geometry;
    });
  }

  setPosition(gridX, gridY) {
    this.gridX = gridX;
    this.gridY = gridY;

    const worldX = gridX * this.cellWidth;
    const worldY = gridY * this.cellHeight;

    this.starLayers.forEach((layer) => {
      layer.points.position.set(worldX, worldY, 0);
    });
    this.debugBorder.position.set(worldX, worldY, -9);
  }

  setDebugVisibility(visible) {
    this.debugBorder.visible = visible;
  }

  addToScene(scene) {
    this.starLayers.forEach((layer) => scene.add(layer.points));
    scene.add(this.debugBorder);
  }

  removeFromScene(scene) {
    this.starLayers.forEach((layer) => scene.remove(layer.points));
    scene.remove(this.debugBorder);
  }

  dispose() {
    this.starLayers.forEach((layer) => {
      layer.geometry.dispose();
      layer.material.dispose();
    });
    this.debugBorder.geometry.dispose();
    this.debugBorder.material.dispose();
  }
}

// Starfield manager - now accepts grid configuration
export class Starfield {
  constructor(scene, camera, config = {}) {
    this.scene = scene;
    this.camera = camera;

    // Grid configuration
    this.gridSize = config.gridSize || 3;
    this.gridOffset = Math.floor(this.gridSize / 2);

    // Scale configuration (moved out of calculateCellSize)
    this.normalZoom = config.normalZoom ?? 0.25; // non-debug max zoom out
    this.debugZoom = config.debugZoom ?? 0.05; // debug max zoom out from HOME toggle
    this.paddingFactor = config.paddingFactor ?? 1.0;

    // Cell configuration
    this.starsPerCell = config.starsPerCell || 300;
    this.cellGenerator = config.cellGenerator || null; // Custom cell generation function
    this.initialCells = Array.isArray(config.initialCells) ? config.initialCells.slice() : null;

    // State
    this.cells = [];
    this.currentCellX = 0;
    this.currentCellY = 0;
    this.debugMode = false;

    this.#initialize();
  }

  #initialize() {
    this.#calculateCellSize();
    this.#createCells();
  }

  #calculateCellSize() {
    // Cell width/height is fixed to normal zoom level for consistent star containment.
    // Debug mode only affects zoom limits and border visibility, not cell geometry.
    const viewWidth = (this.camera.right - this.camera.left) / this.normalZoom;
    const viewHeight = (this.camera.top - this.camera.bottom) / this.normalZoom;

    this.cellWidth = viewWidth * this.paddingFactor;
    this.cellHeight = viewHeight * this.paddingFactor;
  }

  #createCells() {
    const totalCells = this.gridSize * this.gridSize;

    if (this.initialCells) {
      // Use prebuilt cells created in main.js
      this.cells = this.initialCells.slice(0, totalCells);
      this.cells.forEach((cell) => {
        // ensure geometry matches current cell size in case camera changed
        cell.cellWidth = this.cellWidth;
        cell.cellHeight = this.cellHeight;
        cell.regenerateStars();
        cell.addToScene(this.scene);
      });
      this.#positionAllCells(0, 0);
      return;
    }

    for (let i = 0; i < totalCells; i++) {
      let cell;

      // Use custom generator if provided
      if (this.cellGenerator) {
        cell = this.cellGenerator(this.starsPerCell, this.cellWidth, this.cellHeight);
      } else {
        // Default cell creation
        cell = new StarfieldCell(this.starsPerCell, this.cellWidth, this.cellHeight);
      }

      cell.addToScene(this.scene);
      this.cells.push(cell);
    }

    // Position them in grid
    this.#positionAllCells(0, 0);
  }

  #positionAllCells(centerX, centerY) {
    let cellIndex = 0;

    for (let y = -this.gridOffset; y <= this.gridOffset; y++) {
      for (let x = -this.gridOffset; x <= this.gridOffset; x++) {
        const gridX = centerX + x;
        const gridY = centerY + y;
        const cell = this.cells[cellIndex];

        cell.setPosition(gridX, gridY);

        cellIndex++;
      }
    }
  }

  #regenerateCellStars(cell) {
    // Use custom generator if available, otherwise just regenerate
    if (this.cellGenerator) {
      // Create new cell with same properties but fresh stars
      const newCell = this.cellGenerator(this.starsPerCell, this.cellWidth, this.cellHeight);

      // Copy position data
      newCell.setPosition(cell.gridX, cell.gridY);
      newCell.setDebugVisibility(this.debugMode);

      // Replace old cell
      const index = this.cells.indexOf(cell);
      if (index !== -1) {
        cell.removeFromScene(this.scene);
        cell.dispose();
        this.cells[index] = newCell;
        newCell.addToScene(this.scene);
      }
    } else {
      // Just regenerate stars in place
      cell.regenerateStars();
    }
  }

  #getCurrentCellCoords(camera) {
    return {
      x: Math.round(camera.position.x / this.cellWidth),
      y: Math.round(camera.position.y / this.cellHeight),
    };
  }

  update(camera) {
    if (!isFinite(camera.position.x) || !isFinite(camera.position.y)) return;

    const newCell = this.#getCurrentCellCoords(camera);

    const dx = newCell.x - this.currentCellX;
    const dy = newCell.y - this.currentCellY;

    if (dx === 0 && dy === 0) return;

    this.#wrapCells(dx, dy);

    this.currentCellX = newCell.x;
    this.currentCellY = newCell.y;
  }

  #wrapCells(dx, dy) {
    const newCenterX = this.currentCellX + dx;
    const newCenterY = this.currentCellY + dy;
    const gs = this.gridSize;

    this.cells.forEach((cell) => {
      const relX = cell.gridX - newCenterX;
      const relY = cell.gridY - newCenterY;

      if (Math.abs(relX) > this.gridOffset || Math.abs(relY) > this.gridOffset) {
        // O(1) modular wrap — immune to large/infinite dx,dy
        const minX = newCenterX - this.gridOffset;
        const minY = newCenterY - this.gridOffset;
        const newGridX = ((((cell.gridX - minX) % gs) + gs) % gs) + minX;
        const newGridY = ((((cell.gridY - minY) % gs) + gs) % gs) + minY;

        cell.setPosition(newGridX, newGridY);
        this.#regenerateCellStars(cell);
      }
    });
  }

  toggleDebug() {
    this.debugMode = !this.debugMode;
    this.cells.forEach((cell) => cell.setDebugVisibility(this.debugMode));
    return this.debugMode;
  }

  isDebugMode() {
    return this.debugMode;
  }

  getCurrentCell() {
    return { x: this.currentCellX, y: this.currentCellY };
  }

  getActiveCellCount() {
    return this.cells.length;
  }

  resize(camera) {
    this.camera = camera;

    this.#calculateCellSize();

    // Update all cells with new dimensions
    this.cells.forEach((cell) => {
      cell.cellWidth = this.cellWidth;
      cell.cellHeight = this.cellHeight;
      cell.setPosition(cell.gridX, cell.gridY);
      this.#regenerateCellStars(cell);
    });

    if (this.debugMode) {
      this.cells.forEach((cell) => cell.setDebugVisibility(true));
    }
  }

  dispose() {
    this.cells.forEach((cell) => {
      cell.removeFromScene(this.scene);
      cell.dispose();
    });
    this.cells = [];
  }
}
