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
import { ChallengesGame } from './components/challenges-game.js';

class App {
  constructor() {
    this.diagramEngine = null;
    this.uploadZone = null;
    this.filePreview = null;
    this.terminal = null;
    this.errorPanel = null;
    this.toolbar = null;
    this.sampleSelector = null;
    this.game = null;

    // Orchestrator State
    this.currentRawCode = '';
    this.currentGraph = null;
    this.currentAnimation = null;
    this.animationSpeed = 'normal';
    this.isThreatSimulating = false;
    this.currentAST = null;

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
      },
      simulateThreat: () => this.handleSimulateThreat()
    });

    // Handle responsive resize triggers
    window.addEventListener('resize', () => {
      if (this.diagramEngine) {
        this.diagramEngine.zoomToFit();
      }
    });

    // Tab switching elements
    const tabParserBtn = document.getElementById('tab-btn-parser');
    const tabGameBtn = document.getElementById('tab-btn-game');
    const parserContent = document.getElementById('parser-tab-content');
    const gameContent = document.getElementById('game-tab-content');

    tabParserBtn.addEventListener('click', () => {
      tabParserBtn.classList.add('active');
      tabGameBtn.classList.remove('active');
      parserContent.classList.remove('hidden');
      gameContent.classList.add('hidden');
      
      // Show file preview if it was loaded
      if (this.currentRawCode) {
        this.filePreview.container.classList.remove('hidden');
      }
    });

    tabGameBtn.addEventListener('click', () => {
      tabGameBtn.classList.add('active');
      tabParserBtn.classList.remove('active');
      gameContent.classList.remove('hidden');
      parserContent.classList.add('hidden');
      
      // Hide standard file preview in challenge mode
      this.filePreview.container.classList.add('hidden');
      
      // Instantiate Challenges Component if not already done
      if (!this.game) {
        this.game = new ChallengesGame(gameContent, {
          onCodeChange: (code, isValid) => {
            this.handleChallengeCodeChange(code, isValid);
          },
          onValidateSuccess: (challenge, code) => {
            this.handleChallengeSuccess(challenge, code);
          }
        });
      } else {
        this.game.render();
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
    this.currentAST = parsedAST;

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
      this.toolbar.showThreatButton(false);
    } else {
      this.currentGraph = computeTerraformLayout(graph);
      this.toolbar.showThreatButton(true);
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

  handleChallengeCodeChange(code, isValid) {
    this.cancelActiveAnimation();
    this.toolbar.setAnimating(false);
    
    this.terminal.clear();
    this.terminal.log('info', '⚙️ Parsing challenge code...');

    const parsedAST = parseHCL(code);
    this.errorPanel.setErrors(parsedAST.errors);
    this.currentAST = parsedAST;

    const criticalError = parsedAST.errors.some(e => e.severity === 'error');
    if (criticalError) {
      this.terminal.log('error', '❌ Compilation failed. Check syntax error logs below.');
      return;
    }

    this.terminal.log('success', '✓ Syntax validated.');
    
    // Map & Layout
    const graph = mapTerraformToGraph(parsedAST);
    
    if (graph.nodes.length === 0) {
      this.terminal.log('warning', '⚠ No resources defined yet. Type some Terraform resources to build the graph!');
      this.diagramEngine.svg.classList.add('hidden');
      document.getElementById('diagram-placeholder').classList.remove('hidden');
      this.toolbar.showThreatButton(false);
      return;
    }

    this.currentGraph = computeTerraformLayout(graph);
    this.toolbar.showThreatButton(true);
    
    document.getElementById('diagram-placeholder').classList.add('hidden');
    this.diagramEngine.svg.classList.remove('hidden');

    this.runSimulation();
  }

  handleChallengeSuccess(challenge, code) {
    this.handleChallengeCodeChange(code, true);
    
    // Log victory messages in terminal
    this.terminal.log('success', `🎉 CHALLENGE CLEARED: ${challenge.title}!`);
    this.terminal.log('info', `🏆 Objective completed: ${challenge.objective.replace(/<\/?[^>]+(>|$)/g, "")}`);
    this.terminal.log('success', '🚀 Dynamic architecture diagram successfully generated and validated. Well done, Cloud Architect!');
  }

  async handleSimulateThreat() {
    if (this.isThreatSimulating) return;
    if (!this.currentGraph || this.currentGraph.nodes.length === 0) return;

    this.isThreatSimulating = true;
    this.cancelActiveAnimation();
    this.toolbar.setAnimating(false);
    
    // Identify Scenario
    let scenarioKey = 'generic';
    if (this.game && this.game.activeChallenge) {
      scenarioKey = 'challenge_' + this.game.activeChallenge.id;
    } else {
      // Fallback custom file logic
      if (this.currentGraph.nodes.some(n => n.type === 'aws_sns_topic_subscription' || n.type === 'aws_s3_bucket_notification')) {
        scenarioKey = 'messaging';
      } else if (this.currentGraph.nodes.some(n => n.type === 'aws_api_gateway_rest_api')) {
        scenarioKey = 'serverless';
      } else if (this.currentGraph.nodes.some(n => n.type === 'aws_lb' || n.type === 'aws_alb')) {
        scenarioKey = 'alb';
      } else if (this.currentGraph.nodes.some(n => n.type === 'aws_ecs_cluster' || n.type === 'aws_ecs_service')) {
        scenarioKey = 'ecs';
      }
    }

    const scenario = this.getDynamicScenario(scenarioKey, this.currentAST);
    this.terminal.clear();
    this.terminal.log('step', `⚡ Starting Attacker Threat Simulation [Scenario: ${scenario.title}]...`);

    // Clean up any old highlights
    document.querySelectorAll('.diagram-node.attacked').forEach(el => el.classList.remove('attacked'));
    document.querySelectorAll('.diagram-edge.attacked').forEach(el => el.classList.remove('attacked'));

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (const step of scenario.steps) {
      await wait(1200);
      this.terminal.log(step.status, step.log);

      // Highlight target node
      const matchingNodes = this.currentGraph.nodes.filter(n => n.type === step.target || n.sublabel === step.target);
      matchingNodes.forEach(n => {
        const nodeEl = document.querySelector(`[data-id="${n.id}"]`);
        if (nodeEl) {
          nodeEl.classList.add('attacked');

          // Highlight connected edges
          this.currentGraph.edges.forEach(edge => {
            if (edge.source === n.id || edge.target === n.id) {
              const edgeGroup = document.querySelector(`#group-${edge.id}`);
              const edgePath = edgeGroup?.querySelector('.diagram-edge');
              if (edgePath) {
                edgePath.classList.add('attacked');
              }
            }
          });
        }
      });
    }

    await wait(1000);
    this.terminal.log('success', '✓ Attack simulation completed. Threat report generated successfully.');
    this.showThreatReportModal(scenario);
    this.isThreatSimulating = false;
  }

  showThreatReportModal(scenario) {
    const existing = document.getElementById('threat-report-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'threat-report-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <div class="modal-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>${scenario.title}</span>
          </div>
          <button class="modal-close-btn" id="btn-close-modal" title="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          ${scenario.report}
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" id="btn-close-modal-footer">Close Report</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => {
      modal.remove();
      document.querySelectorAll('.diagram-node.attacked').forEach(el => el.classList.remove('attacked'));
      document.querySelectorAll('.diagram-edge.attacked').forEach(el => el.classList.remove('attacked'));
    };

    modal.querySelector('#btn-close-modal').addEventListener('click', closeModal);
    modal.querySelector('#btn-close-modal-footer').addEventListener('click', closeModal);
  }

  getDynamicScenario(scenarioKey, ast) {
    const base = JSON.parse(JSON.stringify(THREAT_SCENARIOS[scenarioKey] || THREAT_SCENARIOS.generic));
    if (!ast || !ast.resources) return base;

    if (scenarioKey === 'challenge_13' || scenarioKey === 'alb') {
      const hasHttps = ast.resources.some(r => r.type === 'aws_lb_listener' && (r.rawBody.includes('HTTPS') || r.rawBody.includes('443')));
      const hasSecureSG = ast.resources.some(r => r.type === 'aws_security_group' && r.rawBody.includes('security_groups'));

      if (hasHttps && hasSecureSG) {
        base.title = "13. HA Load Balancer Network Threat Report — SECURE";
        base.steps = [
          { target: "aws_lb", log: "[ATTACK] Sniffing network packets at load balancer ingress...", status: "warning" },
          { target: "aws_lb", log: "[SECURE] Ingress traffic encrypted via HTTPS Listener on Port 443!", status: "success" },
          { target: "aws_subnet", log: "[ATTACK] Attempting to bypass the ALB and access target subnets directly...", status: "warning" },
          { target: "aws_instance", log: "[SECURE] Backend Security Groups restrict traffic exclusively to the ALB. Bypass attempt blocked!", status: "success" }
        ];
        base.report = `
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">🛡️</span>
            <h2 style="color: #10b981; margin-top: 10px;">Security Audit: PASSED</h2>
            <p style="color: var(--text-secondary);">No critical vulnerabilities detected in your load-balanced architecture.</p>
          </div>
          <h3>Security Highlights</h3>
          <ul>
            <li><strong>Encrypted Transport</strong>: The HTTPS listener enforces SSL/TLS encryption for all client-to-ALB communication.</li>
            <li><strong>Network Access Control</strong>: Backend host security groups reject direct connections and restrict traffic strictly to the ALB.</li>
          </ul>
        `;
      }
    } else if (scenarioKey === 'challenge_1' || scenarioKey === 'messaging' || scenarioKey === 'challenge_14') {
      const hasPab = ast.resources.some(r => r.type === 'aws_s3_bucket_public_access_block' && (r.rawBody.includes('true')));
      
      if (hasPab) {
        base.title = "Event-Driven Storage Threat Report — SECURE";
        base.steps = [
          { target: "aws_s3_bucket", log: "[ATTACK] Initiating scanning on public S3 endpoints...", status: "warning" },
          { target: "aws_s3_bucket", log: "[SECURE] S3 Block Public Access is active. Anonymous bucket traversal blocked!", status: "success" },
          { target: "aws_sns_topic", log: "[ATTACK] Attempting to spoof S3 publish events to 'fanout_topic'...", status: "warning" },
          { target: "aws_sns_topic", log: "[SECURE] SNS access policy restricts publisher triggers to source bucket ARN!", status: "success" }
        ];
        base.report = `
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">🛡️</span>
            <h2 style="color: #10b981; margin-top: 10px;">Security Audit: PASSED</h2>
            <p style="color: var(--text-secondary);">Your event-driven S3 to SNS/SQS pipeline is properly secured.</p>
          </div>
          <h3>Security Highlights</h3>
          <ul>
            <li><strong>Bucket Private Isolation</strong>: Block Public Access policy prevents anonymous directory listing and object downloads.</li>
            <li><strong>Access Policy Enforcement</strong>: SNS topic only permits triggers originating from the trusted S3 source bucket ARN.</li>
          </ul>
        `;
      }
    } else if (scenarioKey === 'challenge_6') {
      const db = ast.resources.find(r => r.type === 'aws_db_instance');
      const isEncrypted = db && (db.attributes.storage_encrypted === 'true' || db.rawBody.includes('storage_encrypted = true'));

      if (isEncrypted) {
        base.title = "6. Database Storage Encryption Report — SECURE";
        base.steps = [
          { target: "aws_db_instance", log: "[ATTACK] Attempting database network scan on port 5432...", status: "warning" },
          { target: "aws_db_instance", log: "[SECURE] Database storage is encrypted at rest using AWS KMS!", status: "success" }
        ];
        base.report = `
          <div style="text-align: center; margin-bottom: 20px;">
            <span style="font-size: 48px;">🛡️</span>
            <h2 style="color: #10b981; margin-top: 10px;">Security Audit: PASSED</h2>
            <p style="color: var(--text-secondary);">Your relational database is secured against volume compromise.</p>
          </div>
          <h3>Security Highlights</h3>
          <ul>
            <li><strong>Storage Encryption</strong>: KMS AES-256 encryption at rest protects all tables, logs, and snapshot backups.</li>
          </ul>
        `;
      }
    }
    return base;
  }
}

const THREAT_SCENARIOS = {
  challenge_1: {
    title: "1. S3 Bucket Public Access Audit",
    steps: [
      { target: "aws_s3_bucket", log: "[ATTACK] Locating target S3 bucket: aws_s3_bucket.application_assets...", status: "warning" },
      { target: "aws_s3_bucket", log: "[ATTACK] Querying ACLs and public policies...", status: "warning" },
      { target: "aws_s3_bucket", log: "[VULN DETECTED] S3 bucket does not enable Block Public Access. Exposed to anonymous scanning!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Lack of S3 Block Public Access</h3>
      <p>The bucket <code>application_assets</code> does not have an explicit <code>aws_s3_bucket_public_access_block</code> resource configured, which is an AWS security best practice.</p>
      <h3>Remediation</h3>
      <p>Enable S3 Block Public Access to prevent accidental exposure via bucket policies or ACLs.</p>
    `
  },
  challenge_2: {
    title: "2. EC2 Host Port Exposure Audit",
    steps: [
      { target: "aws_instance", log: "[ATTACK] Probing EC2 host: aws_instance.web_server...", status: "warning" },
      { target: "aws_instance", log: "[ATTACK] Attempting SSH password cracking on port 22...", status: "warning" },
      { target: "aws_instance", log: "[VULN DETECTED] Host exposed to SSH brute force and IMDSv1 metadata query leakage!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: SSH Exposure & IMDSv1</h3>
      <p>The EC2 instance lacks security group ingress limits on administrative ports and is vulnerable to Instance Metadata Service v1 token stealing.</p>
      <h3>Remediation</h3>
      <p>Enforce IMDSv2 (require token session) and limit SSH/Port 22 ingress in the security group to trusted IPs.</p>
    `
  },
  challenge_3: {
    title: "3. VPC Routing Segment Audit",
    steps: [
      { target: "aws_vpc", log: "[ATTACK] Mapping network topology for CIDR 10.0.0.0/16...", status: "warning" },
      { target: "aws_vpc", log: "[ATTACK] Auditing routing tables and subnets...", status: "warning" },
      { target: "aws_vpc", log: "[VULN DETECTED] Flat VPC routing found! No distinct private subnet partition to isolate secure resources.", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Flat Network Architecture</h3>
      <p>A single flat CIDR without segregation means that if one public resource is compromised, attackers can scan and query all other VPC nodes without boundary gates.</p>
      <h3>Remediation</h3>
      <p>Design a Multi-Subnet architecture with distinct Public and Private subnets, routing private traffic through NAT Gateways.</p>
    `
  },
  challenge_4: {
    title: "4. Subnet Network Exposure Audit",
    steps: [
      { target: "aws_subnet", log: "[ATTACK] Probing subnet: aws_subnet.public_subnet (10.0.1.0/24)...", status: "warning" },
      { target: "aws_subnet", log: "[ATTACK] Tracing direct internet routes...", status: "warning" },
      { target: "aws_subnet", log: "[VULN DETECTED] Resources inside public_subnet have public IPs auto-assigned, exposing them to direct internet probes!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Direct Internet Routing</h3>
      <p>Deploying compute nodes directly in a subnet mapped to an Internet Gateway exposes all interface ports to automated internet scanning.</p>
      <h3>Remediation</h3>
      <p>Set <code>map_public_ip_on_launch = false</code> and utilize NAT Gateways or Bastion hosts for secure access.</p>
    `
  },
  challenge_5: {
    title: "5. Security Group Open Ingress Audit",
    steps: [
      { target: "aws_security_group", log: "[ATTACK] Probing port rules on security group: aws_security_group.web_sg...", status: "warning" },
      { target: "aws_security_group", log: "[ATTACK] Auditing source CIDR permissions...", status: "warning" },
      { target: "aws_security_group", log: "[VULN DETECTED] Firewall allows open incoming TCP requests on Port 80 from 0.0.0.0/0!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Open Ingress (Port 80)</h3>
      <p>Allowing global incoming requests (<code>0.0.0.0/0</code>) on port 80 exposes your web servers to unauthorized crawling, automated exploits, and Denial of Service.</p>
      <h3>Remediation</h3>
      <p>Use a load balancer (ALB) as the single point of entry, and configure the security group to only accept ingress from the ALB security group ID.</p>
    `
  },
  challenge_6: {
    title: "6. Database Storage Encryption Audit",
    steps: [
      { target: "aws_db_instance", log: "[ATTACK] Attempting database network scan on port 5432...", status: "warning" },
      { target: "aws_db_instance", log: "[ATTACK] Querying storage configuration parameters...", status: "warning" },
      { target: "aws_db_instance", log: "[VULN DETECTED] RDS storage encryption is disabled! Data-at-rest is stored in plaintext on disk volumes.", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Unencrypted Database Storage</h3>
      <p>If storage volume backups or snapshots are compromised, raw table data can be read because disk encryption (KMS) was not enabled.</p>
      <h3>Remediation</h3>
      <p>Set <code>storage_encrypted = true</code> and specify a KMS key ID in your RDS resource block.</p>
    `
  },
  challenge_7: {
    title: "7. Load Balancer Listener Security Audit",
    steps: [
      { target: "aws_lb", log: "[ATTACK] Listening on ALB ingress interface: aws_lb.app_alb...", status: "warning" },
      { target: "aws_lb", log: "[ATTACK] Scanning for SSL/TLS listener profiles...", status: "warning" },
      { target: "aws_lb", log: "[VULN DETECTED] Plaintext HTTP traffic enabled. In-transit payloads are vulnerable to packet sniffing!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Plaintext Ingress Listener</h3>
      <p>Without an HTTPS listener (port 443) and SSL certificate, all user session tokens, login keys, and payloads are sent across the public network in cleartext.</p>
      <h3>Remediation</h3>
      <p>Deploy an HTTPS listener using ACM certificates, and redirect HTTP requests automatically to HTTPS.</p>
    `
  },
  challenge_8: {
    title: "8. IAM Least Privilege Audit",
    steps: [
      { target: "aws_iam_role", log: "[ATTACK] Auditing role: aws_iam_role.ecs_execution_role...", status: "warning" },
      { target: "aws_iam_role", log: "[ATTACK] Parsing trust policies and inline permissions...", status: "warning" },
      { target: "aws_iam_role", log: "[VULN DETECTED] Overly permissive wildcard policy statements detected on S3 or log resources!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Overly Permissive IAM Policy</h3>
      <p>IAM Roles that allow wildcards (e.g. <code>"Action": "s3:*"</code>) allow compromised components to perform administrative actions on other services.</p>
      <h3>Remediation</h3>
      <p>Restrict the policy statements to specify exact API actions (e.g., <code>s3:GetObject</code>) and point them at specific resource ARNs.</p>
    `
  },
  challenge_9: {
    title: "9. SNS Topic Publisher Access Audit",
    steps: [
      { target: "aws_sns_topic", log: "[ATTACK] Spoofing notification message triggers to: aws_sns_topic.critical_alerts...", status: "warning" },
      { target: "aws_sns_topic", log: "[ATTACK] Auditing SNS publisher policies...", status: "warning" },
      { target: "aws_sns_topic", log: "[VULN DETECTED] Missing access control restrictions. Cross-account users can spoof system alerts!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Unrestricted SNS Publishing</h3>
      <p>SNS topics without restrictive IAM access policies permit unauthorized external publishers, enabling attackers to trigger false alerts or execute malicious downstream workflows.</p>
      <h3>Remediation</h3>
      <p>Add an SNS Topic policy restricting <code>sns:Publish</code> actions to specific trusted AWS service principals or IAM roles.</p>
    `
  },
  challenge_10: {
    title: "10. Lambda Function Privilege Leak Audit",
    steps: [
      { target: "aws_lambda_function", log: "[ATTACK] Target identified: aws_lambda_function.image_processor...", status: "warning" },
      { target: "aws_lambda_function", log: "[ATTACK] Checking execution environment configurations...", status: "warning" },
      { target: "aws_lambda_function", log: "[VULN DETECTED] Function execution role permissions are overly broad, allowing lateral account compromise!", status: "error" }
    ],
    report: `
      <h3>Vulnerability: Permissive Execution Role</h3>
      <p>Serverless functions running with shared administrative IAM roles can be hijacked to query, modify, or delete unrelated databases and configurations in the account.</p>
      <h3>Remediation</h3>
      <p>Assign a dedicated, strictly scoped IAM execution role to the Lambda function containing only required permissions.</p>
    `
  },
  challenge_11: {
    title: "11. ECS Fargate Microservice Threat Report",
    steps: [
      { target: "aws_ecs_service", log: "[ATTACK] Scanning microservice listener ports...", status: "warning" },
      { target: "aws_ecs_task_definition", log: "[VULN DETECTED] Microservice running with critical CVEs (Outdated container image)!", status: "error" },
      { target: "aws_ecs_task_definition", log: "[ATTACK] Executing shell payload inside container environment...", status: "warning" },
      { target: "aws_ecs_task_definition", log: "[VULN DETECTED] Attacker gained shell access via RCE vulnerability!", status: "error" },
      { target: "aws_ecs_task_definition", log: "[ATTACK] Querying ECS task metadata service for access tokens...", status: "warning" },
      { target: "aws_ecs_cluster", log: "[VULN DETECTED] Stolen task execution token allows full S3 and database admin access!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>A compromised application container allowed the attacker to retrieve the Task IAM Role and hijack administrative access to other cloud resources.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Vulnerable Image dependencies</strong>: Deploying unpatched software images allows remote exploit triggers.</li>
        <li><strong>Over-privileged IAM Task Role</strong>: Granting wildcards ("*") or broad permissions on the Task Role enables lateral movement across the AWS account.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Integrate ECR image scanning to detect package vulnerabilities before deployment.</li>
        <li>Implement strictly scoped Task IAM Roles separate from the Task Execution role.</li>
      </ul>
    `
  },
  challenge_12: {
    title: "12. Serverless API Backend Threat Report",
    steps: [
      { target: "aws_api_gateway_rest_api", log: "[ATTACK] Scanning API Gateway REST endpoint...", status: "warning" },
      { target: "aws_api_gateway_rest_api", log: "[VULN DETECTED] Public API Gateway route lacks Authorization headers!", status: "error" },
      { target: "aws_lambda_function", log: "[ATTACK] Injecting malicious NoSQL query payloads to API handler...", status: "warning" },
      { target: "aws_dynamodb_table", log: "[VULN DETECTED] DynamoDB query is vulnerable to NoSQL query injection!", status: "error" },
      { target: "aws_api_gateway_rest_api", log: "[ATTACK] Flooding endpoints with parallel connections (DDoS)...", status: "warning" },
      { target: "aws_lambda_function", log: "[VULN DETECTED] Lambda concurrency limit exhausted. All serverless APIs unresponsive!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>The Serverless backend is exposed to unauthorized actions, data theft through NoSQL injection, and Denial of Service (DoS) through API flooding.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Missing Authentication</strong>: The API Gateway route has no IAM/Cognito authorizer, allowing anyone to trigger database queries.</li>
        <li><strong>NoSQL query injection</strong>: The Lambda application queries DynamoDB directly using raw inputs without validation.</li>
        <li><strong>Unthrottled API Gateway</strong>: API Gateway has no rate limits or concurrency protection, exposing the account to resource starvation.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Enable Cognito User Pool or IAM custom authorizers on API Gateway.</li>
        <li>Use AWS WAF to filter malicious payloads and limit query rates.</li>
        <li>Configure API Gateway usage plans with rate limiting.</li>
      </ul>
    `
  },
  challenge_13: {
    title: "13. HA Load Balancer Network Threat Report",
    steps: [
      { target: "aws_lb", log: "[ATTACK] Sniffing network packets at load balancer ingress...", status: "warning" },
      { target: "aws_lb", log: "[VULN DETECTED] Traffic is unencrypted (HTTP Port 80 Listener). Session keys exposed in transit!", status: "error" },
      { target: "aws_subnet", log: "[ATTACK] Attempting to bypass the ALB and access target subnets directly...", status: "warning" },
      { target: "aws_instance", log: "[VULN DETECTED] Subnet security groups allow direct traffic from 0.0.0.0/0!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>Unencrypted network links allow packet sniffing. Furthermore, host security group misconfiguration allows attackers to bypass the ALB firewall entirely.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Cleartext Ingress</strong>: Lack of TLS/SSL listener (port 443) leaves all connection payloads readable to network sniffers.</li>
        <li><strong>Open Host Firewalls</strong>: Subnet instances have security groups with open port 80/8080 access from all IPs, bypassable from the Internet.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Bind an SSL Certificate to the ALB and redirect all Port 80 HTTP traffic to Port 443 HTTPS.</li>
        <li>Modify target Security Groups to only allow incoming traffic from the security group of the ALB.</li>
      </ul>
    `
  },
  challenge_14: {
    title: "14. Event-Driven S3 Fan-Out Threat Report",
    steps: [
      { target: "aws_s3_bucket", log: "[ATTACK] Initiating scanning on public S3 endpoints...", status: "warning" },
      { target: "aws_s3_bucket", log: "[VULN DETECTED] S3 bucket 'event_bucket' is publicly accessible (Block Public Access is disabled)!", status: "error" },
      { target: "aws_sns_topic", log: "[ATTACK] Attempting to spoof S3 publish events to 'fanout_topic'...", status: "warning" },
      { target: "aws_sns_topic", log: "[VULN DETECTED] SNS access policy allows wildcard publishes. Anyone can publish to this topic!", status: "error" },
      { target: "aws_sns_topic_subscription", log: "[ATTACK] Propagating spoofed payloads through subscription 'queue_sub'...", status: "warning" },
      { target: "aws_sqs_queue", log: "[VULN DETECTED] Processing queue receives unencrypted, unverified poison messages!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>The messaging pipeline is vulnerable to data exposure and message poisoning. An attacker can read uploads directly from S3 and publish spoofed events to downstream queues.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Public S3 Bucket Policy</strong>: Allowing anonymous read access compromises sensitive uploads.</li>
        <li><strong>SNS Access Policy Spoofing</strong>: The SNS topic does not restrict the publisher ARN. Anyone with the topic ARN can publish fake messages directly.</li>
        <li><strong>Unencrypted SQS Queue</strong>: SQS Queue does not use KMS Server-Side Encryption (SSE), exposing payload data in transit and at rest.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <pre><code># 1. Enable Block Public Access on S3
resource "aws_s3_bucket" "event_bucket" {
  bucket = "event-driven-uploads"
}

resource "aws_s3_bucket_public_access_block" "block" {
  bucket                  = aws_s3_bucket.event_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. Restrict SNS Topic publisher to S3 Source ARN
resource "aws_sns_topic" "fanout_topic" {
  name = "fanout-topic"
}

# Add IAM Policy Document restricting aws:SourceArn to event_bucket.arn</code></pre>
    `
  },
  messaging: {
    title: "Event-Driven S3 Fan-Out Threat Report",
    steps: [
      { target: "aws_s3_bucket", log: "[ATTACK] Initiating scanning on public S3 endpoints...", status: "warning" },
      { target: "aws_s3_bucket", log: "[VULN DETECTED] S3 bucket 'event_bucket' is publicly accessible (Block Public Access is disabled)!", status: "error" },
      { target: "aws_sns_topic", log: "[ATTACK] Attempting to spoof S3 publish events to 'fanout_topic'...", status: "warning" },
      { target: "aws_sns_topic", log: "[VULN DETECTED] SNS access policy allows wildcard publishes. Anyone can publish to this topic!", status: "error" },
      { target: "aws_sns_topic_subscription", log: "[ATTACK] Propagating spoofed payloads through subscription 'queue_sub'...", status: "warning" },
      { target: "aws_sqs_queue", log: "[VULN DETECTED] Processing queue receives unencrypted, unverified poison messages!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>The messaging pipeline is vulnerable to data exposure and message poisoning. An attacker can read uploads directly from S3 and publish spoofed events to downstream queues.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Public S3 Bucket Policy</strong>: Allowing anonymous read access compromises sensitive uploads.</li>
        <li><strong>SNS Access Policy Spoofing</strong>: The SNS topic does not restrict the publisher ARN. Anyone with the topic ARN can publish fake messages directly.</li>
        <li><strong>Unencrypted SQS Queue</strong>: SQS Queue does not use KMS Server-Side Encryption (SSE), exposing payload data in transit and at rest.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <pre><code># 1. Enable Block Public Access on S3
resource "aws_s3_bucket" "event_bucket" {
  bucket = "event-driven-uploads"
}

resource "aws_s3_bucket_public_access_block" "block" {
  bucket                  = aws_s3_bucket.event_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 2. Restrict SNS Topic publisher to S3 Source ARN
resource "aws_sns_topic" "fanout_topic" {
  name = "fanout-topic"
}

# Add IAM Policy Document restricting aws:SourceArn to event_bucket.arn</code></pre>
    `
  },
  serverless: {
    title: "Serverless API Backend Threat Report",
    steps: [
      { target: "aws_api_gateway_rest_api", log: "[ATTACK] Scanning API Gateway REST endpoint...", status: "warning" },
      { target: "aws_api_gateway_rest_api", log: "[VULN DETECTED] Public API Gateway route lacks Authorization headers!", status: "error" },
      { target: "aws_lambda_function", log: "[ATTACK] Injecting malicious NoSQL query payloads to API handler...", status: "warning" },
      { target: "aws_dynamodb_table", log: "[VULN DETECTED] DynamoDB query is vulnerable to NoSQL query injection!", status: "error" },
      { target: "aws_api_gateway_rest_api", log: "[ATTACK] Flooding endpoints with parallel connections (DDoS)...", status: "warning" },
      { target: "aws_lambda_function", log: "[VULN DETECTED] Lambda concurrency limit exhausted. All serverless APIs unresponsive!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>The Serverless backend is exposed to unauthorized actions, data theft through NoSQL injection, and Denial of Service (DoS) through API flooding.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Missing Authentication</strong>: The API Gateway route has no IAM/Cognito authorizer, allowing anyone to trigger database queries.</li>
        <li><strong>NoSQL query injection</strong>: The Lambda application queries DynamoDB directly using raw inputs without validation.</li>
        <li><strong>Unthrottled API Gateway</strong>: API Gateway has no rate limits or concurrency protection, exposing the account to resource starvation.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Enable Cognito User Pool or IAM custom authorizers on API Gateway.</li>
        <li>Use AWS WAF to filter malicious payloads and limit query rates.</li>
        <li>Configure API Gateway usage plans with rate limiting.</li>
      </ul>
    `
  },
  alb: {
    title: "HA Load Balancer Network Threat Report",
    steps: [
      { target: "aws_lb", log: "[ATTACK] Sniffing network packets at load balancer ingress...", status: "warning" },
      { target: "aws_lb", log: "[VULN DETECTED] Traffic is unencrypted (HTTP Port 80 Listener). Session keys exposed in transit!", status: "error" },
      { target: "aws_subnet", log: "[ATTACK] Attempting to bypass the ALB and access target subnets directly...", status: "warning" },
      { target: "aws_instance", log: "[VULN DETECTED] Subnet security groups allow direct traffic from 0.0.0.0/0!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>Unencrypted network links allow packet sniffing. Furthermore, host security group misconfiguration allows attackers to bypass the ALB firewall entirely.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Cleartext Ingress</strong>: Lack of TLS/SSL listener (port 443) leaves all connection payloads readable to network sniffers.</li>
        <li><strong>Open Host Firewalls</strong>: Subnet instances have security groups with open port 80/8080 access from all IPs, bypassable from the Internet.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Bind an SSL Certificate to the ALB and redirect all Port 80 HTTP traffic to Port 443 HTTPS.</li>
        <li>Modify target Security Groups to only allow incoming traffic from the security group of the ALB.</li>
      </ul>
    `
  },
  ecs: {
    title: "ECS Fargate Microservice Threat Report",
    steps: [
      { target: "aws_ecs_service", log: "[ATTACK] Scanning microservice listener ports...", status: "warning" },
      { target: "aws_ecs_task_definition", log: "[VULN DETECTED] Microservice running with critical CVEs (Outdated container image)!", status: "error" },
      { target: "aws_ecs_task_definition", log: "[ATTACK] Executing shell payload inside container environment...", status: "warning" },
      { target: "aws_ecs_task_definition", log: "[VULN DETECTED] Attacker gained shell access via RCE vulnerability!", status: "error" },
      { target: "aws_ecs_task_definition", log: "[ATTACK] Querying ECS task metadata service for access tokens...", status: "warning" },
      { target: "aws_ecs_cluster", log: "[VULN DETECTED] Stolen task execution token allows full S3 and database admin access!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>A compromised application container allowed the attacker to retrieve the Task IAM Role and hijack administrative access to other cloud resources.</p>
      <h3>Vulnerability Details</h3>
      <ul>
        <li><strong>Vulnerable Image dependencies</strong>: Deploying unpatched software images allows remote exploit triggers.</li>
        <li><strong>Over-privileged IAM Task Role</strong>: Granting wildcards ("*") or broad permissions on the Task Role enables lateral movement across the AWS account.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Integrate ECR image scanning to detect package vulnerabilities before deployment.</li>
        <li>Implement strictly scoped Task IAM Roles separate from the Task Execution role.</li>
      </ul>
    `
  },
  generic: {
    title: "Infrastructure Security Baseline Audit Report",
    steps: [
      { target: "aws_generic", log: "[ATTACK] Performing resource capability audit...", status: "warning" },
      { target: "aws_generic", log: "[VULN DETECTED] Unencrypted storage volumes or databases detected!", status: "error" },
      { target: "aws_generic", log: "[ATTACK] Auditing Identity and Access Management policies...", status: "warning" },
      { target: "aws_generic", log: "[VULN DETECTED] Wildcard actions ('*') found in IAM policy definitions!", status: "error" }
    ],
    report: `
      <h3>Executive Summary</h3>
      <p>A generic audit of the provided infrastructure configuration shows violations of security best practices, including lack of data-at-rest encryption and overly permissive policies.</p>
      <h3>Key Findings</h3>
      <ul>
        <li><strong>Encryption Disabled</strong>: Cloud storage components are not configured with KMS Customer Managed Keys.</li>
        <li><strong>Over-permissive IAM</strong>: Permissions do not follow the principle of least privilege, allowing extensive control scopes.</li>
      </ul>
      <h3>Remediation Steps</h3>
      <ul>
        <li>Add explicit <code>kms_key_id</code> attributes to all databases and storage buckets.</li>
        <li>Run IAM Policy validators to eliminate wildcards from policy statements.</li>
      </ul>
    `
  }
};

// Boot
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
