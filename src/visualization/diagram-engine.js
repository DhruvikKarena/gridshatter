import { renderNode, renderBoundaryGroup } from './node-renderer.js';
import { renderEdge } from './edge-renderer.js';
import { injectGradientDefinitions } from '../icons/aws-icons.js';

export class DiagramEngine {
  constructor(svgElement, viewportElement) {
    this.svg = svgElement;
    this.viewport = viewportElement;
    this.scene = null;
    
    // State
    this.pan = { x: 0, y: 0 };
    this.scale = 1.0;
    this.isPanning = false;
    this.startPan = { x: 0, y: 0 };
    
    this.dragNode = null;
    this.dragOffset = { x: 0, y: 0 };
    this.selectedNodeId = null;
    
    // Graph data cache
    this.nodes = [];
    this.edges = [];
    
    this.init();
  }

  init() {
    // Clear and setup SVG base properties
    this.svg.innerHTML = '';
    injectGradientDefinitions(this.svg);

    // Create scene container group for zooming and panning
    this.scene = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.scene.setAttribute('id', 'scene-container');
    this.svg.appendChild(this.scene);

    // Grid pattern background
    const pattern = document.createElementNS('http://www.w3.org/2000/svg', 'pattern');
    pattern.setAttribute('id', 'grid-pattern');
    pattern.setAttribute('width', '40');
    pattern.setAttribute('height', '40');
    pattern.setAttribute('patternUnits', 'userSpaceOnUse');
    pattern.innerHTML = `
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.05)" stroke-width="1"/>
      <circle cx="0" cy="0" r="1" fill="rgba(148, 163, 184, 0.15)"/>
    `;
    this.svg.querySelector('defs').appendChild(pattern);

    // Add background grid rect (drawn first, behind zoom scene)
    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    grid.setAttribute('width', '100%');
    grid.setAttribute('height', '100%');
    grid.setAttribute('fill', 'url(#grid-pattern)');
    grid.setAttribute('class', 'diagram-grid');
    this.svg.insertBefore(grid, this.scene);

    // Event listeners for pan and zoom
    this.viewport.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.viewport.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    
    // Double click to zoom-to-fit
    this.viewport.addEventListener('dblclick', (e) => {
      if (e.target === this.viewport || e.target === grid || e.target === this.svg) {
        this.zoomToFit();
      }
    });

    // Tooltip event delegation
    this.scene.addEventListener('mouseover', this.showTooltip.bind(this));
    this.scene.addEventListener('mouseout', this.hideTooltip.bind(this));
  }

  // Draw nodes, edges and boundary groups
  draw(graph) {
    this.selectedNodeId = null;
    this.nodes = graph.nodes;
    this.edges = graph.edges;
    this.scene.innerHTML = '';

    // 1. Draw boundary groups (VPCs, subnets, pipelines)
    if (graph.groups) {
      graph.groups.forEach(g => {
        this.scene.innerHTML += renderBoundaryGroup(g);
      });
    }

    // 2. Draw connector edges
    graph.edges.forEach(edge => {
      const source = graph.nodes.find(n => n.id === edge.source);
      const target = graph.nodes.find(n => n.id === edge.target);
      if (source && target) {
        this.scene.innerHTML += renderEdge(edge, source, target);
      }
    });

    // 3. Draw nodes
    graph.nodes.forEach(node => {
      this.scene.innerHTML += renderNode(node);
    });

    // Reset view position nicely
    this.zoomToFit();
  }

  // Pan and Zoom logic
  updateTransform() {
    this.scene.setAttribute('transform', `translate(${this.pan.x}, ${this.pan.y}) scale(${this.scale})`);
  }

  onMouseDown(e) {
    // Left-click node check (click anywhere on the node)
    const nodeG = e.target.closest('.diagram-node');
    if (nodeG) {
      const nodeId = nodeG.dataset.id;
      
      // Update selected node class
      if (this.selectedNodeId !== nodeId) {
        if (this.selectedNodeId) {
          const prevSelected = this.scene.querySelector(`[data-id="${this.selectedNodeId}"]`);
          if (prevSelected) {
            prevSelected.classList.remove('selected');
          }
        }
        this.selectedNodeId = nodeId;
        nodeG.classList.add('selected');
      }

      this.dragNode = this.nodes.find(n => n.id === nodeId);
      if (this.dragNode) {
        e.stopPropagation();
        e.preventDefault();
        
        const rect = this.viewport.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - this.pan.x) / this.scale;
        const mouseY = (e.clientY - rect.top - this.pan.y) / this.scale;
        
        this.dragOffset.x = mouseX - this.dragNode.x;
        this.dragOffset.y = mouseY - this.dragNode.y;
        return;
      }
    } else {
      // Clicked on background, deselect
      if (this.selectedNodeId) {
        const prevSelected = this.scene.querySelector(`[data-id="${this.selectedNodeId}"]`);
        if (prevSelected) {
          prevSelected.classList.remove('selected');
        }
        this.selectedNodeId = null;
      }
    }

