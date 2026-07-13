import { getServiceMetadata } from './service-registry.js';

/**
 * Maps CircleCI AST to a combined CI/CD pipeline & AWS deployment diagram.
 * @param {object} ast - Parsed CircleCI AST.
 * @returns {object} Diagram Graph Data.
 */
export function mapCircleCIToGraph(ast) {
  const nodes = [];
  const edges = [];
  const groups = [];

  // Group 1: CI/CD Pipeline
  const pipelineGroupId = 'group-pipeline';
  groups.push({
    id: pipelineGroupId,
    label: 'CircleCI Pipeline & Workflow',
    type: 'pipeline',
    children: []
  });

  // Group 2: AWS Deployment Target (if any deployments detected)
  const awsGroupId = 'group-aws-target';
  let hasAwsTarget = false;

  // Track map of job name to node ID
  const jobNodeMap = new Map();

  // 1. Process CircleCI Jobs as pipeline nodes
  ast.jobs.forEach(job => {
    const nodeId = `job-${job.name}`;
    jobNodeMap.set(job.name, nodeId);

    nodes.push({
      id: nodeId,
      name: job.name,
      sublabel: `CI/CD Job (${job.environment.split(':')[0]})`,
      type: 'circleci_job',
      icon: 'circleci_job',
      category: 'pipeline',
      steps: job.steps,
      line: job.line,
      parent: pipelineGroupId
    });

    groups[0].children.push(nodeId);
  });

  // 2. Add workflow edges (orchestration dependencies)
  ast.workflows.forEach(wf => {
    wf.jobs.forEach(jobItem => {
      const targetNodeId = jobNodeMap.get(jobItem.name);
      if (!targetNodeId) return;

      jobItem.requires.forEach(reqJobName => {
        const sourceNodeId = jobNodeMap.get(reqJobName);
        if (sourceNodeId) {
          edges.push({
            id: `wf-edge-${sourceNodeId}-${targetNodeId}`,
            source: sourceNodeId,
            target: targetNodeId,
            label: 'requires',
            type: 'pipeline_flow'
          });
        }
      });
    });
  });

  // 3. Scan jobs for deployment indicators to build target AWS infrastructure
  const deployedServices = new Map(); // Map of type-name -> { type, name, attributes, jobSource }

  ast.jobs.forEach(job => {
    const jobNodeId = jobNodeMap.get(job.name);
    
    // Check steps and commands for AWS CLI or Terraform keywords
    job.steps.forEach(step => {
      const cmd = (step.command || '').toLowerCase();
      const stepName = step.name.toLowerCase();

      // S3 upload/sync
      if (cmd.includes('s3 sync') || cmd.includes('s3 cp') || stepName.includes('s3')) {
        addDeployedService('aws_s3_bucket', 'deployment-bucket', {
          bucket: 'my-app-static-assets',
          acl: 'private'
        }, jobNodeId, 'Deploys static assets to S3');
      }

      // ECS Deploy
      if (cmd.includes('ecs update-service') || cmd.includes('ecs deploy') || stepName.includes('ecs')) {
        addDeployedService('aws_ecs_cluster', 'production-cluster', {
          name: 'production-cluster'
        }, jobNodeId, 'Triggers ECS Task deployment');
        
        addDeployedService('aws_ecs_service', 'web-service', {
          cluster: 'production-cluster',
          desired_count: 3
        }, jobNodeId, 'Updates ECS Task Container Service');
      }

      // Lambda update
      if (cmd.includes('lambda update-function-code') || stepName.includes('lambda')) {
        addDeployedService('aws_lambda_function', 'api-handler', {
          runtime: 'nodejs18.x',
          handler: 'index.handler'
        }, jobNodeId, 'Deploys zip package to Lambda');
      }

      // ECR Push
      if (cmd.includes('ecr get-login') || cmd.includes('docker push') || stepName.includes('ecr')) {
        addDeployedService('aws_ecr_repository', 'app-image-registry', {
          image_tag_mutability: 'MUTABLE'
        }, jobNodeId, 'Pushes built Docker image to ECR');
      }

      // EC2 deploy
      if (cmd.includes('ssh') && (cmd.includes('ubuntu') || cmd.includes('ec2-user'))) {
        addDeployedService('aws_instance', 'app-server', {
          instance_type: 't3.medium'
        }, jobNodeId, 'SSH Deploy to EC2 instance');
      }

      // Terraform deployments
      if (cmd.includes('terraform apply')) {
        addDeployedService('aws_api_gateway_rest_api', 'rest-api', {
          endpoint: 'regional'
        }, jobNodeId, 'Provisions API Gateway via Terraform');

        addDeployedService('aws_db_instance', 'main-database', {
          engine: 'postgres',
          instance_class: 'db.t4g.medium'
        }, jobNodeId, 'Provisions RDS instance via Terraform');
      }
    });

    // Also scan Orbs for deployment configurations
    ast.orbs.forEach(orb => {
      const orbRef = orb.ref.toLowerCase();
      if (orbRef.includes('aws-s3')) {
        addDeployedService('aws_s3_bucket', 's3-deploy-bucket', { bucket: 'assets-bucket' }, jobNodeId, 'S3 deployment orb');
      } else if (orbRef.includes('aws-ecs')) {
        addDeployedService('aws_ecs_cluster', 'ecs-deploy-cluster', {}, jobNodeId, 'ECS deployment orb');
      } else if (orbRef.includes('aws-ecr')) {
        addDeployedService('aws_ecr_repository', 'ecr-deploy-registry', {}, jobNodeId, 'ECR push orb');
      } else if (orbRef.includes('aws-lambda')) {
        addDeployedService('aws_lambda_function', 'lambda-deploy-func', {}, jobNodeId, 'Lambda deployment orb');
      }
    });
  });

  function addDeployedService(type, name, attributes, jobNodeId, label) {
    hasAwsTarget = true;
    const serviceKey = `${type}-${name}`;
    
    if (!deployedServices.has(serviceKey)) {
      deployedServices.set(serviceKey, {
        type,
        name,
        attributes,
        links: []
      });
    }
    
    // Add deployment link from Job to Service
    const service = deployedServices.get(serviceKey);
    if (!service.links.some(l => l.source === jobNodeId)) {
      service.links.push({
        source: jobNodeId,
        label
      });
    }
  }

  // If we have AWS targets, add the group and resources
  if (hasAwsTarget) {
    groups.push({
      id: awsGroupId,
      label: 'AWS Cloud Infrastructure (Deployment Target)',
      type: 'aws',
      children: []
    });

    deployedServices.forEach((service, serviceKey) => {
      const nodeId = `aws-${serviceKey}`;
      const meta = getServiceMetadata(service.type);

      nodes.push({
        id: nodeId,
        name: service.name,
        sublabel: service.type,
        type: service.type,
        icon: meta.icon,
        category: meta.category.id,
        attributes: service.attributes,
        line: 1, // Default to 1 since inferred
        parent: awsGroupId,
        isInferred: true
      });

      groups[1].children.push(nodeId);

      // Create edges from pipeline job to AWS service
      service.links.forEach(link => {
        edges.push({
          id: `deploy-edge-${link.source}-${nodeId}`,
          source: link.source,
          target: nodeId,
          label: link.label,
          type: 'deployment_target'
        });
      });
    });
  }

  return { nodes, edges, groups };
}
