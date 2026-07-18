# Demo Terraform Configuration File for GridShatter

provider "aws" {
  region = "us-east-1"
}

# Network Setup
resource "aws_vpc" "app_vpc" {
  cidr_block = "10.0.0.0/16"
  
  tags = {
    name = "app-vpc"
  }
}

resource "aws_subnet" "web_subnet" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  
  tags = {
    name = "web-subnet"
  }
}

resource "aws_subnet" "db_subnet" {
  vpc_id            = aws_vpc.app_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  
  tags = {
    name = "db-subnet"
  }
}

# Security Layer
resource "aws_security_group" "allow_web" {
  name        = "allow_web_traffic"
  description = "Allow inbound web traffic"
  vpc_id      = aws_vpc.app_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Compute Server
resource "aws_instance" "web_server" {
  ami             = "ami-0c55b159cbfafe1f0"
  instance_type   = "t2.micro"
  subnet_id       = aws_subnet.web_subnet.id
  security_groups = [aws_security_group.allow_web.id]

  tags = {
    name = "web-server-inst"
  }
}

# Database Instance
resource "aws_db_instance" "app_database" {
  allocated_storage      = 10
  engine                 = "mysql"
  instance_class         = "db.t3.micro"
  db_name                = "appdb"
  username               = "admin"
  password               = "password123"
  subnet_id              = aws_subnet.db_subnet.id
  vpc_security_group_ids = [aws_security_group.allow_web.id]
}

# Storage Bucket
resource "aws_s3_bucket" "user_uploads" {
  bucket = "app-user-uploads-bucket"
  acl    = "private"
}

# Global CDN
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_s3_bucket.user_uploads.bucket_regional_domain_name
    origin_id   = "s3_origin"
  }
  
  enabled = true
}
