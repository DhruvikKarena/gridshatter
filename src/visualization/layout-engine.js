/**
 * Layout Engine to compute node positions and boundary boxes.
 */

/**
 * Computes positions for CircleCI workflow nodes and deployment targets.
 * @param {object} graph - { nodes, edges, groups }
 * @returns {object} { nodes, edges, groups } with computed position attributes
 */
export function computePipelineLayout(graph) {
  const { nodes, edges, groups } = graph;

  // 1. Columnate pipeline jobs based on dependencies
  const pipelineNodes = nodes.filter(n => n.category === 'pipeline');
  const infraNodes = nodes.filter(n => n.category !== 'pipeline');

  // Find incoming edges count for pipeline nodes
  const indegree = {};
  pipelineNodes.forEach(n => { indegree[n.id] = 0; });
  
  edges.forEach(edge => {
    if (indegree[edge.target] !== undefined) {
      indegree[edge.target]++;
    }
  });

  // Assign columns
  const cols = {};
  let queue = pipelineNodes.filter(n => indegree[n.id] === 0).map(n => n.id);
  let nextQueue = [];
  let colIndex = 0;

  while (queue.length > 0) {
    queue.forEach(nodeId => {
      cols[nodeId] = colIndex;
      
      // Find downstream nodes
      const downstream = edges.filter(e => e.source === nodeId).map(e => e.target);
      downstream.forEach(targetId => {
        if (indegree[targetId] !== undefined) {
          indegree[targetId]--;
          if (indegree[targetId] <= 0) {
            nextQueue.push(targetId);
          }
        }
      });
    });

    queue = nextQueue;
    nextQueue = [];
    colIndex++;
  }

  // Any remaining cycles or unconnected nodes get colIndex
  pipelineNodes.forEach(n => {
    if (cols[n.id] === undefined) {
      cols[n.id] = colIndex;
    }
  });

  // Compute heights & coordinates for Pipeline Group
  const colSpacing = 280;
  const rowSpacing = 110;
  const startX = 60;
  const startY = 80;

  // Group nodes by column
  const colGroups = {};
  pipelineNodes.forEach(n => {
    const col = cols[n.id] || 0;
    if (!colGroups[col]) colGroups[col] = [];
    colGroups[col].push(n);
  });

  let maxPipelineHeight = 0;
  Object.entries(colGroups).forEach(([col, nodesList]) => {
    const colX = startX + parseInt(col) * colSpacing;
    nodesList.forEach((n, idx) => {
      n.x = colX;
      n.y = startY + idx * rowSpacing;
      n.width = 160;
      n.height = 54;
    });
    const colHeight = nodesList.length * rowSpacing;
    if (colHeight > maxPipelineHeight) maxPipelineHeight = colHeight;
  });

  const pipelineWidth = (Object.keys(colGroups).length) * colSpacing + 40;
  
  // Set Pipeline container boundary size
  const pipelineGroup = groups.find(g => g.id === 'group-pipeline');
  if (pipelineGroup) {
    pipelineGroup.x = 20;
    pipelineGroup.y = 20;
    pipelineGroup.width = Math.max(pipelineWidth, 180);
    pipelineGroup.height = maxPipelineHeight + 100;
  }

  // 2. Position AWS target nodes
  const awsStartX = (pipelineGroup ? pipelineGroup.x + pipelineGroup.width : 20) + 200;
  const awsStartY = 80;
  
  if (infraNodes.length > 0) {
    // Arrange infra nodes in a simple grid
    const colsCount = 2;
    const cellWidth = 240;
    const cellHeight = 115;
    
    infraNodes.forEach((n, idx) => {
      const col = idx % colsCount;
      const row = Math.floor(idx / colsCount);
      n.x = awsStartX + col * cellWidth;
      n.y = awsStartY + row * cellHeight;
      n.width = 160;
      n.height = 54;
    });

    const awsGroup = groups.find(g => g.id === 'group-aws-target');
    if (awsGroup) {
      awsGroup.x = awsStartX - 30;
      awsGroup.y = 20;
      awsGroup.width = colsCount * cellWidth + 60;
      const rowsCount = Math.ceil(infraNodes.length / colsCount);
      awsGroup.height = rowsCount * cellHeight + 100;
    }
  }

  return { nodes, edges, groups };
}

