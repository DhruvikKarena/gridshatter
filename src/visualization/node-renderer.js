import { AWS_ICONS } from '../icons/aws-icons.js';

/**
 * Renders an SVG representation of an AWS service or CircleCI Job node.
 * @param {object} node - Node data.
 * @returns {string} SVG HTML.
 */
export function renderNode(node) {
  const { id, name, sublabel, icon, category, width = 140, height = 48, isData } = node;

  // Select border and glow colors based on category
  let categoryColor = 'var(--border-strong)';
  let glowColor = 'rgba(148, 163, 184, 0.2)';

  if (category === 'compute') {
    categoryColor = 'var(--accent-amber)';
    glowColor = 'var(--accent-amber-dim)';
  } else if (category === 'containers') {
    categoryColor = 'var(--accent-cyan)';
    glowColor = 'var(--accent-cyan-dim)';
  } else if (category === 'storage') {
    categoryColor = 'var(--accent-violet)';
    glowColor = 'var(--accent-violet-dim)';
  } else if (category === 'database') {
    categoryColor = 'var(--accent-emerald)';
    glowColor = 'var(--accent-emerald-dim)';
  } else if (category === 'networking') {
    categoryColor = 'var(--accent-blue)';
    glowColor = 'var(--accent-blue-dim)';
  } else if (category === 'security') {
    categoryColor = 'var(--accent-rose)';
    glowColor = 'var(--accent-rose-dim)';
  } else if (category === 'messaging') {
    categoryColor = 'var(--accent-orange)';
    glowColor = 'rgba(249, 115, 22, 0.15)';
  } else if (category === 'pipeline') {
    categoryColor = '#10b981'; // CircleCI Green
    glowColor = 'rgba(16, 185, 129, 0.15)';
  }

  const svgIcon = AWS_ICONS[icon] || AWS_ICONS.generic;

  // Node background - glassmorphism look
  const fill = 'var(--bg-glass-light)';
  const stroke = categoryColor;

  // Truncate name if too long
  const displayVal = String(name || '');
  const displaySub = String(sublabel || '');
  const displayName = displayVal.length > 15 ? displayVal.substring(0, 13) + '..' : displayVal;
  const displaySublabel = displaySub.length > 20 ? displaySub.substring(0, 18) + '..' : displaySub;

  const dataDashedAttr = isData ? 'stroke-dasharray="3 3"' : '';

  return `
    <g class="diagram-node node-entering" id="${id}" data-id="${id}" transform="translate(${node.x}, ${node.y})">
      <!-- Glow filter background on hover -->
      <rect class="node-glow-bg" x="-2" y="-2" width="${width + 4}" height="${height + 4}" rx="8" fill="${glowColor}" opacity="0" style="transition: opacity 0.2s;" />
      
      <!-- Main body card -->
      <rect class="node-bg" x="0" y="0" width="${width}" height="${height}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${dataDashedAttr} />
      
      <!-- Icon Container (Offset left) -->
      <g class="node-icon" transform="translate(8, 9)" style="cursor: grab; pointer-events: all;">
        ${svgIcon}
      </g>
      
      <!-- Text Labels -->
      <text class="node-label" x="52" y="22" fill="var(--text-primary)" font-size="11" font-weight="600" text-anchor="start" font-family="var(--font-sans)">
        ${displayName}
      </text>
      
      <text class="node-sublabel" x="52" y="38" fill="var(--text-muted)" font-size="9" font-family="var(--font-mono)" text-anchor="start">
        ${displaySublabel}
      </text>
    </g>
  `;
}

/**
 * Renders an SVG boundary box (VPC, Subnet, or Pipeline block).
 * @param {object} group - Boundary group details.
 * @returns {string} SVG HTML.
 */
export function renderBoundaryGroup(group) {
  const { id, label, type, x, y, width, height } = group;

  let stroke = 'var(--border-default)';
  let fill = 'rgba(17, 24, 39, 0.2)';
  let strokeDash = '';
  let labelColor = 'var(--text-muted)';

  if (type === 'vpc') {
    stroke = 'var(--accent-blue)';
    fill = 'rgba(59, 130, 246, 0.03)';
    labelColor = 'var(--accent-blue)';
  } else if (type === 'subnet') {
    stroke = 'var(--accent-cyan)';
    strokeDash = 'stroke-dasharray="4 4"';
    fill = 'rgba(6, 182, 212, 0.02)';
    labelColor = 'var(--accent-cyan)';
  } else if (type === 'pipeline') {
    stroke = 'rgba(16, 185, 129, 0.3)';
    fill = 'rgba(16, 185, 129, 0.01)';
    labelColor = '#10b981';
  }

  return `
    <g class="boundary-group boundary-entering" id="${id}" transform="translate(${x}, ${y})">
      <!-- Border Box -->
      <rect x="0" y="0" width="${width}" height="${height}" rx="12" ry="12" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${strokeDash} />
      
      <!-- Label Header -->
      <text class="boundary-label" x="12" y="20" fill="${labelColor}" font-size="10" font-weight="700" font-family="var(--font-sans)" letter-spacing="0.05em">
        ${label}
      </text>
    </g>
  `;
}
