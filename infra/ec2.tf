# EC2 Instance for Budget Tracker
# Deploys containers automatically on first boot - NO SSH NEEDED!

resource "aws_security_group" "ec2" {
  name        = "budget-tracker-ec2"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  # HTTP from anywhere (for testing - restrict to ALB in production)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Backend API from anywhere (for testing - restrict to ALB in production)
  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # SSH access (optional - only needed for debugging)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Restrict to your IP: ["YOUR_IP/32"]
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "budget-tracker-ec2"
  }
}

# Get latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Get AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro" # FREE TIER (750 hours/month)
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  associate_public_ip_address = true

  # User data deploys everything on first boot - NO SSH NEEDED!
  user_data = templatefile("${path.module}/ec2-user-data.sh", {
    aws_region    = data.aws_region.current.name
    aws_account   = data.aws_caller_identity.current.account_id
    database_url  = "postgresql://budget_user:budget_password@${aws_db_instance.postgres.address}:5432/budget_tracker"
    backend_image = "${aws_ecr_repository.backend.repository_url}:latest"
    frontend_image = "${aws_ecr_repository.frontend.repository_url}:latest"
  })

  # Ensure RDS is created first
  depends_on = [
    aws_db_instance.postgres,
    aws_iam_role_policy.ec2_ecr_policy
  ]

  tags = {
    Name = "budget-tracker-app"
  }
}

# Elastic IP for consistent access
resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = {
    Name = "budget-tracker-eip"
  }
}

output "ec2_public_ip" {
  description = "Public IP of EC2 instance"
  value       = aws_eip.app.public_ip
}

output "app_url" {
  description = "URL to access the application"
  value       = "http://${aws_eip.app.public_ip}"
}

output "api_url" {
  description = "URL to access the API"
  value       = "http://${aws_eip.app.public_ip}:3000/api"
}
