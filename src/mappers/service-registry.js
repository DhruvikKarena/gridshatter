/**
 * AWS Service Registry for Mapping and Visualization.
 */

export const SERVICE_CATEGORIES = {
  COMPUTE: { id: 'compute', label: 'Compute', color: 'var(--accent-amber)', dimColor: 'var(--accent-amber-dim)' },
  CONTAINERS: { id: 'containers', label: 'Containers', color: 'var(--accent-cyan)', dimColor: 'var(--accent-cyan-dim)' },
  STORAGE: { id: 'storage', label: 'Storage', color: 'var(--accent-violet)', dimColor: 'var(--accent-violet-dim)' },
  DATABASE: { id: 'database', label: 'Databases', color: 'var(--accent-emerald)', dimColor: 'var(--accent-emerald-dim)' },
  NETWORKING: { id: 'networking', label: 'Networking & Content Delivery', color: 'var(--accent-blue)', dimColor: 'var(--accent-blue-dim)' },
  SECURITY: { id: 'security', label: 'Security, Identity & Compliance', color: 'var(--accent-rose)', dimColor: 'var(--accent-rose-dim)' },
  MESSAGING: { id: 'messaging', label: 'Application Integration', color: 'var(--accent-orange)', dimColor: 'rgba(249, 115, 22, 0.15)' },
  MANAGEMENT: { id: 'management', label: 'Management & Governance', color: 'var(--text-muted)', dimColor: 'var(--border-strong)' }
};

export const AWS_SERVICES = {
  // Compute
  aws_instance: {
    name: 'EC2 Instance',
    icon: 'ec2',
    category: SERVICE_CATEGORIES.COMPUTE,
    description: 'Virtual server in the cloud.'
  },
  aws_lambda_function: {
    name: 'Lambda Function',
    icon: 'lambda',
    category: SERVICE_CATEGORIES.COMPUTE,
    description: 'Run code without thinking about servers.'
  },
  // Containers
  aws_ecs_cluster: {
    name: 'ECS Cluster',
    icon: 'ecs',
    category: SERVICE_CATEGORIES.CONTAINERS,
    description: 'Logical grouping of tasks or services.'
  },
  aws_ecs_service: {
    name: 'ECS Service',
    icon: 'ecs',
    category: SERVICE_CATEGORIES.CONTAINERS,
    description: 'Runs and maintains specified instances of a task definition.'
  },
  aws_ecs_task_definition: {
    name: 'ECS Task Definition',
    icon: 'ecs',
    category: SERVICE_CATEGORIES.CONTAINERS,
    description: 'Blueprint that describes how a docker container should launch.'
  },
  aws_eks_cluster: {
    name: 'EKS Cluster',
    icon: 'eks',
    category: SERVICE_CATEGORIES.CONTAINERS,
    description: 'Managed Kubernetes service.'
  },
  aws_ecr_repository: {
    name: 'ECR Repository',
    icon: 'ecr',
    category: SERVICE_CATEGORIES.CONTAINERS,
    description: 'Docker container registry.'
  },
  // Storage
  aws_s3_bucket: {
    name: 'S3 Bucket',
    icon: 's3',
    category: SERVICE_CATEGORIES.STORAGE,
    description: 'Object storage built to store and retrieve any amount of data.'
  },
  // Databases
  aws_db_instance: {
    name: 'RDS DB Instance',
    icon: 'rds',
    category: SERVICE_CATEGORIES.DATABASE,
    description: 'Relational database in the cloud.'
  },
  aws_rds_cluster: {
    name: 'Aurora DB Cluster',
    icon: 'rds',
    category: SERVICE_CATEGORIES.DATABASE,
    description: 'Managed relational database engine compatible with MySQL and PostgreSQL.'
  },
  aws_dynamodb_table: {
    name: 'DynamoDB Table',
    icon: 'dynamodb',
    category: SERVICE_CATEGORIES.DATABASE,
    description: 'Key-value and document database that delivers single-digit millisecond performance.'
  },
  aws_elasticache_cluster: {
    name: 'ElastiCache Redis',
    icon: 'elasticache',
    category: SERVICE_CATEGORIES.DATABASE,
    description: 'In-memory data store and cache service.'
  },
  // Networking
  aws_vpc: {
    name: 'VPC',
    icon: 'vpc',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Logically isolated virtual network.'
  },
  aws_subnet: {
    name: 'Subnet',
    icon: 'subnet',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Range of IP addresses in your VPC.'
  },
  aws_security_group: {
    name: 'Security Group',
    icon: 'security_group',
    category: SERVICE_CATEGORIES.SECURITY,
    description: 'Virtual firewall to control inbound and outbound traffic.'
  },
  aws_lb: {
    name: 'Application Load Balancer',
    icon: 'alb',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Distributes incoming application traffic across multiple targets.'
  },
  aws_alb: {
    name: 'Application Load Balancer',
    icon: 'alb',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Distributes incoming application traffic across EC2 / containers.'
  },
  aws_route53_zone: {
    name: 'Route 53 Hosted Zone',
    icon: 'route53',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Highly available and scalable Domain Name System (DNS) web service.'
  },
  aws_route53_record: {
    name: 'Route 53 Record',
    icon: 'route53',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Routing configuration for domain name traffic.'
  },
  aws_cloudfront_distribution: {
    name: 'CloudFront Distribution',
    icon: 'cloudfront',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Fast content delivery network (CDN) service.'
  },
  aws_api_gateway_rest_api: {
    name: 'API Gateway',
    icon: 'apigateway',
    category: SERVICE_CATEGORIES.NETWORKING,
    description: 'Create, publish, maintain, monitor, and secure APIs at any scale.'
  },
  // Security
  aws_iam_role: {
    name: 'IAM Role',
    icon: 'iam',
    category: SERVICE_CATEGORIES.SECURITY,
    description: 'Identity with permission policies that determine what the identity can and cannot do.'
  },
  aws_iam_policy: {
    name: 'IAM Policy',
    icon: 'iam',
    category: SERVICE_CATEGORIES.SECURITY,
    description: 'Document that defines permissions and applies them to users, groups, or roles.'
  },
  aws_secretsmanager_secret: {
    name: 'Secrets Manager Secret',
    icon: 'secrets',
    category: SERVICE_CATEGORIES.SECURITY,
    description: 'Protect secrets needed to access applications, services, and IT resources.'
  },
  // Messaging
  aws_sns_topic: {
    name: 'SNS Topic',
    icon: 'sns',
    category: SERVICE_CATEGORIES.MESSAGING,
    description: 'Pub/sub messaging service.'
  },
  aws_sqs_queue: {
    name: 'SQS Queue',
    icon: 'sqs',
    category: SERVICE_CATEGORIES.MESSAGING,
    description: 'Managed message queuing service.'
  },
  // Management
  aws_cloudwatch_metric_alarm: {
    name: 'CloudWatch Alarm',
    icon: 'cloudwatch',
    category: SERVICE_CATEGORIES.MANAGEMENT,
    description: 'Watch metrics and receive notifications when values exceed defined thresholds.'
  }
};

