/**
 * Edge Renderer to compute connection lines (Bezier curves) and labels.
 */

/**
 * Calculates start and end attachment points for a link between two rects.
 * @param {object} s - Source node.
 * @param {object} t - Target node.
 * @returns {object} { x1, y1, x2, y2 }
 */
function getAttachmentPoints(s, t) {
  // Nodes are rectangles with x, y, width, height
  const sWidth = s.width || 140;
  const sHeight = s.height || 48;
  const tWidth = t.width || 140;
  const tHeight = t.height || 48;

  const sCenterX = s.x + sWidth / 2;
  const sCenterY = s.y + sHeight / 2;
  const tCenterX = t.x + tWidth / 2;
  const tCenterY = t.y + tHeight / 2;

  // Determine relative position
  const dx = tCenterX - sCenterX;
  const dy = tCenterY - sCenterY;

  let x1, y1, x2, y2;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Horizontal connection
    if (dx > 0) {
      // Target is to the right
      x1 = s.x + sWidth;
      y1 = sCenterY;
      x2 = t.x;
      y2 = tCenterY;
    } else {
      // Target is to the left
      x1 = s.x;
      y1 = sCenterY;
      x2 = t.x + tWidth;
      y2 = tCenterY;
    }
  } else {
    // Vertical connection
    if (dy > 0) {
      // Target is below
      x1 = sCenterX;
      y1 = s.y + sHeight;
      x2 = tCenterX;
      y2 = t.y;
    } else {
      // Target is above
      x1 = sCenterX;
      y1 = s.y;
      x2 = tCenterX;
      y2 = t.y + tHeight;
    }
  }

  return { x1, y1, x2, y2 };
}

/**
 * Renders an SVG edge/link.
 * @param {object} edge - Edge connection data.
 * @param {object} sourceNode - Source node data.
 * @param {object} targetNode - Target node data.
 * @returns {string} SVG HTML.
 */
export function renderEdge(edge, sourceNode, targetNode) {
  const { id, label, type } = edge;

  if (!sourceNode || !targetNode) return '';

  const { x1, y1, x2, y2 } = getAttachmentPoints(sourceNode, targetNode);

  // Compute Bezier control points for smooth S-curves
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  
  let pathD = '';
  if (dx > dy) {
    // Horizontal flow Bezier
    const ctrlX = x1 + (x2 - x1) * 0.5;
    pathD = `M ${x1} ${y1} C ${ctrlX} ${y1}, ${ctrlX} ${y2}, ${x2} ${y2}`;
  } else {
    // Vertical flow Bezier
    const ctrlY = y1 + (y2 - y1) * 0.5;
    pathD = `M ${x1} ${y1} C ${x1} ${ctrlY}, ${x2} ${ctrlY}, ${x2} ${y2}`;
  }

  // Styles based on connection type
  let stroke = 'var(--text-dim)';
  let dash = '';
  let flowColor = 'var(--accent-cyan)';
  let showFlow = true;

  if (type === 'pipeline_flow') {
    stroke = '#10b981'; // Green
    flowColor = '#34d399';
  } else if (type === 'deployment_target') {
    stroke = 'var(--accent-violet)';
    dash = 'stroke-dasharray="3 3"';
    flowColor = 'var(--accent-violet)';
  } else if (type === 'data_reference') {
    stroke = 'var(--text-muted)';
    dash = 'stroke-dasharray="2 2"';
    showFlow = false;
  }

  // Draw relationship label with staggered position along the curve to avoid overlap
  let displayLabel = label ? label : '';
  
  // Skip "requires" label on pipeline flows to reduce clutter
  if (type === 'pipeline_flow' && displayLabel === 'requires') {
    displayLabel = '';
  }

  let labelX = (x1 + x2) / 2;
  let labelY = (y1 + y2) / 2 - 6;

  if (displayLabel) {
    // Generate a deterministic stagger offset ratio between 0.35 and 0.65 based on edge ID
    let t = 0.5;
    if (id) {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      t = 0.35 + Math.abs(hash % 30) / 100;
    }
    
    // Position along Bezier
    labelX = x1 + (x2 - x1) * t;
    labelY = y1 + (y2 - y1) * t - 8;
  }

  // Return the main path, marker-end arrowhead, flow particle path, and text label
  return `
    <g class="diagram-edge-group" id="group-${id}">
      <!-- Background thick interactive path to make hovering easier -->
      <path d="${pathD}" fill="none" stroke="transparent" stroke-width="8" style="cursor: pointer;" />

      <!-- Visible connecting line -->
      <path class="diagram-edge edge-entering" id="${id}" d="${pathD}" 
            stroke="${stroke}" ${dash} fill="none" marker-end="url(#arrowhead)" />

      <!-- Flow animation particle (draw along same path) -->
      ${showFlow ? `
        <circle r="3" fill="${flowColor}" opacity="0.8" class="flow-particle">
          <animateMotion path="${pathD}" dur="3s" repeatCount="indefinite" rotate="auto" />
        </circle>
      ` : ''}

      <!-- Relationship Label -->
      ${displayLabel ? `
        <g transform="translate(${labelX}, ${labelY})">
          <!-- Text background shield -->
          <rect x="-${displayLabel.length * 3 + 4}" y="-8" width="${displayLabel.length * 6 + 8}" height="12" rx="3" 
                fill="var(--bg-secondary)" stroke="var(--border-subtle)" stroke-width="0.5" />
          <text class="edge-label" x="0" y="1" fill="var(--text-secondary)" font-size="8" 
                font-family="var(--font-mono)" text-anchor="middle">
            ${displayLabel}
          </text>
        </g>
      ` : ''}
    </g>
  `;
}
