/**
 * practice challenges game component.
 * Allows users to learn AWS Infrastructure by writing Terraform HCL config code,
 * visualizing the results dynamically, and running test suite assertions.
 */

import { parseHCL } from '../parsers/hcl-parser.js';

export const CHALLENGES = [
  {
    id: 1,
    title: '1. S3 Asset Bucket',
    desc: 'Create an S3 bucket named application_assets.',
    diff: 'Beginner',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Create a private S3 bucket named "application_assets"
resource "aws_s3_bucket" "application_assets" {
  # Write your bucket configuration here
}
`,
    objective: 'Deploy an <code>aws_s3_bucket</code> resource named <code>application_assets</code>.',
    validate: (ast) => {
      const bucket = ast.resources.find(r => r.type === 'aws_s3_bucket');
      if (!bucket) return "Missing 'aws_s3_bucket' resource.";
      if (bucket.name !== 'application_assets') return "The resource block name must be 'application_assets'.";
      return true;
    }
  },
  {
    id: 2,
    title: '2. Compute EC2 Instance',
    desc: 'Provision a web_server instance of type t3.micro.',
    diff: 'Beginner',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Launch an EC2 instance named "web_server" of size "t3.micro"
resource "aws_instance" "web_server" {
  ami           = "ami-0c55b159cbfafe1f0"
  # Set instance_type here
}
`,
    objective: 'Configure an <code>aws_instance</code> resource named <code>web_server</code> with <code>instance_type = "t3.micro"</code>.',
    validate: (ast) => {
      const instance = ast.resources.find(r => r.type === 'aws_instance');
      if (!instance) return "Missing 'aws_instance' resource.";
      if (instance.name !== 'web_server') return "The resource block name must be 'web_server'.";
      if (instance.attributes.instance_type !== 't3.micro') return "The instance_type attribute must be 't3.micro'.";
      return true;
    }
  },
  {
    id: 3,
    title: '3. Virtual Private Cloud',
    desc: 'Deploy a network VPC with CIDR 10.0.0.0/16.',
    diff: 'Beginner',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Create a VPC named "app_vpc" with cidr_block "10.0.0.0/16"
resource "aws_vpc" "app_vpc" {
  # Add cidr_block attribute here
}
`,
    objective: 'Define an <code>aws_vpc</code> resource named <code>app_vpc</code> with <code>cidr_block = "10.0.0.0/16"</code>.',
    validate: (ast) => {
      const vpc = ast.resources.find(r => r.type === 'aws_vpc');
      if (!vpc) return "Missing 'aws_vpc' resource.";
      if (vpc.name !== 'app_vpc') return "The resource block name must be 'app_vpc'.";
      if (vpc.attributes.cidr_block !== '10.0.0.0/16') return "VPC cidr_block must be '10.0.0.0/16'.";
      return true;
    }
  },
  {
    id: 4,
    title: '4. Public Subnet Placement',
    desc: 'Deploy a subnet inside the custom VPC.',
    diff: 'Beginner',
    starter: `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# TODO: Add a subnet named "public_subnet" with cidr_block "10.0.1.0/24" inside "main" VPC
resource "aws_subnet" "public_subnet" {
  # Set vpc_id (use aws_vpc.main.id) and cidr_block here
}
`,
    objective: 'Create an <code>aws_subnet</code> named <code>public_subnet</code> with <code>cidr_block = "10.0.1.0/24"</code> referencing <code>aws_vpc.main.id</code>.',
    validate: (ast) => {
      const sub = ast.resources.find(r => r.type === 'aws_subnet');
      if (!sub) return "Missing 'aws_subnet' resource.";
      if (sub.name !== 'public_subnet') return "The resource block name must be 'public_subnet'.";
      if (sub.attributes.cidr_block !== '10.0.1.0/24') return "Subnet cidr_block must be '10.0.1.0/24'.";
      if (!sub.attributes.vpc_id || !sub.attributes.vpc_id.includes('aws_vpc.main')) {
        return "Subnet vpc_id must reference 'aws_vpc.main.id'.";
      }
      return true;
    }
  },
  {
    id: 5,
    title: '5. Security Group Firewall',
    desc: 'Allow incoming web traffic on port 80.',
    diff: 'Beginner',
    starter: `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

# TODO: Define a security group named "web_sg" that contains "80" ingress
resource "aws_security_group" "web_sg" {
  name        = "web-server-sg"
  vpc_id      = aws_vpc.main.id

  # Add ingress block allowing port 80
}
`,
    objective: 'Deploy an <code>aws_security_group</code> named <code>web_sg</code> that allows incoming traffic on port <code>80</code>.',
    validate: (ast) => {
      const sg = ast.resources.find(r => r.type === 'aws_security_group');
      if (!sg) return "Missing 'aws_security_group' resource.";
      if (sg.name !== 'web_sg') return "The resource block name must be 'web_sg'.";
      if (!sg.rawBody.includes('80')) return "The security group must allow traffic on port 80 (ingress).";
      return true;
    }
  },
  {
    id: 6,
    title: '6. Postgres RDS Database',
    desc: 'Launch a db.t3.micro Postgres RDS DB.',
    diff: 'Beginner',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Launch an RDS database "customer_db" using "postgres" and class "db.t3.micro"
resource "aws_db_instance" "customer_db" {
  allocated_storage = 20
  # Set engine and instance_class
}
`,
    objective: 'Create an <code>aws_db_instance</code> named <code>customer_db</code> with <code>engine = "postgres"</code> and <code>instance_class = "db.t3.micro"</code>.',
    validate: (ast) => {
      const db = ast.resources.find(r => r.type === 'aws_db_instance');
      if (!db) return "Missing 'aws_db_instance' resource.";
      if (db.name !== 'customer_db') return "The resource block name must be 'customer_db'.";
      if (db.attributes.engine !== 'postgres') return "The database engine must be 'postgres'.";
      if (db.attributes.instance_class !== 'db.t3.micro') return "The instance_class must be 'db.t3.micro'.";
      return true;
    }
  },
  {
    id: 7,
    title: '7. Application Load Balancer',
    desc: 'Distribute traffic with an application ALB.',
    diff: 'Intermediate',
    starter: `resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "pub_1" {
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

# TODO: Create an Application Load Balancer named "app_alb"
resource "aws_lb" "app_alb" {
  # Set load_balancer_type to "application"
}
`,
    objective: 'Create an <code>aws_lb</code> (or <code>aws_alb</code>) resource named <code>app_alb</code> with <code>load_balancer_type = "application"</code>.',
    validate: (ast) => {
      const lb = ast.resources.find(r => r.type === 'aws_lb' || r.type === 'aws_alb');
      if (!lb) return "Missing load balancer resource (aws_lb or aws_alb).";
      if (lb.name !== 'app_alb') return "The resource block name must be 'app_alb'.";
      if (lb.attributes.load_balancer_type !== 'application') return "The load_balancer_type must be 'application'.";
      return true;
    }
  },
  {
    id: 8,
    title: '8. IAM Role Security',
    desc: 'Authorize permissions with an IAM role.',
    diff: 'Intermediate',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Create an IAM role named "ecs_execution_role"
resource "aws_iam_role" "ecs_execution_role" {
  # Write IAM role configuration
}
`,
    objective: 'Provision an <code>aws_iam_role</code> resource named <code>ecs_execution_role</code>.',
    validate: (ast) => {
      const role = ast.resources.find(r => r.type === 'aws_iam_role');
      if (!role) return "Missing 'aws_iam_role' resource.";
      if (role.name !== 'ecs_execution_role') return "The resource block name must be 'ecs_execution_role'.";
      return true;
    }
  },
  {
    id: 9,
    title: '9. Simple Notification Service',
    desc: 'Create an SNS Topic for system alerts.',
    diff: 'Intermediate',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Create an SNS topic named "critical_alerts"
resource "aws_sns_topic" "critical_alerts" {
  # Write SNS topic configuration
}
`,
    objective: 'Define an <code>aws_sns_topic</code> resource named <code>critical_alerts</code>.',
    validate: (ast) => {
      const sns = ast.resources.find(r => r.type === 'aws_sns_topic');
      if (!sns) return "Missing 'aws_sns_topic' resource.";
      if (sns.name !== 'critical_alerts') return "The resource block name must be 'critical_alerts'.";
      return true;
    }
  },
  {
    id: 10,
    title: '10. Serverless Image Lambda',
    desc: 'Deploy a serverless nodejs18.x Lambda.',
    diff: 'Intermediate',
    starter: `provider "aws" {
  region = "us-east-1"
}

# TODO: Create a lambda function named "image_processor" with "nodejs18.x" runtime
resource "aws_lambda_function" "image_processor" {
  function_name = "image-processor"
  role          = "arn:aws:iam::1234567890:role/lambda-role"
  handler       = "index.handler"
  
  # Set runtime to "nodejs18.x"
}
`,
    objective: 'Add an <code>aws_lambda_function</code> resource named <code>image_processor</code> with <code>runtime = "nodejs18.x"</code>.',
    validate: (ast) => {
      const lam = ast.resources.find(r => r.type === 'aws_lambda_function');
      if (!lam) return "Missing 'aws_lambda_function' resource.";
      if (lam.name !== 'image_processor') return "The resource block name must be 'image_processor'.";
      if (lam.attributes.runtime !== 'nodejs18.x') return "The runtime must be 'nodejs18.x'.";
      return true;
    }
  },
  {
    id: 11,
    title: '11. ECS Fargate Microservice',
    desc: 'Configure an ECS Cluster, Task Definition, and Fargate Service.',
    diff: 'Advanced',
    starter: `provider "aws" {
  region = "us-east-1"
}

resource "aws_ecs_cluster" "app_cluster" {
  name = "production-cluster"
}

# TODO: Define an aws_ecs_task_definition named "app_task" with FARGATE compatibility and network_mode = "awsvpc"
# TODO: Create an aws_ecs_service named "app_service" targeting "app_cluster" and "app_task"
`,
    objective: 'Define an <code>aws_ecs_task_definition</code> named <code>app_task</code> using <code>FARGATE</code> compatibility and <code>network_mode = "awsvpc"</code>, and an <code>aws_ecs_service</code> named <code>app_service</code> linked to both.',
    validate: (ast) => {
      const cluster = ast.resources.find(r => r.type === 'aws_ecs_cluster');
      if (!cluster) return "Missing 'aws_ecs_cluster' resource.";
      if (cluster.name !== 'app_cluster') return "The ECS Cluster resource name must be 'app_cluster'.";

      const taskDef = ast.resources.find(r => r.type === 'aws_ecs_task_definition');
      if (!taskDef) return "Missing 'aws_ecs_task_definition' resource.";
      if (taskDef.name !== 'app_task') return "The Task Definition resource name must be 'app_task'.";
      if (!taskDef.rawBody.includes('FARGATE')) return "The Task Definition must use FARGATE compatibility.";
      if (taskDef.attributes.network_mode !== 'awsvpc') return "The Task Definition network_mode must be 'awsvpc'.";

      const service = ast.resources.find(r => r.type === 'aws_ecs_service');
      if (!service) return "Missing 'aws_ecs_service' resource.";
      if (service.name !== 'app_service') return "The ECS Service resource name must be 'app_service'.";
      if (!service.attributes.cluster || !service.attributes.cluster.includes('aws_ecs_cluster.app_cluster')) {
        return "The ECS Service must reference the 'aws_ecs_cluster.app_cluster' ID.";
      }
      if (!service.attributes.task_definition || !service.attributes.task_definition.includes('aws_ecs_task_definition.app_task')) {
        return "The ECS Service must reference the 'aws_ecs_task_definition.app_task' ARN.";
      }
      return true;
    }
  },
  {
    id: 12,
    title: '12. Serverless API Backend',
    desc: 'Build a secure API using API Gateway, Lambda, and DynamoDB.',
    diff: 'Advanced',
    starter: `provider "aws" {
  region = "us-east-1"
}

resource "aws_dynamodb_table" "orders_table" {
  name         = "orders-db"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "OrderId"

  attribute {
    name = "OrderId"
    type = "S"
  }
}

# TODO: Define an aws_lambda_function named "api_handler" with runtime "nodejs18.x"
# that references the aws_dynamodb_table.orders_table name or ARN.
# TODO: Define an aws_api_gateway_rest_api named "serverless_api".
`,
    objective: 'Deploy an <code>aws_lambda_function</code> named <code>api_handler</code> (runtime <code>nodejs18.x</code>) referencing the DynamoDB table name or ARN, and an <code>aws_api_gateway_rest_api</code> named <code>serverless_api</code>.',
    validate: (ast) => {
      const table = ast.resources.find(r => r.type === 'aws_dynamodb_table');
      if (!table) return "Missing 'aws_dynamodb_table' resource.";
      if (table.name !== 'orders_table') return "The DynamoDB table resource name must be 'orders_table'.";
      if (table.attributes.hash_key !== 'OrderId') return "The DynamoDB table hash_key must be 'OrderId'.";

      const lambda = ast.resources.find(r => r.type === 'aws_lambda_function');
      if (!lambda) return "Missing 'aws_lambda_function' resource.";
      if (lambda.name !== 'api_handler') return "The Lambda function resource name must be 'api_handler'.";
      if (lambda.attributes.runtime !== 'nodejs18.x') return "The Lambda function runtime must be 'nodejs18.x'.";
      if (!lambda.rawBody.includes('aws_dynamodb_table.orders_table')) {
        return "The Lambda function must reference the 'aws_dynamodb_table.orders_table' (e.g. in its variables or environment settings).";
      }

      const api = ast.resources.find(r => r.type === 'aws_api_gateway_rest_api');
      if (!api) return "Missing 'aws_api_gateway_rest_api' resource.";
      if (api.name !== 'serverless_api') return "The API Gateway resource name must be 'serverless_api'.";
      return true;
    }
  },
  {
    id: 13,
    title: '13. HA Multi-AZ Load Balancer',
    desc: 'Distribute traffic across two subnets in different availability zones.',
    diff: 'Expert',
    starter: `resource "aws_vpc" "ha_vpc" {
  cidr_block = "10.0.0.0/16"
}

# TODO: Create two subnets:
# - "subnet_az1" with cidr_block "10.0.1.0/24" in "ha_vpc"
# - "subnet_az2" with cidr_block "10.0.2.0/24" in "ha_vpc"
# TODO: Create an aws_lb named "ha_alb" spanning both subnets
`,
    objective: 'Create two subnets (<code>subnet_az1</code>: <code>10.0.1.0/24</code> and <code>subnet_az2</code>: <code>10.0.2.0/24</code>) inside <code>ha_vpc</code>, and an Application Load Balancer named <code>ha_alb</code> configured to use both subnets.',
    validate: (ast) => {
      const vpc = ast.resources.find(r => r.type === 'aws_vpc');
      if (!vpc) return "Missing 'aws_vpc' resource.";
      if (vpc.name !== 'ha_vpc') return "The VPC resource name must be 'ha_vpc'.";
      if (vpc.attributes.cidr_block !== '10.0.0.0/16') return "VPC cidr_block must be '10.0.0.0/16'.";

      const sub1 = ast.resources.find(r => r.type === 'aws_subnet' && r.name === 'subnet_az1');
      const sub2 = ast.resources.find(r => r.type === 'aws_subnet' && r.name === 'subnet_az2');
      if (!sub1) return "Missing 'aws_subnet' named 'subnet_az1'.";
      if (!sub2) return "Missing 'aws_subnet' named 'subnet_az2'.";

      if (sub1.attributes.cidr_block !== '10.0.1.0/24') return "subnet_az1 cidr_block must be '10.0.1.0/24'.";
      if (sub2.attributes.cidr_block !== '10.0.2.0/24') return "subnet_az2 cidr_block must be '10.0.2.0/24'.";

      if (!sub1.attributes.vpc_id || !sub1.attributes.vpc_id.includes('aws_vpc.ha_vpc')) return "subnet_az1 must reference 'aws_vpc.ha_vpc.id'.";
      if (!sub2.attributes.vpc_id || !sub2.attributes.vpc_id.includes('aws_vpc.ha_vpc')) return "subnet_az2 must reference 'aws_vpc.ha_vpc.id'.";

      const alb = ast.resources.find(r => r.type === 'aws_lb' || r.type === 'aws_alb');
      if (!alb) return "Missing Load Balancer resource (aws_lb/aws_alb).";
      if (alb.name !== 'ha_alb') return "The Load Balancer resource name must be 'ha_alb'.";
      
      const isAppType = alb.attributes.load_balancer_type === 'application' || alb.rawBody.includes('"application"');
      if (!isAppType) return "The load_balancer_type must be 'application'.";

      const subnetsVal = alb.attributes.subnets || alb.rawBody || '';
      if (!subnetsVal.includes('aws_subnet.subnet_az1') || !subnetsVal.includes('aws_subnet.subnet_az2')) {
        return "The Load Balancer must be deployed across both subnets: 'subnet_az1' and 'subnet_az2'.";
      }

      return true;
    }
  },
  {
    id: 14,
    title: '14. Event-Driven Messaging',
    desc: 'Create an event-driven flow from S3 to SQS via SNS.',
    diff: 'Expert',
    starter: `provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "event_bucket" {
  bucket = "event-driven-uploads"
}

# TODO: Define an aws_sns_topic named "fanout_topic"
# TODO: Define an aws_s3_bucket_notification named "bucket_notification" that links "event_bucket" to "fanout_topic"
# TODO: Define an aws_sqs_queue named "processing_queue"
# TODO: Create an aws_sns_topic_subscription named "queue_sub" linking the SNS topic to SQS queue
`,
    objective: 'Provision an <code>aws_s3_bucket</code> named <code>event_bucket</code>, an <code>aws_sns_topic</code> named <code>fanout_topic</code>, an <code>aws_s3_bucket_notification</code> named <code>bucket_notification</code> routing bucket events to the topic, an <code>aws_sqs_queue</code> named <code>processing_queue</code>, and subscribe the queue to the topic using <code>aws_sns_topic_subscription</code> named <code>queue_sub</code>.',
    validate: (ast) => {
      const bucket = ast.resources.find(r => r.type === 'aws_s3_bucket');
      if (!bucket) return "Missing 'aws_s3_bucket' resource.";
      if (bucket.name !== 'event_bucket') return "The S3 bucket resource name must be 'event_bucket'.";

      const topic = ast.resources.find(r => r.type === 'aws_sns_topic');
      if (!topic) return "Missing 'aws_sns_topic' resource.";
      if (topic.name !== 'fanout_topic') return "The SNS topic resource name must be 'fanout_topic'.";

      const notification = ast.resources.find(r => r.type === 'aws_s3_bucket_notification');
      if (!notification) return "Missing 'aws_s3_bucket_notification' resource to trigger the SNS topic.";
      if (notification.name !== 'bucket_notification') return "The bucket notification resource name must be 'bucket_notification'.";
      if (!notification.attributes.bucket || !notification.attributes.bucket.includes('aws_s3_bucket.event_bucket')) {
        return "The bucket notification must reference 'aws_s3_bucket.event_bucket.id'.";
      }
      if (!notification.rawBody.includes('aws_sns_topic.fanout_topic')) {
        return "The bucket notification must reference the 'aws_sns_topic.fanout_topic.arn' as the notification target.";
      }

      const queue = ast.resources.find(r => r.type === 'aws_sqs_queue');
      if (!queue) return "Missing 'aws_sqs_queue' resource.";
      if (queue.name !== 'processing_queue') return "The SQS queue resource name must be 'processing_queue'.";

      const sub = ast.resources.find(r => r.type === 'aws_sns_topic_subscription');
      if (!sub) return "Missing 'aws_sns_topic_subscription' resource.";
      if (sub.name !== 'queue_sub') return "The subscription resource name must be 'queue_sub'.";
      if (!sub.attributes.topic_arn || !sub.attributes.topic_arn.includes('aws_sns_topic.fanout_topic')) {
        return "The subscription topic_arn must reference 'aws_sns_topic.fanout_topic.arn'.";
      }
      if (!sub.attributes.endpoint || !sub.attributes.endpoint.includes('aws_sqs_queue.processing_queue')) {
        return "The subscription endpoint must reference 'aws_sqs_queue.processing_queue.arn'.";
      }
      return true;
    }
  }
];

