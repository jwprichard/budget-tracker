# COST REDUCTION OPTION: Single EC2 Instance Instead of Fargate
# Rename this file to ec2.tf and delete/disable ecs.tf to use this approach
# This runs both frontend and backend on a single t3.micro instance (FREE TIER)

# Cost: FREE for first 12 months (750 hours/month)
# After free tier: ~$8/month

resource "aws_security_group" "ec2" {
  name        = "budget-tracker-ec2"
  description = "Security group for EC2 instance"
  vpc_id      = aws_vpc.main.id

  # SSH access (restrict to your IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # HTTP from ALB
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Backend API
  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
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

resource "aws_instance" "app" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = "t3.micro" # FREE TIER (750 hours/month)
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2.id]

  associate_public_ip_address = true

  user_data = <<-EOF
              #!/bin/bash
              # Install Docker
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker
              usermod -a -G docker ec2-user

              # Install Docker Compose
              curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
              chmod +x /usr/local/bin/docker-compose

              # Clone repo and start services
              # You'll need to set this up via SSH after initial deployment
              EOF

#  # ---- REMOTE EXEC BLOCK ----
#   provisioner "remote-exec" {
#     connection {
#       type        = "ssh"
#       host        = self.public_ip          # Must be reachable
#       user        = "ec2-user"
#       private_key = file("~/.ssh/id_rsa")   # Path to your key
#     }

#     # Commands to run after instance is up
#     inline = [
#       "docker --version",
#       "docker-compose --version",
#       "cd /home/ec2-user/app && docker-compose up -d",
#       "cd /home/ec2-user/app/backend && npx prisma migrate deploy"
#     ]
#   }

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
  value = aws_eip.app.public_ip
}

output "ec2_ssh_command" {
  value = "ssh ec2-user@${aws_eip.app.public_ip}"
}
