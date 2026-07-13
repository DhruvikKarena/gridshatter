/**
 * SVG Icons for AWS Cloud Services and CircleCI elements.
 * Returns standard inline SVG strings with color properties.
 */

export const AWS_ICONS = {
  circleci_job: `
    <rect width="36" height="36" rx="8" fill="#34353a" stroke="#10b981" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="8" fill="none" stroke="#10b981" stroke-width="3"/>
    <path d="M18 10C22.4 10 26 13.6 26 18C26 22.4 22.4 26 18 26" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/>
  `,
  
  ec2: `
    <rect width="36" height="36" rx="8" fill="url(#grad-compute)"/>
    <rect x="10" y="10" width="16" height="16" rx="2" fill="none" stroke="white" stroke-width="2"/>
    <path d="M6 14H10M6 18H10M6 22H10M26 14H30M26 18H30M26 22H30M14 6V10M18 6V10M22 6V10M14 26V30M18 26V30M22 26V30" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,

  lambda: `
    <rect width="36" height="36" rx="8" fill="url(#grad-compute)"/>
    <path d="M11 25L17 11H19L25 25" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M15 19H21" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <circle cx="11" cy="25" r="2" fill="white"/>
    <circle cx="25" cy="25" r="2" fill="white"/>
  `,

  ecs: `
    <rect width="36" height="36" rx="8" fill="url(#grad-containers)"/>
    <rect x="11" y="11" width="14" height="14" rx="1" fill="none" stroke="white" stroke-width="2"/>
    <path d="M7 18H11M25 18H29M18 7V11M18 25V29" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="15" y="15" width="6" height="6" fill="white" opacity="0.7"/>
  `,

  eks: `
    <rect width="36" height="36" rx="8" fill="url(#grad-containers)"/>
    <circle cx="18" cy="18" r="8" fill="none" stroke="white" stroke-width="2"/>
    <path d="M18 10V26M10 18H26" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <polygon points="18,14 14,18 18,22 22,18" fill="white" opacity="0.6"/>
  `,

  ecr: `
    <rect width="36" height="36" rx="8" fill="url(#grad-containers)"/>
    <path d="M10 12H26V26H10V12Z" fill="none" stroke="white" stroke-width="2"/>
    <path d="M14 12V26M22 12V26M10 16H26M10 22H26" stroke="white" stroke-width="1" stroke-linecap="round"/>
  `,

  s3: `
    <rect width="36" height="36" rx="8" fill="url(#grad-storage)"/>
    <path d="M10 12L18 8L26 12L18 16L10 12Z" fill="none" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M10 17L18 21L26 17" stroke="white" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
    <path d="M10 22L18 26L26 22" stroke="white" stroke-width="1.5" fill="none" stroke-linejoin="round"/>
    <path d="M10 12V22M26 12V22M18 16V26" stroke="white" stroke-width="1" stroke-dasharray="1 1" opacity="0.7"/>
  `,

  rds: `
    <rect width="36" height="36" rx="8" fill="url(#grad-database)"/>
    <ellipse cx="18" cy="12" rx="8" ry="3" fill="none" stroke="white" stroke-width="2"/>
    <path d="M10 12V18C10 19.66 13.58 21 18 21C22.42 21 26 19.66 26 18V12" stroke="white" stroke-width="2" fill="none"/>
    <path d="M10 18V24C10 25.66 13.58 27 18 27C22.42 27 26 25.66 26 24V18" stroke="white" stroke-width="2" fill="none"/>
  `,

  dynamodb: `
    <rect width="36" height="36" rx="8" fill="url(#grad-database)"/>
    <polygon points="18,8 28,13 18,18 8,13" fill="none" stroke="white" stroke-width="1.5"/>
    <polygon points="18,14 28,19 18,24 8,19" fill="none" stroke="white" stroke-width="1.5"/>
    <polygon points="18,20 28,25 18,30 8,25" fill="none" stroke="white" stroke-width="1.5"/>
    <line x1="8" y1="13" x2="8" y2="25" stroke="white" stroke-width="1.5"/>
    <line x1="28" y1="13" x2="28" y2="25" stroke="white" stroke-width="1.5"/>
    <line x1="18" y1="18" x2="18" y2="30" stroke="white" stroke-width="1.5" opacity="0.6"/>
  `,

  elasticache: `
    <rect width="36" height="36" rx="8" fill="url(#grad-database)"/>
    <rect x="10" y="10" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="1.5"/>
    <rect x="10" y="20" width="16" height="6" rx="1" fill="none" stroke="white" stroke-width="1.5"/>
    <path d="M14 16V20M22 16V20" stroke="white" stroke-width="1.5"/>
  `,

  vpc: `
    <rect width="36" height="36" rx="8" fill="none" stroke="url(#grad-networking)" stroke-width="2"/>
    <circle cx="18" cy="18" r="8" fill="none" stroke="url(#grad-networking)" stroke-width="1.5" stroke-dasharray="2 2"/>
    <path d="M12 12L24 24M24 12L12 24" stroke="url(#grad-networking)" stroke-width="1" opacity="0.4"/>
  `,

  subnet: `
    <rect width="36" height="36" rx="8" fill="none" stroke="url(#grad-networking)" stroke-width="1.5" stroke-dasharray="3 3"/>
    <rect x="8" y="8" width="8" height="8" rx="1" fill="none" stroke="url(#grad-networking)" stroke-width="1.5"/>
    <rect x="20" y="20" width="8" height="8" rx="1" fill="none" stroke="url(#grad-networking)" stroke-width="1.5"/>
    <line x1="16" y1="12" x2="20" y2="24" stroke="url(#grad-networking)" stroke-width="1" opacity="0.6"/>
  `,

  security_group: `
    <rect width="36" height="36" rx="8" fill="url(#grad-security)"/>
    <path d="M18 10L26 13V19C26 23.5 22.5 26.5 18 28C13.5 26.5 10 23.5 10 19V13L18 10Z" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>
    <path d="M14 18H22" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,

  alb: `
    <rect width="36" height="36" rx="8" fill="url(#grad-networking)"/>
    <circle cx="18" cy="18" r="4" fill="white"/>
    <path d="M10 18H14M22 18H26" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <path d="M18 10V14M18 22V26" stroke="white" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 12L15 15M24 24L21 21M24 12L21 15M12 24L15 21" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,

  route53: `
    <rect width="36" height="36" rx="8" fill="url(#grad-networking)"/>
    <circle cx="18" cy="18" r="8" fill="none" stroke="white" stroke-width="1.5"/>
    <path d="M18 10C16 13 16 23 18 26M18 10C20 13 20 23 18 26M10 18H26" stroke="white" stroke-width="1.5" opacity="0.8"/>
  `,

  cloudfront: `
    <rect width="36" height="36" rx="8" fill="url(#grad-networking)"/>
    <circle cx="18" cy="18" r="9" fill="none" stroke="white" stroke-width="2"/>
    <path d="M18 6V11M18 25V30M6 18H11M25 18H30" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="18" cy="18" r="3" fill="white"/>
  `,

  apigateway: `
    <rect width="36" height="36" rx="8" fill="url(#grad-networking)"/>
    <polygon points="18,10 26,18 18,26 10,18" fill="none" stroke="white" stroke-width="2"/>
    <line x1="18" y1="10" x2="18" y2="26" stroke="white" stroke-width="1"/>
    <line x1="10" y1="18" x2="26" y2="18" stroke="white" stroke-width="1"/>
    <circle cx="18" cy="18" r="2" fill="white"/>
  `,

  iam: `
    <rect width="36" height="36" rx="8" fill="url(#grad-security)"/>
    <circle cx="18" cy="14" r="4" fill="none" stroke="white" stroke-width="2"/>
    <path d="M10 26C10 22 14 21 18 21C22 21 26 22 26 26" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
    <rect x="16" y="22" width="4" height="5" fill="white"/>
  `,

  secrets: `
    <rect width="36" height="36" rx="8" fill="url(#grad-security)"/>
    <rect x="11" y="17" width="14" height="10" rx="1" fill="none" stroke="white" stroke-width="2"/>
    <path d="M14 17V13C14 10.79 15.79 9 18 9C20.21 9 22 10.79 22 13V17" stroke="white" stroke-width="2" fill="none"/>
    <circle cx="18" cy="22" r="1.5" fill="white"/>
  `,

  sns: `
    <rect width="36" height="36" rx="8" fill="url(#grad-messaging)"/>
    <circle cx="18" cy="18" r="8" fill="none" stroke="white" stroke-width="2"/>
    <circle cx="18" cy="18" r="2" fill="white"/>
    <path d="M18 10V14M18 22V26M10 18H14M22 18H26" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
  `,

  sqs: `
    <rect width="36" height="36" rx="8" fill="url(#grad-messaging)"/>
    <rect x="9" y="13" width="18" height="10" rx="1" fill="none" stroke="white" stroke-width="2"/>
    <path d="M13 13V23M23 13V23M9 18H27" stroke="white" stroke-width="1.5"/>
  `,

  cloudwatch: `
    <rect width="36" height="36" rx="8" fill="url(#grad-management)"/>
    <path d="M10 26V20L15 15L20 20L26 12V26H10Z" fill="none" stroke="white" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="26" cy="12" r="2" fill="white"/>
  `,

  aws_generic: `
    <rect width="36" height="36" rx="8" fill="url(#grad-compute)"/>
    <polygon points="18,8 28,14 28,26 18,32 8,26 8,14" fill="none" stroke="white" stroke-width="2"/>
    <circle cx="18" cy="20" r="4" fill="white"/>
  `,

  generic: `
    <rect width="36" height="36" rx="8" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
    <rect x="11" y="11" width="14" height="14" rx="2" fill="none" stroke="white" stroke-width="1.5"/>
    <path d="M14 18H22" stroke="white" stroke-width="1.5"/>
  `
};

/**
 * Appends standard gradient definitions to the target SVG element.
 * These are referenced by the fill="url(#grad-...)" properties above.
 * @param {SVGElement} svgElement - Target SVG.
 */
export function injectGradientDefinitions(svgElement) {
  // Check if defs already exist
  let defs = svgElement.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgElement.appendChild(defs);
  }

  // Define gradients
  defs.innerHTML += `
    <linearGradient id="grad-compute" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="#f97316"/>
    </linearGradient>
    <linearGradient id="grad-containers" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="grad-storage" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#65a30d"/>
      <stop offset="100%" stop-color="#84cc16"/>
    </linearGradient>
    <linearGradient id="grad-database" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
    <linearGradient id="grad-networking" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7c3aed"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="grad-security" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dc2626"/>
      <stop offset="100%" stop-color="#ef4444"/>
    </linearGradient>
    <linearGradient id="grad-messaging" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
    <linearGradient id="grad-management" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4b5563"/>
      <stop offset="100%" stop-color="#6b7280"/>
    </linearGradient>
    
    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>

    <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="6" refY="3" orient="auto">
      <polygon points="0 0, 8 3, 0 6" fill="var(--text-muted)"/>
    </marker>
  `;
}
