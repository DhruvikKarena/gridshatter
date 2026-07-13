/**
 * Pre-defined complex sample files for Terraform HCL and CircleCI configurations.
 */

export const SAMPLES = {
  terraform_complex: {
    title: 'AWS Web Application stack',
    desc: 'VPC, 2 Subnets, ALB, Security Group, EC2 Instance, RDS database, and S3 Bucket',
    type: 'hcl',
    filename: 'main.tf',
    content: `# AWS Web Application Infrastructure Stack

provider "aws" {
  region = "us-east-1"
}

# 1. Network Layer
resource "aws_vpc" "production_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  
  tags = {
    name = "production-vpc"
  }
}

resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.production_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    name = "public-subnet-1a"
  }
}

resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.production_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    name = "private-subnet-1b"
  }
}

# 2. Security Layer
resource "aws_security_group" "web_security_group" {
  name        = "web-server-sg"
  description = "Allow HTTP inbound traffic"
  vpc_id      = aws_vpc.production_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 3. Compute Layer
resource "aws_instance" "web_application_server" {
  ami             = "ami-0c55b159cbfafe1f0"
  instance_type   = "t3.medium"
  subnet_id       = aws_subnet.public_subnet.id
  security_groups = [aws_security_group.web_security_group.id]

  tags = {
    name = "web-server"
  }
}

# 4. Database Layer (in private subnet)
resource "aws_db_instance" "postgres_database" {
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "14.1"
  instance_class         = "db.t4g.medium"
  db_name                = "production_db"
  username               = "db_admin"
  password               = "supersecretpassword123"
  db_subnet_group_name   = "db-subnet-group"
  vpc_security_group_ids = [aws_security_group.web_security_group.id]
  subnet_id              = aws_subnet.private_subnet.id
}

# 5. Storage Layer
resource "aws_s3_bucket" "application_assets_bucket" {
  bucket = "prod-assets-static-bucket-983"
  acl    = "private"
}

# 6. Load Balancing
resource "aws_lb" "application_load_balancer" {
  name               = "web-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.web_security_group.id]
  subnets            = [aws_subnet.public_subnet.id]
}
`
  },

  circleci_complex: {
    title: 'CircleCI Pipeline to AWS ECS',
    desc: 'Builds docker image, pushes to ECR registry, and triggers ECS container service deploy',
    type: 'yaml',
    filename: 'config.yml',
    content: `# CircleCI Configuration Pipeline
version: 2.1

orbs:
  aws-ecr: circleci/aws-ecr@8.2.1
  aws-ecs: circleci/aws-ecs@4.0.0

executors:
  node-executor:
    docker:
      - image: cimg/node:18.16.0

jobs:
  checkout-and-test:
    executor: node-executor
    steps:
      - checkout
      - run:
          name: Install Dependencies
          command: npm install
      - run:
          name: Execute Test Suites
          command: npm run test

  build-and-push-image:
    machine: true
    steps:
      - checkout
      - run:
          name: Build Application Container
          command: docker build -t app-image:latest .
      - run:
          name: Authenticate and Push to AWS ECR
          command: |
            aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 1234567890.dkr.ecr.us-east-1.amazonaws.com
            docker tag app-image:latest 1234567890.dkr.ecr.us-east-1.amazonaws.com/app-repo:latest
            docker push 1234567890.dkr.ecr.us-east-1.amazonaws.com/app-repo:latest

  deploy-to-ecs:
    executor: node-executor
    steps:
      - run:
          name: Update ECS Service Task Definition
          command: |
            aws ecs register-task-definition --family web-service --container-definitions "[{\\"name\\":\\"web\\",\\"image\\":\\"1234567890.dkr.ecr.us-east-1.amazonaws.com/app-repo:latest\\"}]"
            aws ecs update-service --cluster production-cluster --service web-service --force-new-deployment

workflows:
  version: 2
  build-test-deploy:
    jobs:
      - checkout-and-test
      - build-and-push-image:
          requires:
            - checkout-and-test
      - deploy-to-ecs:
          requires:
            - build-and-push-image
`
  }
};

export class SampleSelector {
  /**
   * @param {HTMLElement} containerElement - Container to render into.
   * @param {function} onSelect - Callback when a sample is selected.
   */
  constructor(containerElement, onSelect) {
    this.container = containerElement;
    this.onSelect = onSelect;
    this.isOpen = false;

    this.init();
  }

  init() {
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div style="position: relative;">
        <button class="sample-btn" id="btn-samples-dropdown">
          <span>Try a Sample File</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        
        <div class="sample-dropdown ${this.isOpen ? '' : 'hidden'}" id="samples-dropdown-menu">
          ${Object.entries(SAMPLES).map(([key, sample]) => `
            <button class="sample-item" data-key="${key}">
              <span class="sample-item-icon">${sample.type === 'hcl' ? '🛠️' : '⚙️'}</span>
              <div class="sample-item-text">
                <span class="sample-item-title">${sample.title}</span>
                <span class="sample-item-desc">${sample.desc}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    const dropdownBtn = this.container.querySelector('#btn-samples-dropdown');
    dropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
      this.container.querySelector('#samples-dropdown-menu').classList.toggle('hidden');
    });

    // Close on click outside
    window.addEventListener('click', () => {
      if (this.isOpen) {
        this.isOpen = false;
        this.container.querySelector('#samples-dropdown-menu').classList.add('hidden');
      }
    });

    // Handle items click
    this.container.querySelectorAll('.sample-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.key;
        const sample = SAMPLES[key];
        if (sample && this.onSelect) {
          this.onSelect(sample);
        }
      });
    });
  }
}
