/**
 * Retro-style terminal component for process logs.
 */
export class ProcessTerminal {
  constructor(containerElement) {
    this.container = containerElement;
    this.body = null;
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="terminal-header">
        <div class="terminal-header-left">
          <div class="terminal-dots">
            <span class="terminal-dot red"></span>
            <span class="terminal-dot yellow"></span>
            <span class="terminal-dot green"></span>
          </div>
          <span class="terminal-title">Process Terminal</span>
        </div>
        <button class="terminal-clear" id="terminal-clear-btn">Clear</button>
      </div>
      <div class="terminal-body" id="terminal-log-body">
        <div class="terminal-line info">
          <span class="terminal-timestamp">[12:00:00]</span>
          <span class="terminal-icon">▶</span>
          <span class="terminal-message">Terminal ready. Awaiting file upload...</span>
        </div>
        <span class="terminal-cursor"></span>
      </div>
    `;

    this.body = this.container.querySelector('#terminal-log-body');
    
    // Clear button listener
    this.container.querySelector('#terminal-clear-btn').addEventListener('click', () => {
      this.clear();
    });
  }

  /**
   * Log a new line to the terminal.
   * @param {'info' | 'success' | 'warning' | 'error' | 'step'} type - Log level.
   * @param {string} message - Message text.
   */
  log(type, message) {
    const timestamp = new Date().toLocaleTimeString();
    
    const line = document.createElement('div');
    line.className = `terminal-line ${type}`;
    
    let icon = '▶';
    if (type === 'success') icon = '✓';
    else if (type === 'error') icon = '✗';
    else if (type === 'warning') icon = '⚠';
    else if (type === 'step') icon = '⚡';

    line.innerHTML = `
      <span class="terminal-timestamp">[${timestamp}]</span>
      <span class="terminal-icon">${icon}</span>
      <span class="terminal-message">${message}</span>
    `;

    // Insert line before the blinking cursor
    const cursor = this.body.querySelector('.terminal-cursor');
    this.body.insertBefore(line, cursor);

    // Scroll to bottom
    this.body.scrollTop = this.body.scrollHeight;
  }

  clear() {
    this.body.innerHTML = `
      <div class="terminal-line info">
        <span class="terminal-timestamp">[${new Date().toLocaleTimeString()}]</span>
        <span class="terminal-icon">▶</span>
        <span class="terminal-message">Terminal cleared. Awaiting input.</span>
      </div>
      <span class="terminal-cursor"></span>
    `;
  }
}
