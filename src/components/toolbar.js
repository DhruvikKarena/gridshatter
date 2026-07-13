/**
 * Floating Toolbar over diagram canvas.
 */
export class Toolbar {
  /**
   * @param {HTMLElement} containerElement - Parent container.
   * @param {object} actions - Callbacks: { zoomIn, zoomOut, zoomReset, zoomFit, exportSVG, exportPNG, skipAnimation, setSpeed }
   */
  constructor(containerElement, actions) {
    this.container = containerElement;
    this.actions = actions;
    this.showExportMenu = false;
    this.speed = 'normal';
    this.isAnimating = false;

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="toolbar">
        <!-- Zoom Controls -->
        <button class="toolbar-btn" id="btn-zoom-in" title="Zoom In">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="11" y1="8" x2="11" y2="14"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button class="toolbar-btn" id="btn-zoom-out" title="Zoom Out">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
        </button>
        <button class="toolbar-btn" id="btn-zoom-fit" title="Zoom to Fit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"></path>
          </svg>
        </button>
        <button class="toolbar-btn" id="btn-zoom-reset" title="Reset View">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
            <polyline points="3 3 3 8 8 8"></polyline>
          </svg>
        </button>

        <div class="toolbar-divider"></div>

        <!-- Animation Controls (conditional show if generating) -->
        <div id="anim-controls-wrapper" style="display: ${this.isAnimating ? 'flex' : 'none'}; gap: 2px;">
          <button class="toolbar-btn" id="btn-skip-anim" title="Skip Animation" style="color: var(--accent-amber);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 4 15 12 5 20 5 4"></polygon>
              <line x1="19" y1="5" x2="19" y2="19"></line>
            </svg>
          </button>
          
          <select id="select-anim-speed" style="background: transparent; border: none; color: var(--text-secondary); font-size: 10px; font-family: var(--font-sans); padding: 0 4px; cursor: pointer; outline: none;">
            <option value="slow" ${this.speed === 'slow' ? 'selected' : ''}>Slow</option>
            <option value="normal" ${this.speed === 'normal' ? 'selected' : ''}>Normal</option>
            <option value="fast" ${this.speed === 'fast' ? 'selected' : ''}>Fast</option>
          </select>
          
          <div class="toolbar-divider"></div>
        </div>

        <!-- Export Dropdown -->
        <div style="position: relative;">
          <button class="toolbar-btn" id="btn-export-dropdown" title="Export Diagram">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
          
          <div class="export-dropdown ${this.showExportMenu ? '' : 'hidden'}" id="export-dropdown-menu">
            <button class="export-item" id="btn-export-png">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <span>Export as PNG</span>
            </button>
            <button class="export-item" id="btn-export-svg">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span>Export as SVG</span>
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Zoom triggers
    this.container.querySelector('#btn-zoom-in').addEventListener('click', () => this.actions.zoomIn());
    this.container.querySelector('#btn-zoom-out').addEventListener('click', () => this.actions.zoomOut());
    this.container.querySelector('#btn-zoom-fit').addEventListener('click', () => this.actions.zoomFit());
    this.container.querySelector('#btn-zoom-reset').addEventListener('click', () => this.actions.zoomReset());

    // Export triggers
    const dropdownBtn = this.container.querySelector('#btn-export-dropdown');
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.showExportMenu = !this.showExportMenu;
      this.container.querySelector('#export-dropdown-menu').classList.toggle('hidden');
    });

    // Close export dropdown when clicking outside
    window.addEventListener('click', () => {
      if (this.showExportMenu) {
        this.showExportMenu = false;
        this.container.querySelector('#export-dropdown-menu').classList.add('hidden');
      }
    });

    this.container.querySelector('#btn-export-png').addEventListener('click', () => {
      this.actions.exportPNG();
    });

    this.container.querySelector('#btn-export-svg').addEventListener('click', () => {
      this.actions.exportSVG();
    });

    // Animation events
    const skipBtn = this.container.querySelector('#btn-skip-anim');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.actions.skipAnimation();
      });
    }

    const speedSelect = this.container.querySelector('#select-anim-speed');
    if (speedSelect) {
      speedSelect.addEventListener('change', (e) => {
        this.speed = e.target.value;
        this.actions.setSpeed(this.speed);
      });
    }
  }

  setAnimating(isAnimating) {
    this.isAnimating = isAnimating;
    const wrapper = this.container.querySelector('#anim-controls-wrapper');
    if (wrapper) {
      wrapper.style.display = isAnimating ? 'flex' : 'none';
    }
  }
}
