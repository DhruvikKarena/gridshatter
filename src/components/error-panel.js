/**
 * Error and Warning Panel Component.
 */
export class ErrorPanel {
  /**
   * @param {HTMLElement} containerElement - Destination container.
   * @param {function} onErrorClick - Callback when an error item is clicked.
   */
  constructor(containerElement, onErrorClick) {
    this.container = containerElement;
    this.onErrorClick = onErrorClick;
    this.errors = [];
    this.isCollapsed = false;

    this.init();
  }

  init() {
    this.container.className = 'hidden'; // Hidden by default
    this.render();
  }

  render() {
    const errorCount = this.errors.filter(e => e.severity === 'error').length;
    const warningCount = this.errors.filter(e => e.severity === 'warning').length;
    const totalCount = this.errors.length;

    if (totalCount === 0) {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');
    this.container.innerHTML = `
      <div class="error-header" id="error-toggle-header">
        <div class="error-header-left">
          <span class="error-header-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </span>
          <span class="error-header-title">Configuration Issues</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="error-count">${totalCount}</span>
        </div>
      </div>
      <div class="error-body ${this.isCollapsed ? 'hidden' : ''}" id="error-list-body">
        ${this.errors.map((err, idx) => {
          const typeClass = err.severity === 'error' ? 'error' : 'warning';
          const typeLetter = err.severity === 'error' ? 'E' : 'W';
          
          return `
            <div class="error-item" data-idx="${idx}">
              <div class="error-severity ${typeClass}">${typeLetter}</div>
              <div class="error-details">
                <div class="error-message">${err.message}</div>
                <div class="error-location">Line ${err.line}</div>
                ${err.suggestion ? `<div class="error-suggestion">💡 ${err.suggestion}</div>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Collapsible header toggle
    this.container.querySelector('#error-toggle-header').addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.container.querySelector('#error-list-body').classList.toggle('hidden');
    });

    // Error item click listeners for highlighting lines in code editor
    this.container.querySelectorAll('.error-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.idx);
        const error = this.errors[idx];
        if (error && this.onErrorClick) {
          this.onErrorClick(error);
        }
      });
    });
  }

  /**
   * Set list of errors to display.
   * @param {Array} errorsList - Error objects list.
   */
  setErrors(errorsList) {
    this.errors = errorsList;
    this.render();
  }
}
