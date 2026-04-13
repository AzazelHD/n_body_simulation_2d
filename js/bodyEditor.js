/**
 * Body Editor UI Module
 * Handles rendering and interaction of body configuration cards
 */

/**
 * Render a single body card HTML
 * @param {Object} bodyConfig - Body configuration object
 * @param {number} index - Body index
 * @param {boolean} canRemove - Whether this body can be removed
 * @returns {string} HTML string
 */
export function renderBodyCard(bodyConfig, index, canRemove = true) {
  const hue = hexToHue(bodyConfig.color);

  return `
    <article class="body-card" data-index="${index}">
      <header class="card-header">
        <button type="button" class="card-toggle" aria-expanded="false" aria-label="Toggle body settings">▼</button>
        <span class="color-indicator" style="background-color: ${bodyConfig.color}"></span>
        <h4>Body ${index + 1}</h4>
        ${canRemove ? `<button type="button" class="remove-body-btn-x" aria-label="Remove body">×</button>` : `<button type="button" class="remove-body-btn-x" disabled aria-label="Cannot remove last body">×</button>`}
      </header>
      <section class="card-inputs-wrapper collapsed">
        <div class="card-inputs">
          <fieldset class="input-group">
            <legend>Position & Velocity</legend>
            <label>
              Position X:
              <input class="body-input body-posX" type="number" value="${bodyConfig.posX}" step="10" />
            </label>
            <label>
              Position Y:
              <input class="body-input body-posY" type="number" value="${bodyConfig.posY}" step="10" />
            </label>
            <label>
              Velocity X:
              <input class="body-input body-velX" type="number" value="${bodyConfig.velX}" step="0.05" />
            </label>
            <label>
              Velocity Y:
              <input class="body-input body-velY" type="number" value="${bodyConfig.velY}" step="0.05" />
            </label>
          </fieldset>

          <fieldset class="input-group">
            <legend>Properties</legend>
            <label>
              Mass:
              <input class="body-input body-mass" type="number" value="${bodyConfig.mass}" min="1" step="5" />
            </label>
            <label>
              Color:
              <input class="body-input body-hue" type="range" min="0" max="360" step="1" value="${hue}" style="--hue: ${hue}; --hue-progress: ${(hue / 360) * 100}%;" />
            </label>
          </fieldset>
        </div>
      </section>
    </article>
  `;
}

/**
 * Render all body cards
 * @param {Array} bodiesConfig - Array of body configurations
 * @returns {string} HTML string
 */
export function renderAllBodyCards(bodiesConfig) {
  return bodiesConfig
    .map((bodyConfig, index) => renderBodyCard(bodyConfig, index, bodiesConfig.length > 1))
    .join("");
}

/**
 * Attach input listeners to body cards
 * @param {string} containerId - Container element ID
 * @param {Array} pendingConfig - Reference to pending bodies config
 * @param {Function} onUpdate - Callback function when config changes
 */
export function attachBodyInputListeners(containerId, pendingConfig, onUpdate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Mass/Velocity/Position inputs
  container.querySelectorAll(".body-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const card = e.target.closest(".body-card");
      const index = parseInt(card.dataset.index);
      const fieldName = e.target.classList[1]; // e.g., 'body-mass'
      const configKey = fieldName.replace("body-", ""); // e.g., 'mass'

      if (index >= 0 && index < pendingConfig.length) {
        if (configKey === "hue") {
          const nextHue = parseInt(e.target.value, 10) || 0;
          pendingConfig[index].color = hueToHex(nextHue);
          e.target.style.setProperty("--hue", `${nextHue}`);
          e.target.style.setProperty("--hue-progress", `${(nextHue / 360) * 100}%`);

          const indicator = card.querySelector(".color-indicator");
          if (indicator) {
            indicator.style.backgroundColor = pendingConfig[index].color;
          }
        } else {
          pendingConfig[index][configKey] = parseFloat(e.target.value) || 0;
        }

        // Re-render only for structural changes (remove/add), otherwise sliders collapse while dragging.
      }
    });
  });

  // Remove body buttons (X icons)
  container.querySelectorAll(".remove-body-btn-x").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      if (btn.disabled) return;

      const card = e.target.closest(".body-card");
      const index = parseInt(card.dataset.index);

      if (index >= 0 && index < pendingConfig.length) {
        pendingConfig.splice(index, 1);
        if (onUpdate) onUpdate();
      }
    });
  });

  // Card toggle: click anywhere on header to expand/collapse
  container.querySelectorAll(".card-header").forEach((header) => {
    header.addEventListener("click", (e) => {
      const card = header.closest(".body-card");
      const wrapper = card.querySelector(".card-inputs-wrapper");
      const btn = card.querySelector(".card-toggle");
      const isCollapsed = wrapper.classList.contains("collapsed");

      if (isCollapsed) {
        // Expand
        wrapper.classList.remove("collapsed");
        btn.setAttribute("aria-expanded", "true");
      } else {
        // Collapse
        wrapper.classList.add("collapsed");
        btn.setAttribute("aria-expanded", "false");
      }
    });
  });
}