    // Left-click pan
    if (e.button === 0) {
      this.isPanning = true;
      this.viewport.classList.add('panning');
      this.startPan = { x: e.clientX - this.pan.x, y: e.clientY - this.pan.y };
    }
  }

  onMouseMove(e) {
    if (this.dragNode) {
      const rect = this.viewport.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - this.pan.x) / this.scale;
      const mouseY = (e.clientY - rect.top - this.pan.y) / this.scale;
      
      this.dragNode.x = mouseX - this.dragOffset.x;
      this.dragNode.y = mouseY - this.dragOffset.y;
      
      const nodeG = this.scene.querySelector(`[data-id="${this.dragNode.id}"]`);
      if (nodeG) {
        nodeG.setAttribute('transform', `translate(${this.dragNode.x}, ${this.dragNode.y})`);
      }
      
      // Update connected edges in real time
      this.edges.forEach(edge => {
        if (edge.source === this.dragNode.id || edge.target === this.dragNode.id) {
          const edgeGroup = this.scene.querySelector(`#group-${edge.id}`);
          if (edgeGroup) {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            if (source && target) {
              edgeGroup.outerHTML = renderEdge(edge, source, target);
            }
          }
        }
      });
      return;
    }

    if (this.isPanning) {
      this.pan.x = e.clientX - this.startPan.x;
      this.pan.y = e.clientY - this.startPan.y;
      this.updateTransform();
    }
  }

  onMouseUp() {
    if (this.dragNode) {
      this.dragNode = null;
      return;
    }

    if (this.isPanning) {
      this.isPanning = false;
      this.viewport.classList.remove('panning');
    }
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = 1.1;
    const oldScale = this.scale;
    
    // Zoom in or out
    if (e.deltaY < 0) {
      this.scale = Math.min(this.scale * zoomFactor, 3.0);
    } else {
      this.scale = Math.max(this.scale / zoomFactor, 0.2);
    }

    // Zoom centered on cursor position
    const rect = this.viewport.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    this.pan.x = cursorX - (cursorX - this.pan.x) * (this.scale / oldScale);
    this.pan.y = cursorY - (cursorY - this.pan.y) * (this.scale / oldScale);

    this.updateTransform();
  }

  onKeyDown(e) {
    if (!this.selectedNodeId) return;

    // Check if user is typing in a form input or editor
    const activeEl = document.activeElement;
    if (activeEl && (
      activeEl.tagName === 'INPUT' ||
      activeEl.tagName === 'TEXTAREA' ||
      activeEl.isContentEditable
    )) {
      return;
    }

    const key = e.key;
    let dx = 0;
    let dy = 0;
    const step = e.shiftKey ? 20 : 5; // Use Shift for larger jumps

    if (key === 'ArrowUp') {
      dy = -step;
    } else if (key === 'ArrowDown') {
      dy = step;
    } else if (key === 'ArrowLeft') {
      dx = -step;
    } else if (key === 'ArrowRight') {
      dx = step;
    } else {
      return; // Not an arrow key
    }

    // Prevent default scrolling behavior for arrow keys
    e.preventDefault();

    const node = this.nodes.find(n => n.id === this.selectedNodeId);
    if (node) {
      node.x += dx;
      node.y += dy;

      const nodeG = this.scene.querySelector(`[data-id="${node.id}"]`);
      if (nodeG) {
        nodeG.setAttribute('transform', `translate(${node.x}, ${node.y})`);
      }

      // Update connected edges in real time
      this.edges.forEach(edge => {
        if (edge.source === node.id || edge.target === node.id) {
          const edgeGroup = this.scene.querySelector(`#group-${edge.id}`);
          if (edgeGroup) {
            const source = this.nodes.find(n => n.id === edge.source);
            const target = this.nodes.find(n => n.id === edge.target);
            if (source && target) {
              edgeGroup.outerHTML = renderEdge(edge, source, target);
            }
          }
        }
      });
    }
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.2, 3.0);
    this.updateTransform();
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.2, 0.2);
    this.updateTransform();
  }

  zoomReset() {
    this.scale = 1.0;
    this.pan = { x: 0, y: 0 };
    this.updateTransform();
  }

  zoomToFit() {
    if (this.nodes.length === 0) return;

    // Compute bounding box of all nodes
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 140));
      maxY = Math.max(maxY, n.y + (n.height || 48));
    });

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    
    const viewportWidth = this.viewport.clientWidth;
    const viewportHeight = this.viewport.clientHeight;

    // Compute fit scale (with padding)
    const padding = 60;
    const scaleX = (viewportWidth - padding * 2) / graphWidth;
    const scaleY = (viewportHeight - padding * 2) / graphHeight;
    this.scale = Math.min(Math.min(scaleX, scaleY), 1.0); // Don't zoom past 100%

    // Compute centering offset
    this.pan.x = (viewportWidth - graphWidth * this.scale) / 2 - minX * this.scale;
    this.pan.y = (viewportHeight - graphHeight * this.scale) / 2 - minY * this.scale;

    this.updateTransform();
  }

  // Hover Tooltips
  showTooltip(e) {
    const nodeG = e.target.closest('.diagram-node');
    if (!nodeG) return;

    const nodeId = nodeG.dataset.id;
    const node = this.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Show hover outline highlight
    nodeG.querySelector('.node-glow-bg').style.opacity = '1';

    // Build tooltip element
    let tooltip = document.getElementById('diagram-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = 'diagram-tooltip';
      tooltip.className = 'diagram-tooltip';
      document.body.appendChild(tooltip);
    }

    let attrsHtml = '';
    if (node.attributes && Object.keys(node.attributes).length > 0) {
      attrsHtml = `<ul class="tooltip-props">`;
      Object.entries(node.attributes).forEach(([k, v]) => {
        if (typeof v === 'string' && v.length > 25) {
          v = v.substring(0, 22) + '...';
        }
        attrsHtml += `<li><span class="prop-key">${k}:</span> ${v}</li>`;
      });
      attrsHtml += `</ul>`;
    }

    tooltip.innerHTML = `
      <div class="tooltip-title">${node.name}</div>
      <div class="tooltip-type">${node.sublabel}</div>
      <div class="tooltip-detail">${node.isInferred ? 'Inferred from CircleCI configuration deployment commands.' : 'Provisioned AWS Infrastructure.'}</div>
      ${attrsHtml}
    `;

    // Position tooltip
    const rect = nodeG.getBoundingClientRect();
    tooltip.style.left = `${rect.left + window.scrollX + rect.width / 2 - tooltip.clientWidth / 2}px`;
    tooltip.style.top = `${rect.top + window.scrollY - tooltip.clientHeight - 10}px`;
  }

  hideTooltip(e) {
    const nodeG = e.target.closest('.diagram-node');
    if (nodeG) {
      nodeG.querySelector('.node-glow-bg').style.opacity = '0';
    }
    const tooltip = document.getElementById('diagram-tooltip');
    if (tooltip) {
      tooltip.remove();
    }
  }

  // Export functions
  exportSVG() {
    // Clone SVG to modify it for download
    const svgClone = this.svg.cloneNode(true);
    
    // Fit cloned SVG dimensions to content size
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 140));
      maxY = Math.max(maxY, n.y + (n.height || 48));
    });

    const padding = 40;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;

    svgClone.setAttribute('width', w);
    svgClone.setAttribute('height', h);
    svgClone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${w} ${h}`);
    
    // Remove grid and transform clone scene back to origin for direct rendering
    svgClone.querySelector('.diagram-grid')?.remove();
    const clonedScene = svgClone.querySelector('#scene-container');
    clonedScene.removeAttribute('transform');

    // Add inline styling sheet to guarantee colors are preserved outside website
    const styles = Array.from(document.styleSheets)
      .filter(s => s.href && (s.href.includes('index.css') || s.href.includes('diagram.css')))
      .map(s => {
        try {
          return Array.from(s.cssRules).map(r => r.cssText).join('\n');
        } catch { return ''; }
      }).join('\n');

    const styleTag = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleTag.textContent = styles;
    svgClone.insertBefore(styleTag, svgClone.firstChild);

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'cloud-architecture.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  exportPNG() {
    // Generate inline SVG
    const svgClone = this.svg.cloneNode(true);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    this.nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width || 140));
      maxY = Math.max(maxY, n.y + (n.height || 48));
    });

    const padding = 40;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;

    svgClone.setAttribute('width', w);
    svgClone.setAttribute('height', h);
    svgClone.setAttribute('viewBox', `${minX - padding} ${minY - padding} ${w} ${h}`);
    svgClone.querySelector('.diagram-grid')?.remove();
    svgClone.querySelector('#scene-container').removeAttribute('transform');

    // Embed inline styles
    const styles = `
      svg { background: #060a14; }
      text { font-family: 'Inter', sans-serif; fill: #f1f5f9; }
      .node-bg { fill: rgba(22, 32, 50, 0.8); }
      .node-label { font-size: 11px; fill: #f1f5f9; font-weight: 600; }
      .node-sublabel { font-size: 9px; fill: #94a3b8; }
      .boundary-group rect { fill: rgba(17, 24, 39, 0.4); stroke: rgba(148, 163, 184, 0.2); }
      .boundary-label { font-size: 10px; fill: #94a3b8; font-weight: 700; }
      .diagram-edge { stroke: #64748b; stroke-width: 1.5; fill: none; }
      .edge-label { font-size: 8px; fill: #94a3b8; }
    `;
    const styleTag = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleTag.textContent = styles;
    svgClone.insertBefore(styleTag, svgClone.firstChild);

    const svgString = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = w * 2; // High-resolution Retina export
      canvas.height = h * 2;
      const context = canvas.getContext('2d');
      context.scale(2, 2);
      
      // Draw background
      context.fillStyle = '#060a14';
      context.fillRect(0, 0, w, h);

      // Draw SVG onto canvas
      context.drawImage(image, 0, 0, w, h);

      const png = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = png;
      link.download = 'cloud-architecture.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  }
}
