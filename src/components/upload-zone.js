/**
 * Drag-and-drop File Upload Zone Component.
 */
export class UploadZone {
  /**
   * @param {HTMLElement} containerElement - Container.
   * @param {function} onUpload - Callback when a file is uploaded: (content, filename)
   */
  constructor(containerElement, onUpload) {
    this.container = containerElement;
    this.onUpload = onUpload;
    
    // State
    this.currentFile = null;

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    if (this.currentFile) {
      // File already uploaded view
      const fileTypeClass = this.currentFile.type === 'terraform' ? 'terraform' : 'circleci';
      const fileTypeLabel = this.currentFile.type === 'terraform' ? 'Terraform HCL' : 'CircleCI Config';
      
      this.container.innerHTML = `
        <div class="file-info">
          <div class="file-info-icon ${fileTypeClass}">
            ${this.currentFile.type === 'terraform' ? '🛠️' : '⚙️'}
          </div>
          <div class="file-info-details">
            <div class="file-info-name">${this.currentFile.name}</div>
            <div class="file-info-meta">${fileTypeLabel} • ${this.formatBytes(this.currentFile.size)}</div>
          </div>
          <button class="file-info-remove" id="btn-remove-file" title="Clear configuration">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      `;

      this.container.querySelector('#btn-remove-file').addEventListener('click', () => {
        this.clear();
      });
      return;
    }

    // Default Upload Drag & Drop Zone View
    this.container.innerHTML = `
      <div class="upload-zone" id="drag-drop-zone">
        <input type="file" class="upload-input" id="file-input-field" accept=".tf,.yml,.yaml" />
        <div class="upload-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
        </div>
        <div class="upload-title">Import Configuration</div>
        <div class="upload-subtitle">Drag & drop or <strong>browse</strong> files</div>
        <div style="font-size: 10px; color: var(--text-dim); margin-top: 10px;">Supports .tf, .yml, .yaml configurations</div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const zone = this.container.querySelector('#drag-drop-zone');
    const input = this.container.querySelector('#file-input-field');

    // Trigger input click on zone click
    zone.addEventListener('click', () => {
      input.click();
    });

    // Handle input change
    input.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });

    // Drag-over styling
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFile(e.dataTransfer.files[0]);
      }
    });
  }

  /**
   * Processes the uploaded file.
   * @param {File} file - Raw browser File instance.
   */
  handleFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['tf', 'yml', 'yaml'].includes(ext)) {
      alert('Invalid file format. Please upload a .tf or .yml/.yaml file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const inferredType = ext === 'tf' ? 'terraform' : 'circleci';

      this.currentFile = {
        name: file.name,
        size: file.size,
        type: inferredType
      };

      this.render();

      if (this.onUpload) {
        this.onUpload(content, file.name);
      }
    };
    reader.readAsText(file);
  }

  /**
   * Sets file state programmatically (e.g. from samples).
   */
  setFileState(name, size, type) {
    this.currentFile = { name, size, type };
    this.render();
  }

  clear() {
    this.currentFile = null;
    this.render();
    if (this.onUpload) {
      this.onUpload('', ''); // Triggers parent reset
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}
