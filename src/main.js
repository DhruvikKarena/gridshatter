/**
 * App Orchestrator and Bootstrapper.
 */

import { detectFileType } from './parsers/parser-utils.js';
import { parseCircleCI } from './parsers/yaml-parser.js';
import { parseHCL } from './parsers/hcl-parser.js';

import { mapCircleCIToGraph } from './mappers/circleci-mapper.js';
import { mapTerraformToGraph } from './mappers/terraform-mapper.js';

import { computePipelineLayout, computeTerraformLayout } from './visualization/layout-engine.js';
import { DiagramEngine } from './visualization/diagram-engine.js';
import { animateGeneration } from './visualization/animations.js';

import { UploadZone } from './components/upload-zone.js';
import { FilePreview } from './components/file-preview.js';
import { ProcessTerminal } from './components/process-terminal.js';
import { ErrorPanel } from './components/error-panel.js';
import { Toolbar } from './components/toolbar.js';
import { SampleSelector } from './components/sample-files.js';

class App {
  constructor() {
    this.diagramEngine = null;
    this.uploadZone = null;
    this.filePreview = null;
    this.terminal = null;
    this.errorPanel = null;
    this.toolbar = null;
    this.sampleSelector = null;

    // Orchestrator State
    this.currentRawCode = '';
    this.currentGraph = null;
    this.currentAnimation = null;
    this.animationSpeed = 'normal';

    this.init();
  }

  init() {
    // 1. Initialize UI Container Elements
    const terminalEl = document.getElementById('terminal-section');
    const uploadEl = document.getElementById('upload-section');
    const previewEl = document.getElementById('file-preview-section');
    const errorEl = document.getElementById('error-section');
    const toolbarEl = document.getElementById('toolbar-container');
    const sampleEl = document.getElementById('sample-selector');
    
    const svgEl = document.getElementById('diagram-svg');
    const viewportEl = document.getElementById('diagram-viewport');

    // 2. Instantiate Components
    this.terminal = new ProcessTerminal(terminalEl);
    
    this.diagramEngine = new DiagramEngine(svgEl, viewportEl);
    
    this.filePreview = new FilePreview(previewEl);
    
    this.errorPanel = new ErrorPanel(errorEl, (error) => {
      // Highlight line when error item is clicked
      this.filePreview.scrollToLine(error.line);
    });

    this.uploadZone = new UploadZone(uploadEl, (content, filename) => {
      this.handleFileUploaded(content, filename);
    });

    this.sampleSelector = new SampleSelector(sampleEl, (sample) => {
      this.handleSampleSelected(sample);
    });

    this.toolbar = new Toolbar(toolbarEl, {
      zoomIn: () => this.diagramEngine.zoomIn(),
      zoomOut: () => this.diagramEngine.zoomOut(),
      zoomFit: () => this.diagramEngine.zoomToFit(),
      zoomReset: () => this.diagramEngine.zoomReset(),
      exportPNG: () => this.diagramEngine.exportPNG(),
      exportSVG: () => this.diagramEngine.exportSVG(),
      skipAnimation: () => this.skipActiveAnimation(),
      setSpeed: (speed) => {
        this.animationSpeed = speed;
        // Re-run with new speed if animating
        if (this.currentAnimation) {
          this.runSimulation();
        }
      }
    });

    // Handle responsive resize triggers
    window.addEventListener('resize', () => {
      if (this.diagramEngine) {
        this.diagramEngine.zoomToFit();
      }
    });
  }

  /**
   * Orchestrates the parsing, mapping, and layout rendering.
   * @param {string} content - Raw file code.
   * @param {string} filename - Filename string.
   */
  handleFileUploaded(content, filename) {
    // Reset any active animations or UI panels
    this.cancelActiveAnimation();
    this.toolbar.setAnimating(false);
    this.diagramEngine.svg.classList.add('hidden');
    document.getElementById('diagram-placeholder').classList.remove('hidden');
    
    if (!content) {
      // Cleared state
      this.filePreview.clear();
      this.errorPanel.setErrors([]);
      this.terminal.clear();
      this.currentRawCode = '';
      this.currentGraph = null;
      return;
    }

    this.currentRawCode = content;
    this.terminal.clear();
    this.terminal.log('info', `Uploaded file: ${filename}`);

    // 1. Detect file type
    const fileType = detectFileType(filename, content);
    if (fileType === 'unknown') {
      this.terminal.log('error', '❌ Could not auto-detect configuration format.');
      this.errorPanel.setErrors([{
        severity: 'error',
        message: 'Unsupported format. The system could not detect if this is CircleCI YAML or Terraform HCL.',
        line: 1,
        suggestion: 'Verify keys like "version:", "jobs:", or "resource" blocks exist.'
      }]);
      return;
    }

    this.terminal.log('info', `Detected format: ${fileType === 'terraform' ? 'Terraform HCL' : 'CircleCI Config'}`);
    this.filePreview.setFile(content, fileType === 'terraform' ? 'hcl' : 'yaml');

    // 2. Parse Code
    let parsedAST = null;
    if (fileType === 'circleci') {
      parsedAST = parseCircleCI(content);
    } else {
      parsedAST = parseHCL(content);
    }

    // Set errors in the validation panel
    this.errorPanel.setErrors(parsedAST.errors);

    // If critical parsing errors occurred, stop visualization
    const criticalError = parsedAST.errors.some(e => e.severity === 'error');
    if (criticalError) {
      this.terminal.log('error', '❌ Critical compilation errors found. Simulation aborted.');
      return;
    }

    if (parsedAST.errors.length > 0) {
      this.terminal.log('warning', `⚠ Processed with ${parsedAST.errors.length} warnings.`);
    } else {
      this.terminal.log('success', '✓ Syntactic verification complete. Code compiles successfully.');
    }

    // 3. Map to Graph Data
    let graph = null;
    if (fileType === 'circleci') {
      graph = mapCircleCIToGraph(parsedAST);
    } else {
      graph = mapTerraformToGraph(parsedAST);
    }

    // 4. Compute Layout positions
    if (fileType === 'circleci') {
      this.currentGraph = computePipelineLayout(graph);
    } else {
      this.currentGraph = computeTerraformLayout(graph);
    }

    // Ensure we have nodes to render
    if (this.currentGraph.nodes.length === 0) {
      this.terminal.log('warning', '⚠ Configuration contains no visualizable resources.');
      return;
    }

    // Hide placeholder, show canvas and run animation simulation
    document.getElementById('diagram-placeholder').classList.add('hidden');
    this.diagramEngine.svg.classList.remove('hidden');

    this.runSimulation();
  }

  /**
   * Triggers the step-by-step animated generation flow.
   */
  runSimulation() {
    this.cancelActiveAnimation();
    this.toolbar.setAnimating(true);

    this.currentAnimation = animateGeneration(
      this.diagramEngine,
      this.currentGraph,
      this.terminal,
      this.animationSpeed,
      () => {
        // Completion callback
        this.toolbar.setAnimating(false);
        this.currentAnimation = null;
      }
    );
  }

  handleSampleSelected(sample) {
    this.uploadZone.setFileState(sample.filename, sample.content.length, sample.type === 'hcl' ? 'terraform' : 'circleci');
    this.handleFileUploaded(sample.content, sample.filename);
  }

  skipActiveAnimation() {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
      this.toolbar.setAnimating(false);
      this.terminal.log('success', '✓ Skip requested. Architecture generated instantly.');
    }
  }

  cancelActiveAnimation() {
    if (this.currentAnimation) {
      this.currentAnimation.cancel();
      this.currentAnimation = null;
    }
  }
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