export class ChallengesGame {
  /**
   * @param {HTMLElement} containerElement - Tab content container.
   * @param {object} callbacks - Actions to execute in App: { onCodeChange, onValidateSuccess }
   */
  constructor(containerElement, callbacks) {
    this.container = containerElement;
    this.callbacks = callbacks;
    
    // Game State
    this.clearedIds = this.loadClearedState();
    this.activeChallenge = null;

    this.init();
  }

  init() {
    this.render();
  }

  loadClearedState() {
    try {
      const saved = localStorage.getItem('aws_simulator_cleared_challenges');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  saveClearedState() {
    try {
      localStorage.setItem('aws_simulator_cleared_challenges', JSON.stringify(this.clearedIds));
    } catch (e) {
      console.error(e);
    }
  }

  render() {
    if (this.activeChallenge) {
      this.renderChallengeDetail(this.activeChallenge);
    } else {
      this.renderChallengesList();
    }
  }

  renderChallengesList() {
    const totalCount = CHALLENGES.length;
    const clearedCount = this.clearedIds.length;
    const progressPercent = Math.round((clearedCount / totalCount) * 100);

    this.container.innerHTML = `
      <div id="game-tab-content">
        <!-- Progress Bar Header -->
        <div style="padding: var(--space-4) var(--space-4) 0; flex-shrink: 0;">
          <div style="display: flex; justify-content: space-between; font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 6px;">
            <span style="font-weight: 600;">Arcade Progress</span>
            <span>${clearedCount}/${totalCount} Cleared (${progressPercent}%)</span>
          </div>
          <div style="width: 100%; height: 6px; background: var(--border-default); border-radius: 3px; overflow: hidden;">
            <div style="width: ${progressPercent}%; height: 100%; background: var(--accent-emerald); transition: width 0.3s;"></div>
          </div>
        </div>

        <div class="challenges-list">
          ${CHALLENGES.map(c => {
            const isCleared = this.clearedIds.includes(c.id);
            return `
              <button class="challenge-item ${isCleared ? 'cleared' : ''}" data-id="${c.id}">
                <div class="challenge-status">
                  ${isCleared ? '✓' : c.id}
                </div>
                <div class="challenge-info">
                  <span class="challenge-title">${c.title}</span>
                  <div style="display: flex; gap: var(--space-2); margin-top: 2px;">
                    <span class="challenge-diff">${c.diff}</span>
                    <span style="font-size: 9px; color: var(--text-muted);">•</span>
                    <span style="font-size: 9px; color: var(--text-muted); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 170px;">${c.desc}</span>
                  </div>
                </div>
                <div style="color: var(--text-muted); font-size: 14px;">➔</div>
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Bind list clicks
    this.container.querySelectorAll('.challenge-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.dataset.id, 10);
        const challenge = CHALLENGES.find(c => c.id === id);
        if (challenge) {
          this.activeChallenge = challenge;
          this.render();
        }
      });
    });
  }

  renderChallengeDetail(challenge) {
    const isCleared = this.clearedIds.includes(challenge.id);

    this.container.innerHTML = `
      <div class="challenge-detail">
        <div class="challenge-detail-header">
          <button class="back-btn" id="btn-challenge-back" title="Back to challenge list">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div style="min-width: 0;">
            <span style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--accent-cyan);">${challenge.diff} Challenge</span>
            <h3 style="font-size: var(--text-sm); font-weight: 700; color: var(--text-primary); margin-top: -2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${challenge.title}</h3>
          </div>
        </div>

        <div class="challenge-detail-body">
          <div class="challenge-objective">
            <h4>Objective</h4>
            <p>${challenge.objective}</p>
          </div>

          <div class="editor-container">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="editor-label">Terraform Template</span>
              ${isCleared ? '<span style="font-size: 10px; color: var(--accent-emerald); font-weight: 600;">✓ Cleared</span>' : ''}
            </div>
            <textarea class="challenge-textarea" id="txt-challenge-editor" spellcheck="false">${challenge.starter}</textarea>
          </div>

          <div class="challenge-actions">
            <button class="btn-primary" id="btn-challenge-validate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>Validate & Simulate</span>
            </button>
          </div>

          <div class="challenge-validation-result" id="challenge-alert"></div>
        </div>
      </div>
    `;

    // Bind back button
    this.container.querySelector('#btn-challenge-back').addEventListener('click', () => {
      this.activeChallenge = null;
      this.render();
    });

    // Bind validate button
    this.container.querySelector('#btn-challenge-validate').addEventListener('click', () => {
      this.validateChallenge();
    });
  }

  validateChallenge() {
    const code = this.container.querySelector('#txt-challenge-editor').value;
    const alertBox = this.container.querySelector('#challenge-alert');
    
    alertBox.className = 'challenge-validation-result';
    alertBox.style.display = 'none';

    // 1. Syntactic AST Verification using parser
    const ast = parseHCL(code);
    const criticalError = ast.errors.some(e => e.severity === 'error');
    
    if (criticalError) {
      alertBox.classList.add('error');
      alertBox.innerHTML = `<strong>Syntax Error:</strong> ${ast.errors[0].message}<br><small>${ast.errors[0].suggestion}</small>`;
      alertBox.style.display = 'block';
      
      if (this.callbacks.onCodeChange) {
        this.callbacks.onCodeChange(code, false); // Triggers preview parsing error simulation
      }
      return;
    }

    // 2. Run challenge assertions
    const validationResult = this.activeChallenge.validate(ast);
    if (validationResult === true) {
      // SUCCESS!
      alertBox.classList.add('success');
      alertBox.innerHTML = `<strong>Success!</strong> Challenge cleared successfully! Visualizing infrastructure... 🎉`;
      alertBox.style.display = 'block';

      // Update cleared list
      if (!this.clearedIds.includes(this.activeChallenge.id)) {
        this.clearedIds.push(this.activeChallenge.id);
        this.saveClearedState();
      }

      if (this.callbacks.onValidateSuccess) {
        this.callbacks.onValidateSuccess(this.activeChallenge, code);
      }
    } else {
      // Failed assertions
      alertBox.classList.add('error');
      alertBox.innerHTML = `<strong>Validation Failed:</strong> ${validationResult}`;
      alertBox.style.display = 'block';

      if (this.callbacks.onCodeChange) {
        this.callbacks.onCodeChange(code, true); // Runs simulator on valid syntax but shows error alert here
      }
    }
  }
}
