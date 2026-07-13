import { highlightSyntax } from '../parsers/parser-utils.js';

/**
 * File Preview Component showing syntax-highlighted code.
 */
export class FilePreview {
  constructor(containerElement) {
    this.container = containerElement;
    this.content = '';
    this.type = ''; // 'yaml' or 'hcl'
    this.isCollapsed = false;

    this.init();
  }

  init() {
    this.container.innerHTML = '';
  }

  /**
   * Set and render file code content.
   * @param {string} rawCode - File contents.
   * @param {'yaml' | 'hcl'} type - Parsing category.
   */
  setFile(rawCode, type) {
    this.content = rawCode;
    this.type = type;
    this.container.classList.remove('hidden');
    this.render();
  }

  render() {
    const lines = this.content.split('\n');
    const highlightedCode = highlightSyntax(this.content, this.type);
    const highlightedLines = highlightedCode.split('\n');

    this.container.innerHTML = `
      <div class="file-preview-header" id="preview-toggle-header">
        <h3>Source Code Preview</h3>
        <button class="file-preview-toggle ${this.isCollapsed ? 'collapsed' : ''}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
      <div class="file-preview-content ${this.isCollapsed ? 'hidden' : ''}" id="preview-content-body">
        ${highlightedLines.map((lineContent, idx) => `
          <div class="code-line" id="line-${idx + 1}" data-line="${idx + 1}">
            <span class="code-line-number">${idx + 1}</span>
            <span class="code-line-content">${lineContent || ' '}</span>
          </div>
        `).join('')}
      </div>
    `;

    // Add collapse action listeners
    this.container.querySelector('#preview-toggle-header').addEventListener('click', () => {
      this.isCollapsed = !this.isCollapsed;
      this.container.querySelector('.file-preview-toggle').classList.toggle('collapsed');
      this.container.querySelector('#preview-content-body').classList.toggle('hidden');
    });
  }

  /**
   * Focuses and highlights a specific code line.
   * @param {number} lineNum - 1-based line number.
   */
  scrollToLine(lineNum) {
    if (this.isCollapsed) {
      // Expand first
      this.isCollapsed = false;
      this.render();
    }

    const contentBody = this.container.querySelector('#preview-content-body');
    const targetLine = this.container.querySelector(`#line-${lineNum}`);

    if (contentBody && targetLine) {
      // Remove any existing highlights
      contentBody.querySelectorAll('.code-line.error-line').forEach(el => {
        el.classList.remove('error-line');
      });

      // Highlight target line
      targetLine.classList.add('error-line');

      // Scroll into view inside container
      const containerTop = contentBody.getBoundingClientRect().top;
      const lineTop = targetLine.getBoundingClientRect().top;
      contentBody.scrollTop = contentBody.scrollTop + (lineTop - containerTop) - 50;
    }
  }

  clear() {
    this.content = '';
    this.type = '';
    this.container.classList.add('hidden');
    this.container.innerHTML = '';
  }
}