/**
 * Gets details of a service by resource type.
 * Returns default metadata for unrecognized services.
 * @param {string} type - HCL resource type (e.g. 'aws_instance').
 * @returns {object} Service metadata.
 */
export function getServiceMetadata(type) {
  if (AWS_SERVICES[type]) {
    return AWS_SERVICES[type];
  }

  // Fallback for custom/unrecognized AWS resources
  if (type.startsWith('aws_')) {
    const cleanName = type.replace('aws_', '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    let cat = SERVICE_CATEGORIES.COMPUTE;
    
    if (type.includes('s3') || type.includes('bucket') || type.includes('volume')) cat = SERVICE_CATEGORIES.STORAGE;
    else if (type.includes('db') || type.includes('rds') || type.includes('table')) cat = SERVICE_CATEGORIES.DATABASE;
    else if (type.includes('vpc') || type.includes('subnet') || type.includes('route') || type.includes('gateway') || type.includes('lb')) cat = SERVICE_CATEGORIES.NETWORKING;
    else if (type.includes('iam') || type.includes('policy') || type.includes('key') || type.includes('kms') || type.includes('security')) cat = SERVICE_CATEGORIES.SECURITY;
    else if (type.includes('sqs') || type.includes('sns') || type.includes('queue') || type.includes('topic')) cat = SERVICE_CATEGORIES.MESSAGING;
    else if (type.includes('log') || type.includes('metric') || type.includes('cloudwatch')) cat = SERVICE_CATEGORIES.MANAGEMENT;

    return {
      name: `AWS ${cleanName}`,
      icon: 'aws_generic',
      category: cat,
      description: `AWS Infrastructure resource of type ${type}`
    };
  }

  // Generic non-AWS fallback
  return {
    name: type,
    icon: 'generic',
    category: SERVICE_CATEGORIES.COMPUTE,
    description: `Infrastructure resource of type ${type}`
  };
}