/**
 * Computes positions for Terraform HCL components (VPC, Subnets, Resources).
 * @param {object} graph - { nodes, edges, groups }
 * @returns {object} { nodes, edges, groups } with computed position attributes
 */
export function computeTerraformLayout(graph) {
  const { nodes, edges, groups } = graph;

  const vpcs = groups.filter(g => g.type === 'vpc');
  const subnets = groups.filter(g => g.type === 'subnet');
  
  let currentY = 40;
  const vpcWidth = 720;
  const marginX = 40;

  // 1. Process VPC boundaries & Subnets inside them
  vpcs.forEach(vpc => {
    vpc.x = marginX;
    vpc.y = currentY;
    
    // Find all subnets inside this VPC
    const vpcSubnets = subnets.filter(s => s.parent === vpc.id);
    const vpcOnlyNodes = nodes.filter(n => n.parent === vpc.id && !n.isGroup);

    let innerX = vpc.x + 30;
    let innerY = vpc.y + 40;
    let maxSubnetHeight = 0;

    // Arrange subnets horizontally inside the VPC
    vpcSubnets.forEach((subnet, idx) => {
      subnet.x = innerX + idx * 270;
      subnet.y = innerY;
      subnet.width = 240;

      // Position nodes inside this subnet vertically
      const subnetNodes = nodes.filter(n => n.parent === subnet.id);
      let nodeY = subnet.y + 50;
      subnetNodes.forEach(node => {
        node.x = subnet.x + 40;
        node.y = nodeY;
        node.width = 160;
        node.height = 54;
        nodeY += 85;
      });

      subnet.height = Math.max(nodeY - subnet.y + 20, 100);
      if (subnet.height > maxSubnetHeight) {
        maxSubnetHeight = subnet.height;
      }
    });

    // Position nodes that belong directly to the VPC but not in subnets (e.g. ALB, Security Groups)
    let vpcNodeX = innerX + vpcSubnets.length * 270;
    let vpcNodeY = innerY;
    vpcOnlyNodes.forEach(node => {
      node.x = vpcNodeX;
      node.y = vpcNodeY;
      node.width = 160;
      node.height = 54;
      vpcNodeY += 85;
    });

    const vpcNodesHeight = vpcNodeY - innerY;
    const contentHeight = Math.max(maxSubnetHeight, vpcNodesHeight, 80);
    vpc.width = vpcWidth;
    vpc.height = contentHeight + 60;

    currentY += vpc.height + 40;
  });

  // 2. Position global nodes (e.g. S3 buckets, Route 53, CloudFront)
  const globalNodes = nodes.filter(n => !n.parent && !n.isGroup);
  
  if (globalNodes.length > 0) {
    // Left side for inbound gateways (Route 53, API Gateway, CloudFront)
    // Right side for storage / shared resources (S3, ECR)
    const inboundTypes = ['aws_route53_zone', 'aws_route53_record', 'aws_cloudfront_distribution', 'aws_api_gateway_rest_api', 'aws_lb', 'aws_alb'];
    
    const leftNodes = globalNodes.filter(n => inboundTypes.includes(n.type));
    const rightNodes = globalNodes.filter(n => !inboundTypes.includes(n.type));

    // Layout left nodes
    let leftY = 40;
    leftNodes.forEach(node => {
      node.x = 20;
      node.y = leftY;
      node.width = 160;
      node.height = 54;
      leftY += 90;
    });

    // Layout right nodes
    let rightY = 40;
    rightNodes.forEach(node => {
      node.x = marginX + vpcWidth + 40;
      node.y = rightY;
      node.width = 160;
      node.height = 54;
      rightY += 90;
    });

    // Adjust VPC group alignment to give room for left global nodes
    if (leftNodes.length > 0) {
      const shiftX = 220;
      vpcs.forEach(vpc => { vpc.x += shiftX; });
      subnets.forEach(sub => { sub.x += shiftX; });
      nodes.forEach(n => {
        if (n.parent || n.isGroup) {
          n.x += shiftX;
        }
      });
      // Also shift right nodes
      rightNodes.forEach(node => {
        node.x += shiftX;
      });
    }
  }

  return { nodes, edges, groups };
}
