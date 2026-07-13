import { getServiceMetadata } from './service-registry.js';

/**
 * Maps HCL AST to a standard graph representation (nodes, edges, groups).
 * @param {object} ast - Parsed HCL AST.
 * @returns {object} Diagram Graph Data.
 */
export function mapTerraformToGraph(ast) {
  const nodes = [];
  const edges = [];
  const groups = [];

  // 1. Identify VPCs and Subnets (Containers/Groups)
  const vpcResources = ast.resources.filter(r => r.type === 'aws_vpc');
  const subnetResources = ast.resources.filter(r => r.type === 'aws_subnet');
  const regularResources = ast.resources.filter(r => r.type !== 'aws_vpc' && r.type !== 'aws_subnet');

  // Keep map of ID in code (e.g. "aws_vpc.main") to Node ID for linking
  const resourceIdMap = new Map();

  // Create VPC Groups
  vpcResources.forEach(vpc => {
    const vpcId = `vpc-${vpc.name}`;
    resourceIdMap.set(`aws_vpc.${vpc.name}`, vpcId);
    
    // VPC boundary is handled via groups, no need to push to nodes array

    groups.push({
      id: vpcId,
      label: `VPC: ${vpc.name} (${vpc.attributes.cidr_block || '10.0.0.0/16'})`,
      type: 'vpc',
      children: []
    });
  });

  // Create Subnet Groups (Nested in VPC if reference is found)
  subnetResources.forEach(subnet => {
    const subnetId = `subnet-${subnet.name}`;
    resourceIdMap.set(`aws_subnet.${subnet.name}`, subnetId);

    // Find parent VPC
    let parentVpcId = null;
    const vpcRef = subnet.attributes.vpc_id;
    if (vpcRef) {
      // Find which VPC this matches
      const vpcMatch = vpcRef.match(/aws_vpc\.([a-zA-Z0-9_\-]+)/);
      if (vpcMatch) {
        parentVpcId = `vpc-${vpcMatch[1]}`;
      }
    }

    // Subnet boundary is handled via groups, no need to push to nodes array

    const label = `Subnet: ${subnet.name} (${subnet.attributes.cidr_block || ''})`;
    groups.push({
      id: subnetId,
      label,
      type: 'subnet',
      parent: parentVpcId,
      children: []
    });

    // If parent VPC exists, add to children
    if (parentVpcId) {
      const parentGroup = groups.find(g => g.id === parentVpcId);
      if (parentGroup) {
        parentGroup.children.push(subnetId);
      }
    }
  });

  // Add Regular Service Nodes
  regularResources.forEach(res => {
    const nodeId = `${res.type}-${res.name}`;
    resourceIdMap.set(`${res.type}.${res.name}`, nodeId);

    const meta = getServiceMetadata(res.type);

    // Determine parent placement (VPC, Subnet, or Root)
    let parentId = null;
    
    // Check subnet reference
    if (res.attributes.subnet_id) {
      const subMatch = res.attributes.subnet_id.match(/aws_subnet\.([a-zA-Z0-9_\-]+)/);
      if (subMatch) {
        parentId = `subnet-${subMatch[1]}`;
      }
    } else if (res.attributes.subnet_ids) {
      // Check multiple subnet references, use the first one
      const subMatch = res.attributes.subnet_ids.match(/aws_subnet\.([a-zA-Z0-9_\-]+)/);
      if (subMatch) {
        parentId = `subnet-${subMatch[1]}`;
      }
    }
    
    // Check direct VPC reference if no subnet reference
    if (!parentId && res.attributes.vpc_id) {
      const vpcMatch = res.attributes.vpc_id.match(/aws_vpc\.([a-zA-Z0-9_\-]+)/);
      if (vpcMatch) {
        parentId = `vpc-${vpcMatch[1]}`;
      }
    }

    nodes.push({
      id: nodeId,
      name: res.name,
      sublabel: res.type,
      type: res.type,
      icon: meta.icon,
      category: meta.category.id,
      attributes: res.attributes,
      line: res.line,
      parent: parentId
    });

    // Add to group children if needed
    if (parentId) {
      const parentGroup = groups.find(g => g.id === parentId);
      if (parentGroup) {
        parentGroup.children.push(nodeId);
      }
    }
  });

  // 2. Identify Edges / Links (Relationships)
  ast.resources.forEach(res => {
    const sourceNodeId = resourceIdMap.get(`${res.type}.${res.name}`);
    if (!sourceNodeId) return;

    Object.entries(res.attributes).forEach(([attrKey, attrVal]) => {
      // Scan for resource references like "aws_s3_bucket.bucket.id"
      const refMatches = attrVal.match(/(aws_[a-zA-Z0-9_]+)\.([a-zA-Z0-9_\-]+)/g);
      if (refMatches) {
        refMatches.forEach(ref => {
          // Remove attribute accessors (like .id, .arn)
          const refClean = ref.split('.').slice(0, 2).join('.');
          const targetNodeId = resourceIdMap.get(refClean);
          
          if (targetNodeId && sourceNodeId !== targetNodeId) {
            // Prevent drawing links to containment groups (VPCs/Subnets)
            if (targetNodeId.startsWith('vpc-') || targetNodeId.startsWith('subnet-')) {
              return;
            }

            // Avoid duplicate links
            const exists = edges.some(e => 
              (e.source === sourceNodeId && e.target === targetNodeId) ||
              (e.source === targetNodeId && e.target === sourceNodeId)
            );
            
            if (!exists) {
              edges.push({
                id: `edge-${sourceNodeId}-${targetNodeId}`,
                source: sourceNodeId,
                target: targetNodeId,
                label: attrKey, // Relationship context
                type: 'dependency'
              });
            }
          }
        });
      }
    });
  });

  // Process data sources as external references
  ast.dataSources.forEach(ds => {
    const dsId = `data-${ds.type}-${ds.name}`;
    resourceIdMap.set(`data.${ds.type}.${ds.name}`, dsId);

    const meta = getServiceMetadata(ds.type);

    nodes.push({
      id: dsId,
      name: ds.name,
      sublabel: `data.${ds.type}`,
      type: ds.type,
      icon: meta.icon,
      category: meta.category.id,
      attributes: ds.attributes,
      line: ds.line,
      isData: true
    });
  });

  // Link resources to data sources if they reference them
  ast.resources.forEach(res => {
    const sourceNodeId = resourceIdMap.get(`${res.type}.${res.name}`);
    if (!sourceNodeId) return;

    Object.entries(res.attributes).forEach(([attrKey, attrVal]) => {
      const dataMatches = attrVal.match(/data\.(aws_[a-zA-Z0-9_]+)\.([a-zA-Z0-9_\-]+)/g);
      if (dataMatches) {
        dataMatches.forEach(match => {
          const dsId = resourceIdMap.get(match);
          if (dsId) {
            edges.push({
              id: `edge-${sourceNodeId}-${dsId}`,
              source: sourceNodeId,
              target: dsId,
              label: attrKey,
              type: 'data_reference'
            });
          }
        });
      }
    });
  });

  return { nodes, edges, groups };
}