/**
 * Update body input fields to display current values
 * @param {string} containerId - Container element ID
 * @param {Array} bodiesConfig - Array of body configurations
 */
export function updateBodyCardsDisplay(containerId, bodiesConfig) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.querySelectorAll(".body-card").forEach((card, index) => {
    if (index < bodiesConfig.length) {
      const config = bodiesConfig[index];
      card.querySelector(".body-posX").value = config.posX;
      card.querySelector(".body-posY").value = config.posY;
      card.querySelector(".body-velX").value = config.velX;
      card.querySelector(".body-velY").value = config.velY;
      card.querySelector(".body-mass").value = config.mass;
      const hueInput = card.querySelector(".body-hue");
      const hue = hexToHue(config.color);
      hueInput.value = hue;
      hueInput.style.setProperty("--hue", `${hue}`);
      hueInput.style.setProperty("--hue-progress", `${(hue / 360) * 100}%`);
      card.querySelector(".color-indicator").style.backgroundColor = config.color;
    }
  });
}

/**
 * Disable/Enable all body input fields
 * @param {string} containerId - Container element ID
 * @param {boolean} disabled - Whether to disable inputs
 */
export function setBodyInputsDisabled(containerId, disabled) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Keep hue sliders editable while running so body colors can be adjusted live.
  container.querySelectorAll(".body-input:not(.body-hue)").forEach((input) => {
    input.disabled = disabled;
  });

  container.querySelectorAll(".remove-body-btn-x").forEach((btn) => {
    // Only truly disable if not the last body
    const isLastBody = !container.querySelector(".body-card:nth-child(n+2)");
    btn.disabled = disabled || isLastBody;
  });
}

/**
 * Render body cards and attach listeners
 * @param {string} containerId - Container element ID
 * @param {Array} bodiesConfig - Array of body configurations
 * @param {Function} onUpdate - Callback when config changes
 */
export function renderAndAttachListeners(containerId, bodiesConfig, onUpdate) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = renderAllBodyCards(bodiesConfig);
  attachBodyInputListeners(containerId, bodiesConfig, onUpdate);
}

function hueToHex(hue) {
  const normalized = ((hue % 360) + 360) % 360;
  const c = 1;
  const x = 1 - Math.abs(((normalized / 60) % 2) - 1);

  let r = 0;
  let g = 0;
  let b = 0;

  if (normalized < 60) {
    r = c;
    g = x;
  } else if (normalized < 120) {
    r = x;
    g = c;
  } else if (normalized < 180) {
    g = c;
    b = x;
  } else if (normalized < 240) {
    g = x;
    b = c;
  } else if (normalized < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (value) =>
    Math.round((value * 0.75 + 0.15) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHue(hex) {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!match) return 0;

  const r = parseInt(match[1], 16) / 255;
  const g = parseInt(match[2], 16) / 255;
  const b = parseInt(match[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  if (delta === 0) return 0;

  let hue;
  if (max === r) {
    hue = ((g - b) / delta) % 6;
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  return Math.round((hue * 60 + 360) % 360);
}

export function getRandomBodyColor() {
  return hueToHex(Math.floor(Math.random() * 360));
}

/**
 * Show a validation error message
 * @param {string} message - Error message
 */
export function showError(message) {
  // Create or reuse error element
  let errorEl = document.getElementById("bodiesError");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.id = "bodiesError";
    errorEl.className = "error-message";
    document.getElementById("bodiesFieldset")?.insertAdjacentElement("afterend", errorEl);
  }

  errorEl.textContent = message;
  errorEl.style.display = "block";

  // Auto-hide after 4 seconds
  setTimeout(() => {
    errorEl.style.display = "none";
  }, 4000);
}

/**
 * Clear any error messages
 */
export function clearError() {
  const errorEl = document.getElementById("bodiesError");
  if (errorEl) {
    errorEl.style.display = "none";
  }
}

/**
 * Validate bodies configuration
 * @param {Array} bodiesConfig - Array of body configurations
 * @returns {Object} {valid: boolean, error: string|null}
 */
export function validateBodiesConfig(bodiesConfig) {
  if (!bodiesConfig || bodiesConfig.length === 0) {
    return { valid: false, error: "At least 1 body is required" };
  }

  for (let i = 0; i < bodiesConfig.length; i++) {
    const body = bodiesConfig[i];
    if (body.mass <= 0) {
      return { valid: false, error: `Body ${i + 1}: Mass must be greater than 0` };
    }
  }

  return { valid: true, error: null };
}
